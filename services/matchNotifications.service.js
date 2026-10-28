const supabase = require('../config/supabase');
const {
  sendPushNotification,
} = require('./expoPush.service');

const CASTELLON_TEAM_ID = Number(
  process.env.SPORTMONKS_CASTELLON_TEAM_ID || 10008
);
const CASTELLON_B_TEAM_ID = Number(
  process.env.SPORTMONKS_CASTELLON_B_TEAM_ID || 29495
);

const TRACKED_TEAMS = new Map([
  [CASTELLON_TEAM_ID, { key: 'castellon', name: 'CD Castellón' }],
  [CASTELLON_B_TEAM_ID, { key: 'castellon_b', name: 'CD Castellón B' }],
]);

const START_STATES = new Set(['1st', '1H', 'LIVE']);
const HALFTIME_STATES = new Set(['HT', 'BREAK']);
const FULLTIME_STATES = new Set(['FT', 'AET', 'PEN']);
const START_NOTIFICATION_MAX_MINUTE = 3;

function getParticipant(fixture, location) {
  return (fixture?.participants || []).find(
    (team) => team?.meta?.location === location
  );
}

function getCurrentScore(fixture, participantId) {
  const score = (fixture?.scores || []).find(
    (entry) =>
      Number(entry?.participant_id) === Number(participantId) &&
      entry?.description === 'CURRENT'
  );

  const goals = Number(score?.score?.goals);
  return Number.isFinite(goals) ? goals : 0;
}

function getTrackedTeam(fixture) {
  const home = getParticipant(fixture, 'home');
  const away = getParticipant(fixture, 'away');

  if (TRACKED_TEAMS.has(Number(home?.id))) {
    return {
      ...TRACKED_TEAMS.get(Number(home.id)),
      id: Number(home.id),
      side: 'home',
      opponent: away,
    };
  }

  if (TRACKED_TEAMS.has(Number(away?.id))) {
    return {
      ...TRACKED_TEAMS.get(Number(away.id)),
      id: Number(away.id),
      side: 'away',
      opponent: home,
    };
  }

  return null;
}

function getCurrentMinute(fixture) {
  const periods = Array.isArray(fixture?.periods) ? fixture.periods : [];
  if (!periods.length) return null;

  const tickingPeriod = periods.find((period) => period?.ticking === true);
  if (tickingPeriod && Number.isFinite(Number(tickingPeriod.minutes))) {
    return Number(tickingPeriod.minutes);
  }

  const minutes = periods
    .map((period) => Number(period?.minutes))
    .filter(Number.isFinite);

  return minutes.length ? Math.max(...minutes) : null;
}

function isGoalEvent(event) {
  if (!event || event.rescinded === true) return false;

  const code = String(event?.type?.code || '').toLowerCase();
  const name = String(event?.type?.name || '').toLowerCase();
  const developerName = String(
    event?.type?.developer_name || ''
  ).toUpperCase();

  return (
    Number(event?.type_id) === 14 ||
    code === 'goal' ||
    name === 'goal' ||
    developerName === 'GOAL'
  );
}

function getGoalEvents(fixture) {
  return (Array.isArray(fixture?.events) ? fixture.events : [])
    .filter(isGoalEvent)
    .filter((event) => Number.isFinite(Number(event?.id)))
    .sort((a, b) => {
      const sortA = Number(a?.sort_order);
      const sortB = Number(b?.sort_order);

      if (Number.isFinite(sortA) && Number.isFinite(sortB)) {
        return sortA - sortB;
      }

      return Number(a?.minute || 0) - Number(b?.minute || 0);
    });
}

function formatGoalMinute(event) {
  const minute = Number(event?.minute);
  const extraMinute = Number(event?.extra_minute);

  if (!Number.isFinite(minute)) return null;

  if (Number.isFinite(extraMinute) && extraMinute > 0) {
    return `${minute}+${extraMinute}'`;
  }

  return `${minute}'`;
}

function parseEventScore(result) {
  const match = String(result || '').match(/(\d+)\s*-\s*(\d+)/);
  if (!match) return null;

  return {
    homeGoals: Number(match[1]),
    awayGoals: Number(match[2]),
  };
}

async function claimEvent({ fixtureId, eventKey, teamId, eventType }) {
  const { error } = await supabase
    .from('notification_events')
    .insert({
      fixture_id: Number(fixtureId),
      event_key: eventKey,
      team_id: Number(teamId),
      event_type: eventType,
    });

  if (!error) return true;

  // PostgreSQL unique_violation: el evento ya fue procesado.
  if (error.code === '23505') return false;

  throw error;
}

