const footballRoutes = require('../routes/football.routes');
const {
  processLiveMatchNotifications,
  processMatchReminder,
} = require('./matchNotifications.service');

const CASTELLON_TEAM_ID = Number(
  process.env.SPORTMONKS_CASTELLON_TEAM_ID || 10008
);
const CASTELLON_B_TEAM_ID = Number(
  process.env.SPORTMONKS_CASTELLON_B_TEAM_ID || 29495
);

const TRACKED_TEAM_IDS = new Set([
  CASTELLON_TEAM_ID,
  CASTELLON_B_TEAM_ID,
]);

const LIVE_POLL_MS = Number(process.env.MATCH_NOTIFICATIONS_LIVE_POLL_MS || 20_000);
const SOON_POLL_MS = Number(process.env.MATCH_NOTIFICATIONS_SOON_POLL_MS || 60_000);
const UPCOMING_POLL_MS = Number(process.env.MATCH_NOTIFICATIONS_UPCOMING_POLL_MS || 5 * 60_000);
const IDLE_POLL_MS = Number(process.env.MATCH_NOTIFICATIONS_IDLE_POLL_MS || 15 * 60_000);
const SCHEDULE_REFRESH_MS = Number(process.env.MATCH_NOTIFICATIONS_SCHEDULE_REFRESH_MS || 15 * 60_000);

const FINISHED_STATES = new Set(['FT', 'AET', 'PEN']);
const MATCH_REMINDER_MINUTES = Number(
  process.env.MATCH_NOTIFICATION_REMINDER_MINUTES || 30
);
const MATCH_REMINDER_WINDOW_MINUTES = Number(
  process.env.MATCH_NOTIFICATION_REMINDER_WINDOW_MINUTES || 2
);

let pollTimer = null;
let pollPromise = null;
let stopped = true;
let scheduleCache = [];
let scheduleSavedAt = 0;

const trackedLiveFixtures = new Map();

function getParticipantIds(fixture) {
  return (fixture?.participants || [])
    .map((participant) => Number(participant?.id))
    .filter(Number.isFinite);
}

function isTrackedFixture(fixture) {
  return getParticipantIds(fixture).some((id) => TRACKED_TEAM_IDS.has(id));
}

function getState(fixture) {
  return String(fixture?.state?.short_name || '').toUpperCase();
}

function parseSportmonksDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  const timestamp = Date.parse(
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`
  );
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

async function fetchTeamSchedule(teamId, from, to) {
  const response = await footballRoutes.sportmonksFetch(
    `/fixtures/between/${from}/${to}/${teamId}?include=participants;state`
  );
  return Array.isArray(response?.data) ? response.data : [];
}

async function refreshSchedule({ force = false } = {}) {
  const now = Date.now();
  if (!force && scheduleSavedAt && now - scheduleSavedAt < SCHEDULE_REFRESH_MS) {
    return scheduleCache;
  }

  const from = formatDateOnly(new Date(now - 24 * 60 * 60 * 1000));
  const to = formatDateOnly(new Date(now + 8 * 24 * 60 * 60 * 1000));

  const [firstTeam, reserveTeam] = await Promise.all([
    fetchTeamSchedule(CASTELLON_TEAM_ID, from, to),
    fetchTeamSchedule(CASTELLON_B_TEAM_ID, from, to),
  ]);

  const byId = new Map();
  for (const fixture of [...firstTeam, ...reserveTeam]) {
    const fixtureId = Number(fixture?.id);
    if (Number.isFinite(fixtureId) && isTrackedFixture(fixture)) {
      byId.set(fixtureId, fixture);
    }
  }

  scheduleCache = [...byId.values()].sort(
    (a, b) =>
      (parseSportmonksDate(a?.starting_at) ?? Infinity) -
      (parseSportmonksDate(b?.starting_at) ?? Infinity)
  );
  scheduleSavedAt = now;
  return scheduleCache;
}

function getRelevantFixtures(fixtures) {
  const now = Date.now();
  return fixtures.filter((fixture) => {
    if (FINISHED_STATES.has(getState(fixture))) return false;
    const timestamp = parseSportmonksDate(fixture?.starting_at);
    if (timestamp === null) return false;
    return (timestamp - now) / 60_000 >= -180;
  });
}

function rememberFixture(fixture) {
  if (!isTrackedFixture(fixture)) return;
  const fixtureId = Number(fixture?.id);
  if (!Number.isFinite(fixtureId)) return;
  trackedLiveFixtures.set(fixtureId, {
    fixtureId,
    startingAt: fixture?.starting_at || null,
    lastSeenAt: Date.now(),
  });
}

function rememberScheduledFixtures(fixtures) {
  const now = Date.now();
  for (const fixture of getRelevantFixtures(fixtures)) {
    const timestamp = parseSportmonksDate(fixture?.starting_at);
    if (timestamp === null) continue;
    const minutesUntilMatch = (timestamp - now) / 60_000;
    if (minutesUntilMatch <= 30) rememberFixture(fixture);
  }
}

function rememberLiveFixtures(fixtures) {
  for (const fixture of fixtures) rememberFixture(fixture);
}

function getNextPollMs(scheduleFixtures, trackedInplayCount) {
  if (trackedInplayCount > 0 || trackedLiveFixtures.size > 0) {
    return LIVE_POLL_MS;
  }

  const relevant = getRelevantFixtures(scheduleFixtures);
  if (relevant.length === 0) return IDLE_POLL_MS;

  const now = Date.now();
  const times = relevant
    .map((fixture) => parseSportmonksDate(fixture?.starting_at))
    .filter(Number.isFinite);

  if (times.length === 0) return UPCOMING_POLL_MS;

  const minutesUntilMatch = (Math.min(...times) - now) / 60_000;

  if (minutesUntilMatch <= 30 && minutesUntilMatch >= -180) {
    return LIVE_POLL_MS;
  }
  if (minutesUntilMatch <= 120) return SOON_POLL_MS;
  return UPCOMING_POLL_MS;
}

async function checkDisappearedFixtures(currentFixtures) {
  const currentIds = new Set(
    currentFixtures
      .filter(isTrackedFixture)
      .map((fixture) => Number(fixture?.id))
      .filter(Number.isFinite)
  );

  const results = [];

  for (const [fixtureId] of trackedLiveFixtures) {
    if (currentIds.has(fixtureId)) continue;

    try {
      const response = await footballRoutes.sportmonksFetch(
        `/fixtures/${fixtureId}?include=participants;scores;state;periods;league;events.type;events.subType`
      );
      const fixture = response?.data;

      if (!fixture) {
        results.push({ fixtureId, ok: false, reason: 'fixture-not-found' });
        continue;
      }

      const notificationResult = await processLiveMatchNotifications([fixture]);
      const state = getState(fixture);

      results.push({ fixtureId, ok: true, state, notificationResult });

      if (FINISHED_STATES.has(state)) {
        trackedLiveFixtures.delete(fixtureId);
      }
    } catch (error) {
      console.error(
        `Error comprobando fixture ${fixtureId} tras desaparecer de inplay:`,
        error
      );
      results.push({ fixtureId, ok: false, error: error.message });
    }
  }

  return results;
}

async function processScheduledReminders(fixtures) {
  const now = Date.now();
  const results = [];

  for (const fixture of getRelevantFixtures(fixtures)) {
    const state = getState(fixture);
    if (state && state !== 'NS') continue;

    const timestamp = parseSportmonksDate(fixture?.starting_at);
    if (timestamp === null) continue;

    const minutesUntilMatch = (timestamp - now) / 60_000;
    const lowerBound =
      MATCH_REMINDER_MINUTES - MATCH_REMINDER_WINDOW_MINUTES;
    const upperBound =
      MATCH_REMINDER_MINUTES + MATCH_REMINDER_WINDOW_MINUTES;

    if (
      minutesUntilMatch < lowerBound ||
      minutesUntilMatch > upperBound
    ) {
      continue;
    }

    try {
      const result = await processMatchReminder(fixture);
      results.push({
        fixtureId: Number(fixture?.id),
        minutesUntilMatch,
        ...result,
      });
    } catch (error) {
      console.error(
        `Error enviando recordatorio del fixture ${fixture?.id}:`,
        error
      );
      results.push({
        fixtureId: Number(fixture?.id),
        minutesUntilMatch,
        sent: false,
        error: error.message,
      });
    }
  }

  return results;
}

async function runMatchNotificationsPoll() {
  if (pollPromise) return pollPromise;

  pollPromise = (async () => {
    let scheduleFixtures = scheduleCache;
    let scheduleError = null;

    try {
      scheduleFixtures = await refreshSchedule();
    } catch (error) {
      scheduleError = error;
      console.error('Error actualizando agenda de notificaciones:', error);
    }

    rememberScheduledFixtures(scheduleFixtures);
    const reminders = await processScheduledReminders(scheduleFixtures);

    const shouldCheckInplay =
      trackedLiveFixtures.size > 0 ||
      getNextPollMs(scheduleFixtures, 0) <= LIVE_POLL_MS;

    let inplayFixtures = [];
    let trackedInplay = [];

    if (shouldCheckInplay) {
      const fixtures = await footballRoutes.getSportmonksInplayFixtures();
      inplayFixtures = Array.isArray(fixtures) ? fixtures : [];
      trackedInplay = inplayFixtures.filter(isTrackedFixture);
      rememberLiveFixtures(trackedInplay);
    }

    const disappeared =
      trackedLiveFixtures.size > 0
        ? await checkDisappearedFixtures(inplayFixtures)
        : [];

    const nextPollMs = getNextPollMs(scheduleFixtures, trackedInplay.length);

    return {
      ok: true,
      scheduleCount: scheduleFixtures.length,
      scheduleError: scheduleError ? scheduleError.message : null,
      checkedInplay: shouldCheckInplay,
      inplayCount: inplayFixtures.length,
      trackedInplayCount: trackedInplay.length,
      watchedFixtureIds: [...trackedLiveFixtures.keys()],
      reminders,
      disappeared,
      nextPollMs,
    };
  })();

  try {
    return await pollPromise;
  } finally {
    pollPromise = null;
  }
}

function scheduleNextPoll(delayMs) {
  if (stopped) return;

  const safeDelay =
    Number.isFinite(Number(delayMs)) && Number(delayMs) >= 1_000
      ? Number(delayMs)
      : IDLE_POLL_MS;

  clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    let nextDelay = IDLE_POLL_MS;

    try {
      const result = await runMatchNotificationsPoll();
      nextDelay = result.nextPollMs;

      if (
        result.trackedInplayCount > 0 ||
        result.watchedFixtureIds.length > 0 ||
        result.reminders.length > 0 ||
        result.disappeared.length > 0
      ) {
        console.log('Poll notificaciones LIVE:', result);
      }
    } catch (error) {
      console.error('Error en poll de notificaciones LIVE:', error);
      nextDelay = SOON_POLL_MS;
    } finally {
      scheduleNextPoll(nextDelay);
    }
  }, safeDelay);

  if (typeof pollTimer.unref === 'function') pollTimer.unref();
}

function startMatchNotificationsPoller({ immediate = true } = {}) {
  if (!stopped) return { ok: true, alreadyRunning: true };

  stopped = false;
  console.log(
    'Poller adaptativo de notificaciones LIVE iniciado (20s / 60s / 5m / 15m)'
  );

  scheduleNextPoll(immediate ? 1_000 : IDLE_POLL_MS);

  return {
    ok: true,
    started: true,
    adaptive: true,
    intervals: {
      liveMs: LIVE_POLL_MS,
      soonMs: SOON_POLL_MS,
      upcomingMs: UPCOMING_POLL_MS,
      idleMs: IDLE_POLL_MS,
    },
  };
}

function stopMatchNotificationsPoller() {
  stopped = true;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  return { ok: true, stopped: true };
}

module.exports = {
  runMatchNotificationsPoll,
  startMatchNotificationsPoller,
  stopMatchNotificationsPoller,
};