async function releaseEvent(fixtureId, eventKey) {
  const { error } = await supabase
    .from('notification_events')
    .delete()
    .eq('fixture_id', Number(fixtureId))
    .eq('event_key', eventKey);

  if (error) {
    console.error('Error liberando evento de notificación:', error);
  }
}

async function sendClaimedEvent({
  fixtureId,
  eventKey,
  eventType,
  team,
  preference,
  title,
  body,
  data = {},
}) {
  const claimed = await claimEvent({
    fixtureId,
    eventKey,
    teamId: team.id,
    eventType,
  });

  if (!claimed) {
    return { sent: false, duplicate: true };
  }

  try {
    const result = await sendPushNotification({
      title,
      body,
      team: team.key,
      preference,
      data: {
        fixtureId: Number(fixtureId),
        teamId: team.id,
        team: team.key,
        type: eventType,
        route: `/match/${Number(fixtureId)}`,
        ...data,
      },
    });

    return { sent: true, duplicate: false, result };
  } catch (error) {
    // Si el envío falla por completo, permitimos que el siguiente ciclo reintente.
    await releaseEvent(fixtureId, eventKey);
    throw error;
  }
}

function scoreText(homeName, homeGoals, awayGoals, awayName) {
  return `${homeName} ${homeGoals}-${awayGoals} ${awayName}`;
}

async function getFixtureNotificationEvents(fixtureId) {
  const { data, error } = await supabase
    .from('notification_events')
    .select('event_key,event_type')
    .eq('fixture_id', Number(fixtureId));

  if (error) throw error;
  return data || [];
}

async function baselineHistoricalGoals(fixtureId, team, goalEvents) {
  const results = [];

  for (const event of goalEvents) {
    const claimed = await claimEvent({
      fixtureId,
      eventKey: `goal:${Number(event.id)}`,
      teamId: team.id,
      eventType: 'goal_baseline',
    });

    results.push({
      sent: false,
      duplicate: !claimed,
      baseline: claimed,
      eventId: Number(event.id),
    });
  }

  return results;
}

async function processGoalEvent({
  fixtureId,
  event,
  team,
  home,
  away,
  fallbackHomeGoals,
  fallbackAwayGoals,
}) {
  const eventId = Number(event.id);
  const scoringTeamId = Number(event?.participant_id);
  const trackedTeamScored = scoringTeamId === Number(team.id);
  const minute = formatGoalMinute(event);
  const eventScore = parseEventScore(event?.result);
  const homeGoals = eventScore?.homeGoals ?? fallbackHomeGoals;
  const awayGoals = eventScore?.awayGoals ?? fallbackAwayGoals;
  const homeName = String(home?.name || 'Local');
  const awayName = String(away?.name || 'Visitante');
  const score = scoreText(homeName, homeGoals, awayGoals, awayName);
  const playerName = String(event?.player_name || '').trim();

  const title = trackedTeamScored
    ? `⚽ ¡GOOOL DEL ${team.name.toUpperCase()}!`
    : '⚽ Gol del rival';

  const details = [playerName, minute, score].filter(Boolean);

  return sendClaimedEvent({
    fixtureId,
    eventKey: `goal:${eventId}`,
    eventType: 'goal',
    team,
    preference: 'goals_enabled',
    title,
    body: details.join(' · '),
    data: {
      eventId,
      scoringTeamId,
      playerId: Number(event?.player_id) || null,
      playerName: playerName || null,
      relatedPlayerId: Number(event?.related_player_id) || null,
      relatedPlayerName: String(event?.related_player_name || '').trim() || null,
      minute: Number(event?.minute) || null,
      extraMinute: Number(event?.extra_minute) || null,
      result: String(event?.result || '') || null,
      homeGoals,
      awayGoals,
      goalSide: trackedTeamScored ? 'team' : 'opponent',
    },
  });
}

async function processFixture(fixture) {
  const fixtureId = Number(fixture?.id);
  if (!Number.isFinite(fixtureId)) return [];

  const team = getTrackedTeam(fixture);
  if (!team) return [];

  const home = getParticipant(fixture, 'home');
  const away = getParticipant(fixture, 'away');
  if (!home?.id || !away?.id) return [];

  const state = String(fixture?.state?.short_name || '').trim();
  const homeGoals = getCurrentScore(fixture, home.id);
  const awayGoals = getCurrentScore(fixture, away.id);
  const homeName = String(home?.name || 'Local');
  const awayName = String(away?.name || 'Visitante');
  const score = scoreText(homeName, homeGoals, awayGoals, awayName);
  const currentMinute = getCurrentMinute(fixture);
  const goalEvents = getGoalEvents(fixture);
  const results = [];

  const existingEvents = await getFixtureNotificationEvents(fixtureId);
  const existingKeys = new Set(existingEvents.map((event) => event.event_key));
  const fixtureAlreadyKnown = existingEvents.length > 0;

  // Solo avisamos del inicio durante los primeros minutos. Si el backend entra
  // tarde en un partido, registramos el inicio silenciosamente para no enviar
  // una notificación histórica en el minuto 30.
  if (START_STATES.has(state) && !existingKeys.has('match-start')) {
    if (
      currentMinute === null ||
      currentMinute <= START_NOTIFICATION_MAX_MINUTE
    ) {
      results.push(
        await sendClaimedEvent({
          fixtureId,
          eventKey: 'match-start',
          eventType: 'match_start',
          team,
          preference: 'match_start_enabled',
          title: `⚽ Empieza el ${team.name}`,
          body: `${homeName} vs ${awayName}`,
        })
      );
    } else {
      const claimed = await claimEvent({
        fixtureId,
        eventKey: 'match-start',
        teamId: team.id,
        eventType: 'match_start_baseline',
      });

      results.push({
        sent: false,
        duplicate: !claimed,
        baseline: claimed,
        eventKey: 'match-start',
      });
    }
  }

  // Si el servicio descubre por primera vez un partido ya avanzado y ya hay
  // goles, los registra como baseline sin avisar. En ciclos posteriores cada
  // nuevo event.id de SportMonks genera exactamente una notificación.
  if (!fixtureAlreadyKnown && goalEvents.length > 0) {
    results.push(
      ...(await baselineHistoricalGoals(fixtureId, team, goalEvents))
    );
  } else {
    for (const event of goalEvents) {
      const eventKey = `goal:${Number(event.id)}`;
      if (existingKeys.has(eventKey)) continue;

      results.push(
        await processGoalEvent({
          fixtureId,
          event,
          team,
          home,
          away,
          fallbackHomeGoals: homeGoals,
          fallbackAwayGoals: awayGoals,
        })
      );
    }
  }

  if (HALFTIME_STATES.has(state)) {
    results.push(
      await sendClaimedEvent({
        fixtureId,
        eventKey: 'halftime',
        eventType: 'halftime',
        team,
        preference: 'halftime_enabled',
        title: '⏸️ Descanso',
        body: score,
        data: { homeGoals, awayGoals },
      })
    );
  }

  if (FULLTIME_STATES.has(state)) {
    results.push(
      await sendClaimedEvent({
        fixtureId,
        eventKey: 'fulltime',
        eventType: 'fulltime',
        team,
        preference: 'fulltime_enabled',
        title: '🏁 Final del partido',
        body: score,
        data: { homeGoals, awayGoals },
      })
    );
  }

  return results;
}

async function processMatchReminder(fixture) {
  const fixtureId = Number(fixture?.id);
  if (!Number.isFinite(fixtureId)) {
    return { sent: false, reason: 'invalid-fixture-id' };
  }

  const team = getTrackedTeam(fixture);
  if (!team) {
    return { sent: false, reason: 'untracked-team' };
  }

  const home = getParticipant(fixture, 'home');
  const away = getParticipant(fixture, 'away');
  if (!home?.id || !away?.id) {
    return { sent: false, reason: 'missing-participants' };
  }

  const homeName = String(home?.name || 'Local');
  const awayName = String(away?.name || 'Visitante');

  return sendClaimedEvent({
    fixtureId,
    eventKey: 'match-reminder-30',
    eventType: 'match_reminder',
    team,
    preference: 'match_reminder_enabled',
    title: `⏰ ${team.name} juega en 30 minutos`,
    body: `${homeName} vs ${awayName}`,
    data: {
      reminderMinutes: 30,
    },
  });
}

async function processLiveMatchNotifications(fixtures) {
  const relevantFixtures = (Array.isArray(fixtures) ? fixtures : []).filter(
    (fixture) => Boolean(getTrackedTeam(fixture))
  );

  const results = [];

  for (const fixture of relevantFixtures) {
    try {
      const fixtureResults = await processFixture(fixture);
      results.push({
        fixtureId: Number(fixture?.id),
        ok: true,
        events: fixtureResults,
      });
    } catch (error) {
      console.error(
        `Error en notificaciones del fixture ${fixture?.id}:`,
        error
      );

      results.push({
        fixtureId: Number(fixture?.id),
        ok: false,
        error: error.message,
      });
    }
  }

  return results;
}

module.exports = {
  processLiveMatchNotifications,
  processMatchReminder,
};
