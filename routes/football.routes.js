const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

const {
  getDisplayTeamName,
  getShortTeamName,
  getTeamLogo,
  getCorrectVenue,
  getCompetitionName,
  isCastellon,
} = require('../config/footballConfig');


const API_FOOTBALL_FREE_BASE_URL =
  process.env.API_FOOTBALL_FREE_BASE_URL ||
  'https://v3.football.api-sports.io';

const API_FOOTBALL_FREE_KEY =
  process.env.API_FOOTBALL_FREE_KEY;
const LEAGUE_ID = process.env.FOOTBALL_LEAGUE_ID;
const SEASON = process.env.FOOTBALL_SEASON;
const SPORTMONKS_BASE_URL =
  process.env.SPORTMONKS_BASE_URL ||
  'https://api.sportmonks.com/v3/football';

const SPORTMONKS_TOKEN =
  process.env.SPORTMONKS_TOKEN;

const SPORTMONKS_CASTELLON_TEAM_ID =
  Number(process.env.SPORTMONKS_CASTELLON_TEAM_ID || 10008);

const SPORTMONKS_CASTELLON_B_TEAM_ID =
  Number(process.env.SPORTMONKS_CASTELLON_B_TEAM_ID || 29495);

const SPORTMONKS_LEAGUES = {
  laliga: Number(process.env.SPORTMONKS_LALIGA_ID || 564),
  laliga2: Number(process.env.SPORTMONKS_LALIGA2_ID || 567),
  primeraRFEF1: Number(
    process.env.SPORTMONKS_PRIMERA_RFEF_G1_ID || 2333
  ),
  primeraRFEF2: Number(
    process.env.SPORTMONKS_PRIMERA_RFEF_G2_ID || 2334
  ),
  segundaRFEF3: Number(
    process.env.SPORTMONKS_SEGUNDA_RFEF_G3_ID || 2338
  ),
};
const SPORTMONKS_COMPETITIONS = {
  laliga: {
    key: 'laliga',
    name: 'LaLiga',
    leagueId: Number(process.env.SPORTMONKS_LALIGA_ID),
    seasonId: Number(process.env.SPORTMONKS_LALIGA_SEASON_ID),
  },

  laliga2: {
    key: 'laliga2',
    name: 'LaLiga Hypermotion',
    leagueId: Number(process.env.SPORTMONKS_LALIGA2_ID),
    seasonId: Number(process.env.SPORTMONKS_LALIGA2_SEASON_ID),
  },

  'primera-rfef-1': {
    key: 'primera-rfef-1',
    name: 'Primera RFEF Grupo 1',
    leagueId: Number(process.env.SPORTMONKS_PRIMERA_RFEF_G1_ID),
    seasonId: Number(process.env.SPORTMONKS_PRIMERA_RFEF_G1_SEASON_ID),
  },

  'primera-rfef-2': {
    key: 'primera-rfef-2',
    name: 'Primera RFEF Grupo 2',
    leagueId: Number(process.env.SPORTMONKS_PRIMERA_RFEF_G2_ID),
    seasonId: Number(process.env.SPORTMONKS_PRIMERA_RFEF_G2_SEASON_ID),
  },

  'segunda-rfef-3': {
    key: 'segunda-rfef-3',
    name: 'Segunda RFEF Grupo 3',
    leagueId: Number(process.env.SPORTMONKS_SEGUNDA_RFEF_G3_ID),
    seasonId: Number(process.env.SPORTMONKS_CASTELLON_B_SEASON_ID),
  },
};

const TIMEZONE =
  process.env.FOOTBALL_TIMEZONE || 'Europe/Madrid';
const LIVE_CACHE_MS = 20_000;
const SOON_CACHE_MS = 60_000;
const UPCOMING_CACHE_MS = 5 * 60_000;
const IDLE_CACHE_MS = 15 * 60_000;

const getTimeZoneOffsetMs = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  const asUTC = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUTC - date.getTime();
};

const zonedDateTimeToUtcIso = (
  year,
  month,
  day,
  hour,
  minute,
  second,
  timeZone
) => {
  const utcGuess = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second
  );

  let date = new Date(utcGuess);
  let offset = getTimeZoneOffsetMs(
    date,
    timeZone
  );

  date = new Date(utcGuess - offset);

  const correctedOffset =
    getTimeZoneOffsetMs(date, timeZone);

  if (correctedOffset !== offset) {
    date = new Date(
      utcGuess - correctedOffset
    );
  }

  return date.toISOString();
};

const getLiveCacheMs = (cachedData) => {
  const matches = cachedData?.matches;

  if (!Array.isArray(matches) || matches.length === 0) {
    return IDLE_CACHE_MS;
  }

  const now = Date.now();

  const liveStatuses = ['1H', '2H', 'ET', 'P', 'LIVE', 'HT', 'BT'];
  const finishedStatuses = ['FT', 'AET', 'PEN'];

  const hasLiveMatch = matches.some((match) =>
    liveStatuses.includes(match.status?.short)
  );

  if (hasLiveMatch) {
    return LIVE_CACHE_MS;
  }

  const unfinishedMatches = matches.filter(
    (match) =>
      !finishedStatuses.includes(match.status?.short)
  );

  if (unfinishedMatches.length === 0) {
    return IDLE_CACHE_MS;
  }

  const nextMatchTimes = unfinishedMatches
    .map((match) => new Date(match.date).getTime())
    .filter((timestamp) => Number.isFinite(timestamp));

  if (nextMatchTimes.length === 0) {
    return UPCOMING_CACHE_MS;
  }

  const closestMatchTime = Math.min(...nextMatchTimes);
  const minutesUntilMatch =
    (closestMatchTime - now) / 60_000;

  // Desde 30 minutos antes y hasta 3 horas después
  // de la hora prevista comprobamos muy frecuentemente.
  if (
    minutesUntilMatch <= 30 &&
    minutesUntilMatch >= -180
  ) {
    return LIVE_CACHE_MS;
  }

  // Si faltan 2 horas o menos.
  if (minutesUntilMatch <= 120) {
    return SOON_CACHE_MS;
  }

  // Si todavía faltan varias horas.
  return UPCOMING_CACHE_MS;
};

let liveCache = null;
let liveCacheSavedAt = 0;
let liveRefreshPromise = null;
const PLAYER_CAREER_CACHE_MS =
  30 * 24 * 60 * 60 * 1000;
const SPORTMONKS_TODAY_FIXTURES_CACHE_MS = 60_000;

let sportmonksTodayFixturesCache = null;
let sportmonksTodayFixturesCacheDate = null;
let sportmonksTodayFixturesSavedAt = 0;



/**
 * Realiza peticiones a API-Football con la cuenta FREE.
 * Se utiliza exclusivamente para datos históricos de jugadores.
 */
const footballFreeFetch = async (endpoint) => {
  if (!API_FOOTBALL_FREE_KEY) {
    throw new Error(
      'API_FOOTBALL_FREE_KEY no está configurado'
    );
  }

  const response = await fetch(
    `${API_FOOTBALL_FREE_BASE_URL}${endpoint}`,
    {
      headers: {
        'x-apisports-key': API_FOOTBALL_FREE_KEY,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  if (
    data?.errors &&
    (
      Array.isArray(data.errors)
        ? data.errors.length > 0
        : Object.keys(data.errors).length > 0
    )
  ) {
    throw new Error(
      `API-Football FREE: ${JSON.stringify(data.errors)}`
    );
  }

  return data;
};

const findApiFootballFreePlayer = async (player) => {
  const lastname = String(
    player?.lastname || ''
  ).trim();

  const displayName = String(
    player?.display_name ||
    player?.name ||
    ''
  ).trim();

  const birthDate = String(
    player?.date_of_birth || ''
  ).trim();

    const lastnameSearchTerm = String(lastname || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')[0];

  const rawSearchTerm =
    lastnameSearchTerm.length >= 3
      ? lastnameSearchTerm
      : displayName;

  const searchTerm = String(rawSearchTerm || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!searchTerm) {
    return null;
  }

  const candidates = [];
  let page = 1;
  let totalPages = 1;

  do {
    const data = await footballFreeFetch(
      `/players/profiles?search=${encodeURIComponent(searchTerm)}&page=${page}`
    );

    const pageCandidates = Array.isArray(data?.response)
      ? data.response
          .map((entry) => entry?.player)
          .filter(Boolean)
      : [];

    candidates.push(...pageCandidates);

    if (birthDate) {
      const birthMatch = pageCandidates.find(
        (candidate) =>
          String(candidate?.birth?.date || '') ===
          birthDate
      );

      if (birthMatch) {
        return birthMatch;
      }
    }

    totalPages = Math.max(
      1,
      Number(data?.paging?.total) || 1
    );

    page += 1;
  } while (page <= totalPages);

  if (!candidates.length) {
    return null;
  }

  const normalizeName = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const expectedName = normalizeName(
    displayName
  );

  const nameMatch = candidates.find(
    (candidate) =>
      normalizeName(
        `${candidate.firstname || ''}${candidate.lastname || ''}`
      ) === expectedName ||
      normalizeName(candidate.name) ===
        expectedName
  );

  return nameMatch || null;
};

const getCachedPlayerCareer = async (sportmonksPlayerId) => {
  const { data, error } = await supabase
    .from('player_career_cache')
    .select(
      'sportmonks_player_id, api_football_player_id, player_name, birth_date, career, updated_at'
    )
    .eq('sportmonks_player_id', sportmonksPlayerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const updatedAt = new Date(data.updated_at).getTime();

  return {
    apiFootballPlayerId:
      data.api_football_player_id !== null
        ? Number(data.api_football_player_id)
        : null,
    career: Array.isArray(data.career)
      ? data.career
      : [],
    updatedAt: data.updated_at,
    fresh:
      Number.isFinite(updatedAt) &&
      Date.now() - updatedAt <
        PLAYER_CAREER_CACHE_MS,
  };
};

const savePlayerCareerCache = async (
  player,
  apiFootballPlayerId,
  career
) => {
  const { error } = await supabase
    .from('player_career_cache')
    .upsert(
      {
        sportmonks_player_id: Number(player.id),
        api_football_player_id:
          apiFootballPlayerId !== null
            ? Number(apiFootballPlayerId)
            : null,
        player_name:
          player.display_name ||
          player.name ||
          '',
        birth_date: player.date_of_birth || null,
        career: Array.isArray(career)
          ? career
          : [],
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'sportmonks_player_id',
      }
    );

  if (error) {
    throw error;
  }
};

const getApiFootballFreeCareer = async (player) => {
  let cached = null;

  try {
    cached = await getCachedPlayerCareer(
      Number(player.id)
    );
  } catch (error) {
    console.error(
      'Error leyendo caché de trayectoria:',
      error
    );
  }

  if (cached?.fresh) {
    return {
      apiFootballPlayerId:
        cached.apiFootballPlayerId,
      career: cached.career,
      source: 'cache',
    };
  }

  try {
    const apiPlayer =
      await findApiFootballFreePlayer(player);

    if (!apiPlayer?.id) {
      if (cached) {
        return {
          apiFootballPlayerId:
            cached.apiFootballPlayerId,
          career: cached.career,
          source: 'stale-cache',
        };
      }

      try {
        await savePlayerCareerCache(
          player,
          null,
          []
        );
      } catch (cacheError) {
        console.error(
          'Error guardando caché negativa de trayectoria:',
          cacheError
        );
      }

      return null;
    }

    const data = await footballFreeFetch(
      `/players/teams?player=${encodeURIComponent(
        apiPlayer.id
      )}`
    );

    const teams = Array.isArray(data?.response)
      ? data.response
      : [];

    if (!teams.length) {
      if (cached) {
        return {
          apiFootballPlayerId:
            cached.apiFootballPlayerId,
          career: cached.career,
          source: 'stale-cache',
        };
      }

      return null;
    }

    const career = teams
      .map((entry) => ({
        team: {
          id: null,
          apiFootballId: Number(
            entry?.team?.id
          ),
          name: getDisplayTeamName(
            entry?.team?.name || ''
          ),
          shortName: getShortTeamName(
            entry?.team?.name || ''
          ),
          logo: getTeamLogo(
            entry?.team?.name || '',
            entry?.team?.logo || ''
          ),
          isCastellon: isCastellon(
            entry?.team?.name || ''
          ),
        },
        seasons: Array.isArray(entry?.seasons)
          ? entry.seasons.map(String)
          : [],
      }))
      .filter(
        (entry) =>
          entry.team.apiFootballId &&
          entry.team.name
      );

        try {
      await savePlayerCareerCache(
        player,
        Number(apiPlayer.id),
        career
      );
    } catch (cacheError) {
      console.error(
        'Error guardando caché de trayectoria:',
        cacheError
      );
    }

    return {
      apiFootballPlayerId:
        Number(apiPlayer.id),
      career,
      source: 'api-football-free',
    };
  } catch (error) {
    console.error(
      'Error cargando trayectoria desde API-Football FREE:',
      error
    );

    if (cached) {
      return {
        apiFootballPlayerId:
          cached.apiFootballPlayerId,
        career: cached.career,
        source: 'stale-cache',
      };
    }

    return null;
  }
};

/**
 * Realiza peticiones a Sportmonks.
 * El token permanece exclusivamente en el servidor.
 */
const sportmonksFetch = async (endpoint) => {
  if (!SPORTMONKS_TOKEN) {
    throw new Error(
      'SPORTMONKS_TOKEN no está configurado'
    );
  }

  const separator = endpoint.includes('?') ? '&' : '?';

  const response = await fetch(
    `${SPORTMONKS_BASE_URL}${endpoint}${separator}api_token=${encodeURIComponent(
      SPORTMONKS_TOKEN
    )}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
};

const normalizeSportmonksFixture = (fixture) => {
  const participants = fixture.participants || [];
  const scores = fixture.scores || [];

  const homeTeam = participants.find(
    (team) => team.meta?.location === 'home'
  );

  const awayTeam = participants.find(
    (team) => team.meta?.location === 'away'
  );

  const getCurrentScore = (participantId) => {
    const currentScore = scores.find(
      (score) =>
        score.participant_id === participantId &&
        score.description === 'CURRENT'
    );

    return currentScore?.score?.goals ?? null;
  };

  return {
    fixtureId: fixture.id,

    date: fixture.starting_at
      ? `${fixture.starting_at.replace(' ', 'T')}Z`
      : null,

    status: {
      id: fixture.state?.id ?? null,
      name: fixture.state?.name ?? '',
      shortName: fixture.state?.short_name ?? '',
      state: fixture.state?.state ?? '',
    },

    league: {
      id: fixture.league?.id ?? null,
      name: fixture.league?.name ?? '',
    },

    home: {
      teamId: homeTeam?.id ?? null,
      name: getDisplayTeamName(
        homeTeam?.name || ''
      ),
      shortName: getShortTeamName(
        homeTeam?.name || ''
      ),
      logo: getTeamLogo(
        homeTeam?.name || '',
        homeTeam?.image_path || ''
      ),
      score: homeTeam
        ? getCurrentScore(homeTeam.id)
        : null,
    },

    away: {
      teamId: awayTeam?.id ?? null,
      name: getDisplayTeamName(
        awayTeam?.name || ''
      ),
      shortName: getShortTeamName(
        awayTeam?.name || ''
      ),
      logo: getTeamLogo(
        awayTeam?.name || '',
        awayTeam?.image_path || ''
      ),
      score: awayTeam
        ? getCurrentScore(awayTeam.id)
        : null,
    },
  };
};

/**
 * Normaliza una fila de clasificación de Sportmonks
 * al formato utilizado por Albinegros.
 */
const normalizeSportmonksStanding = (item) => {
  const details = item.details || [];

  const getValue = (code) => {
    const detail = details.find(
      (entry) => entry.type?.code === code
    );

    return Number(detail?.value ?? 0);
  };

  return {
    teamId: item.participant_id,
    position: item.position,

    team: getDisplayTeamName(
      item.participant?.name || ''
    ),

    logo: getTeamLogo(
      item.participant?.name || '',
      item.participant?.image_path || ''
    ),

    points: Number(item.points ?? 0),

    playedgames: getValue('overall-matches-played'),
    won: getValue('overall-won'),
    draw: getValue('overall-draw'),
    lost: getValue('overall-lost'),

    goalsfor: getValue('overall-goals-for'),
    goalsagainst: getValue('overall-goals-against'),
    goaldiff: getValue('goal-difference'),
  };
};

/**
 * Comprueba la conexión del servidor con Sportmonks.
 * GET /api/sportmonks/test
 */
router.get('/api/sportmonks/test', async (req, res) => {
  try {
    const data = await sportmonksFetch(
      `/teams/${SPORTMONKS_CASTELLON_TEAM_ID}`
    );

    res.json({
      ok: true,
      provider: 'sportmonks',
      message: 'Sportmonks conectado correctamente',
      team: {
        id: data.data?.id ?? null,
        name: data.data?.name || '',
        shortCode: data.data?.short_code || '',
        logo: data.data?.image_path || '',
      },
      leagues: SPORTMONKS_LEAGUES,
    });
  } catch (error) {
    console.error(
      'Error comprobando Sportmonks:',
      error
    );

    res.status(500).json({
      ok: false,
      provider: 'sportmonks',
      error: error.message,
    });
  }
});
/**
 * Clasificación por competición.
 *
 * Ejemplos:
 * /api/sportmonks/standings/laliga
 * /api/sportmonks/standings/laliga2
 * /api/sportmonks/standings/primera-rfef-1
 * /api/sportmonks/standings/primera-rfef-2
 * /api/sportmonks/standings/segunda-rfef-3
 */
router.get(
  '/api/sportmonks/standings/:competition',
  async (req, res) => {
    try {
      const competitionKey = String(
        req.params.competition || ''
      ).trim();

      const competition =
        SPORTMONKS_COMPETITIONS[competitionKey];

      if (!competition) {
        return res.status(404).json({
          ok: false,
          error: 'Competición no válida',
          available: Object.keys(
            SPORTMONKS_COMPETITIONS
          ),
        });
      }

      const data = await sportmonksFetch(
        `/standings/seasons/${competition.seasonId}?include=participant;details.type`
      );

      const standings = (data.data || [])
        .map(normalizeSportmonksStanding)
        .sort((a, b) => a.position - b.position);

      return res.json({
        ok: true,
        provider: 'sportmonks',
        competition: {
          key: competition.key,
          name: competition.name,
          leagueId: competition.leagueId,
          seasonId: competition.seasonId,
        },
        count: standings.length,
        standings,
      });
    } catch (error) {
      console.error(
        'Error obteniendo clasificación Sportmonks:',
        error
      );

      return res.status(500).json({
        ok: false,
        provider: 'sportmonks',
        error: error.message,
      });
    }
  }
);

/**
 * Calendario del C.D. Castellón desde Sportmonks.
 *
 * Ejemplo:
 * /api/sportmonks/calendar/castellon
 */
router.get(
  '/api/sportmonks/calendar/castellon',
  async (req, res) => {
    try {
      const startDate =
        req.query.from || '2026-08-01';

      const endDate =
        req.query.to || '2027-06-30';

      const data = await sportmonksFetch(
        `/fixtures/between/${startDate}/${endDate}/${SPORTMONKS_CASTELLON_TEAM_ID}?include=participants;scores;state;league`
      );

const fixtures = (data.data || []).map(
  normalizeSportmonksFixture
);

      return res.json({
        ok: true,
        provider: 'sportmonks',
        teamId: SPORTMONKS_CASTELLON_TEAM_ID,
        from: startDate,
        to: endDate,
        count: fixtures.length,
        fixtures,
      });
    } catch (error) {
      console.error(
        'Error obteniendo calendario Sportmonks:',
        error
      );

      return res.status(500).json({
        ok: false,
        provider: 'sportmonks',
        error: error.message,
      });
    }
  }
);

/**
 * Calendario del C.D. Castellón B desde Sportmonks.
 *
 * Ejemplo:
 * /api/sportmonks/calendar/castellon-b
 */
router.get(
  '/api/sportmonks/calendar/castellon-b',
  async (req, res) => {
    try {
      const startDate =
        req.query.from || '2026-08-01';

      const endDate =
        req.query.to || '2027-06-30';

      const data = await sportmonksFetch(
        `/fixtures/between/${startDate}/${endDate}/${SPORTMONKS_CASTELLON_B_TEAM_ID}?include=participants;scores;state;league`
      );

      const fixtures = (data.data || []).map(
  normalizeSportmonksFixture
);

      return res.json({
        ok: true,
        provider: 'sportmonks',
        teamId: SPORTMONKS_CASTELLON_B_TEAM_ID,
        from: startDate,
        to: endDate,
        count: fixtures.length,
        fixtures,
      });
    } catch (error) {
      console.error(
        'Error obteniendo calendario Castellón B Sportmonks:',
        error
      );

      return res.status(500).json({
        ok: false,
        provider: 'sportmonks',
        error: error.message,
      });
    }
  }
);

/**
 * Calendario completo por competición.
 *
 * Ejemplos:
 * /api/sportmonks/calendar/competition/laliga
 * /api/sportmonks/calendar/competition/laliga2
 * /api/sportmonks/calendar/competition/primera-rfef-1
 * /api/sportmonks/calendar/competition/primera-rfef-2
 * /api/sportmonks/calendar/competition/segunda-rfef-3
 */
router.get(
  '/api/sportmonks/calendar/competition/:competition',
  async (req, res) => {
    try {
      const competitionKey = String(
        req.params.competition || ''
      ).trim();

      const competition =
        SPORTMONKS_COMPETITIONS[competitionKey];

      if (!competition) {
        return res.status(404).json({
          ok: false,
          error: 'Competición no válida',
          available: Object.keys(
            SPORTMONKS_COMPETITIONS
          ),
        });
      }

      const startDate =
        req.query.from || '2026-08-01';

      const endDate =
        req.query.to || '2027-06-30';

      const data = await sportmonksFetch(
        `/fixtures/between/${startDate}/${endDate}?include=participants;scores;state;league&filters=fixtureLeagues:${competition.leagueId}`
      );

      const fixtures = (data.data || [])
        .map(normalizeSportmonksFixture)
        .sort(
          (a, b) =>
            new Date(a.date) - new Date(b.date)
        );

      return res.json({
        ok: true,
        provider: 'sportmonks',

        competition: {
          key: competition.key,
          name: competition.name,
          leagueId: competition.leagueId,
          seasonId: competition.seasonId,
        },

        from: startDate,
        to: endDate,
        count: fixtures.length,
        fixtures,
      });
    } catch (error) {
      console.error(
        'Error obteniendo calendario de competición Sportmonks:',
        error
      );

      return res.status(500).json({
        ok: false,
        provider: 'sportmonks',
        error: error.message,
      });
    }
  }
);

/**
 * LIVE Sportmonks - endpoint de prueba.
 * No sustituye todavía /api/football/live.
 */
router.get('/api/sportmonks/live', async (req, res) => {
  try {
    const data = await sportmonksFetch(
      '/livescores/inplay?include=participants;scores;state;periods;league'
    );

    const matches = (data.data || []).map((fixture) => {
      const participants = fixture.participants || [];
      const scores = fixture.scores || [];
      const periods = fixture.periods || [];

      const homeTeam = participants.find(
        (team) => team.meta?.location === 'home'
      );

      const awayTeam = participants.find(
        (team) => team.meta?.location === 'away'
      );

      const getCurrentScore = (participantId) => {
        const currentScore = scores.find(
          (score) =>
            score.participant_id === participantId &&
            score.description === 'CURRENT'
        );

        return currentScore?.score?.goals ?? null;
      };

      const activePeriod = periods
        .filter((period) => period.ticking === true)
        .sort(
          (a, b) =>
            Number(b.id || 0) - Number(a.id || 0)
        )[0];

      const elapsed =
  Number.isFinite(Number(activePeriod?.minutes))
    ? Number(activePeriod.minutes)
    : null;

const seconds =
  Number.isFinite(Number(activePeriod?.seconds))
    ? Number(activePeriod.seconds)
    : null;

const regulationEnd =
  Number.isFinite(Number(activePeriod?.counts_from)) &&
  Number.isFinite(Number(activePeriod?.period_length))
    ? Number(activePeriod.counts_from) +
      Number(activePeriod.period_length)
    : null;

const extra =
  elapsed !== null &&
  regulationEnd !== null &&
  elapsed > regulationEnd
    ? elapsed - regulationEnd
    : 0;
const sportmonksStatus =
  fixture.state?.short_name || '';

const statusMap = {
  '1st': '1H',
  HT: 'HT',
  '2nd': '2H',
  ET: 'ET',
  FT: 'FT',
  NS: 'NS',
};

const normalizedStatus =
  statusMap[sportmonksStatus] ||
  sportmonksStatus;

      return {
  fixtureId: fixture.id,

  date: fixture.starting_at
    ? `${fixture.starting_at.replace(' ', 'T')}Z`
    : null,

  timestamp: fixture.starting_at
    ? Math.floor(
        new Date(
          `${fixture.starting_at.replace(' ', 'T')}Z`
        ).getTime() / 1000
      )
    : null,

  status: {
    short: normalizedStatus,
    long: fixture.state?.name ?? '',
    elapsed,
    extra,
    seconds,
  },

  league: {
    id: fixture.league?.id ?? null,
    name: fixture.league?.name ?? '',
    round: '',
    logo: fixture.league?.image_path ?? '',
  },

  venue: {
    id: null,
    name: '',
    city: '',
  },

  referee: '',

  home: {
    id: homeTeam?.id ?? null,
    name: getDisplayTeamName(
      homeTeam?.name || ''
    ),
    shortName: getShortTeamName(
      homeTeam?.name || ''
    ),
    logo: getTeamLogo(
      homeTeam?.name || '',
      homeTeam?.image_path || ''
    ),
    winner:
      homeTeam &&
      awayTeam &&
      getCurrentScore(homeTeam.id) !== null &&
      getCurrentScore(awayTeam.id) !== null &&
      getCurrentScore(homeTeam.id) !==
        getCurrentScore(awayTeam.id)
        ? getCurrentScore(homeTeam.id) >
          getCurrentScore(awayTeam.id)
        : null,
    isCastellon: isCastellon(
      homeTeam?.name || ''
    ),
  },

  away: {
    id: awayTeam?.id ?? null,
    name: getDisplayTeamName(
      awayTeam?.name || ''
    ),
    shortName: getShortTeamName(
      awayTeam?.name || ''
    ),
    logo: getTeamLogo(
      awayTeam?.name || '',
      awayTeam?.image_path || ''
    ),
    winner:
      homeTeam &&
      awayTeam &&
      getCurrentScore(homeTeam.id) !== null &&
      getCurrentScore(awayTeam.id) !== null &&
      getCurrentScore(homeTeam.id) !==
        getCurrentScore(awayTeam.id)
        ? getCurrentScore(awayTeam.id) >
          getCurrentScore(homeTeam.id)
        : null,
    isCastellon: isCastellon(
      awayTeam?.name || ''
    ),
  },

  goals: {
  home:
    normalizedStatus !== 'NS' && homeTeam
      ? getCurrentScore(homeTeam.id)
      : null,

  away:
    normalizedStatus !== 'NS' && awayTeam
      ? getCurrentScore(awayTeam.id)
      : null,
},

  score: {
    halftime: {
  home:
    normalizedStatus !== 'NS' && homeTeam
      ? scores.find(
          (score) =>
            score.participant_id === homeTeam.id &&
            score.description === '1ST_HALF'
        )?.score?.goals ?? null
      : null,

  away:
    normalizedStatus !== 'NS' && awayTeam
      ? scores.find(
          (score) =>
            score.participant_id === awayTeam.id &&
            score.description === '1ST_HALF'
        )?.score?.goals ?? null
      : null,
},

    fulltime: {
      home:
        normalizedStatus === 'FT' && homeTeam
          ? getCurrentScore(homeTeam.id)
          : null,

      away:
        normalizedStatus === 'FT' && awayTeam
          ? getCurrentScore(awayTeam.id)
          : null,
    },

    extratime: {
      home: null,
      away: null,
    },

    penalty: {
      home: null,
      away: null,
    },
  },
};
    });

    return res.json({
      ok: true,
      provider: 'sportmonks',
      updatedAt: new Date().toISOString(),
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error(
      'Error obteniendo directos Sportmonks:',
      error
    );

    return res.status(500).json({
      ok: false,
      provider: 'sportmonks',
      error: error.message,
    });
  }
});


/**
 * Sincroniza la clasificación.
 */
router.post('/api/football/sync-standings', async (req, res) => {
  try {
    const competition =
      SPORTMONKS_COMPETITIONS.laliga2;

    if (
      !competition?.leagueId ||
      !competition?.seasonId
    ) {
      throw new Error(
        'Configuración de LaLiga2 incompleta'
      );
    }

    /*
     * 1. Clasificación oficial completa.
     *
     * Esta nos da PJ, G, E, P, GF, GC, DG,
     * además de posición y puntos.
     */
    const normalData = await sportmonksFetch(
      `/standings/seasons/${competition.seasonId}` +
        `?include=participant;details.type`
    );

    let rows = (normalData?.data || [])
      .map(normalizeSportmonksStanding)
      .sort(
        (a, b) =>
          Number(a.position) -
          Number(b.position)
      );

    /*
     *     /*
     * 2. Clasificación LIVE calculada por nuestro servidor.
     *
     * Partimos de la clasificación oficial y aplicamos
     * provisionalmente los partidos que estén en juego.
     */
    let liveApplied = false;
    let liveMatchesApplied = 0;

    try {
      const liveData = await sportmonksFetch(
        '/livescores/inplay' +
          '?include=participants;scores;state;league'
      );

      const liveFixtures = Array.isArray(
        liveData?.data
      )
        ? liveData.data
        : [];

      const leagueLiveFixtures =
        liveFixtures.filter(
          (fixture) =>
            Number(fixture?.league_id) ===
            Number(competition.leagueId)
        );

      const rowsByTeam = new Map(
        rows.map((row) => [
          Number(row.teamId),
          { ...row },
        ])
      );

      for (const fixture of leagueLiveFixtures) {
        const participants = Array.isArray(
          fixture?.participants
        )
          ? fixture.participants
          : [];

        const scores = Array.isArray(
          fixture?.scores
        )
          ? fixture.scores
          : [];

        const homeTeam = participants.find(
          (team) =>
            team?.meta?.location === 'home'
        );

        const awayTeam = participants.find(
          (team) =>
            team?.meta?.location === 'away'
        );

        if (!homeTeam?.id || !awayTeam?.id) {
          continue;
        }

        const homeRow = rowsByTeam.get(
          Number(homeTeam.id)
        );

        const awayRow = rowsByTeam.get(
          Number(awayTeam.id)
        );

        if (!homeRow || !awayRow) {
          continue;
        }

        const getCurrentScore = (
          participantId
        ) => {
          const currentScore = scores.find(
            (score) =>
              Number(
                score?.participant_id
              ) ===
                Number(participantId) &&
              score?.description ===
                'CURRENT'
          );

          return Number(
            currentScore?.score?.goals ?? 0
          );
        };

        const homeGoals =
          getCurrentScore(homeTeam.id);

        const awayGoals =
          getCurrentScore(awayTeam.id);

        /*
         * El partido todavía no forma parte de
         * la clasificación oficial, así que
         * añadimos provisionalmente un PJ.
         */
        homeRow.playedgames += 1;
        awayRow.playedgames += 1;

        homeRow.goalsfor += homeGoals;
        homeRow.goalsagainst += awayGoals;

        awayRow.goalsfor += awayGoals;
        awayRow.goalsagainst += homeGoals;

        if (homeGoals > awayGoals) {
          homeRow.won += 1;
          homeRow.points += 3;

          awayRow.lost += 1;
        } else if (awayGoals > homeGoals) {
          awayRow.won += 1;
          awayRow.points += 3;

          homeRow.lost += 1;
        } else {
          homeRow.draw += 1;
          awayRow.draw += 1;

          homeRow.points += 1;
          awayRow.points += 1;
        }

        homeRow.goaldiff =
          homeRow.goalsfor -
          homeRow.goalsagainst;

        awayRow.goaldiff =
          awayRow.goalsfor -
          awayRow.goalsagainst;

        rowsByTeam.set(
          Number(homeTeam.id),
          homeRow
        );

        rowsByTeam.set(
          Number(awayTeam.id),
          awayRow
        );

        liveMatchesApplied += 1;
      }

      if (liveMatchesApplied > 0) {
        rows = Array.from(
          rowsByTeam.values()
        );

        /*
         * Orden provisional:
         * puntos -> diferencia de goles ->
         * goles a favor.
         */
        rows.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }

          if (b.goaldiff !== a.goaldiff) {
            return (
              b.goaldiff - a.goaldiff
            );
          }

          if (b.goalsfor !== a.goalsfor) {
            return (
              b.goalsfor - a.goalsfor
            );
          }

          return (
            Number(a.position) -
            Number(b.position)
          );
        });

        rows = rows.map(
          (row, index) => ({
            ...row,
            position: index + 1,
          })
        );

        liveApplied = true;
      }
    } catch (liveError) {
      console.warn(
        'No se pudo calcular clasificación LIVE:',
        liveError.message
      );
    }
    /*
     * 3. Guardamos el resultado en Supabase
     * conservando exactamente el contrato
     * que ya utiliza la app.
     */
    const { error: deleteError } =
      await supabase
        .from('standings')
        .delete()
        .neq('id', 0);

    if (deleteError) {
      throw deleteError;
    }

    if (rows.length > 0) {
      const { error: insertError } =
        await supabase
          .from('standings')
          .insert(rows);

      if (insertError) {
        throw insertError;
      }
    }

    return res.json({
      ok: true,
      provider: 'sportmonks',
      inserted: rows.length,

      competition:
        competition.key,

      season:
        competition.seasonId,

      league:
        competition.leagueId,

      liveApplied,
      liveMatchesApplied,
    });
  } catch (error) {
    console.error(
      'Error sincronizando clasificación:',
      error
    );

    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Sincroniza el calendario completo de LaLiga2
 * desde Sportmonks hacia Supabase.
 */
router.post('/api/football/sync-calendar', async (req, res) => {
  try {
    const competition =
      SPORTMONKS_COMPETITIONS.laliga2;

    if (
      !competition?.leagueId ||
      !competition?.seasonId
    ) {
      throw new Error(
        'Configuración de LaLiga2 incompleta'
      );
    }

    const dateRanges = [
      ['2026-08-01', '2026-10-31'],
      ['2026-11-01', '2027-01-31'],
      ['2027-02-01', '2027-04-30'],
      ['2027-05-01', '2027-06-30'],
    ];

    const fixtures = [];

    for (const [from, to] of dateRanges) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await sportmonksFetch(
          `/fixtures/between/${from}/${to}` +
            `?include=participants;scores;state;league;round;venue` +
            `&filters=fixtureLeagues:${competition.leagueId}` +
            `&per_page=50&page=${page}`
        );

        const pageFixtures =
          Array.isArray(data.data)
            ? data.data
            : [];

        fixtures.push(...pageFixtures);

        hasMore =
          data.pagination?.has_more === true;

        page += 1;
      }
    }

    const uniqueFixtures =
      Array.from(
        new Map(
          fixtures.map((fixture) => [
            String(fixture.id),
            fixture,
          ])
        ).values()
      );

    const rows = uniqueFixtures.map((fixture) => {
      const participants =
        fixture.participants || [];

      const scores =
        fixture.scores || [];

      const homeTeam = participants.find(
        (team) =>
          team.meta?.location === 'home'
      );

      const awayTeam = participants.find(
        (team) =>
          team.meta?.location === 'away'
      );

      const getCurrentScore = (
        participantId
      ) => {
        const score = scores.find(
          (item) =>
            item.participant_id ===
              participantId &&
            item.description === 'CURRENT'
        );

        return score?.score?.goals ?? null;
      };

      const sportmonksStatus =
        fixture.state?.short_name || '';

      const statusMap = {
        '1st': '1H',
        HT: 'HT',
        '2nd': '2H',
        ET: 'ET',
        FT: 'FT',
        NS: 'NS',
      };

      const status =
        statusMap[sportmonksStatus] ||
        sportmonksStatus ||
        'NS';

      const hasStarted =
        status !== 'NS';

      const homeApiName =
        homeTeam?.name || '';

      const awayApiName =
        awayTeam?.name || '';

      return {
        fixtureId: fixture.id,

        homeTeamId:
          homeTeam?.id ?? null,

        awayTeamId:
          awayTeam?.id ?? null,

        date: fixture.starting_at
          ? `${fixture.starting_at.replace(
              ' ',
              'T'
            )}Z`
          : null,

        status,

        league:
          competition.name,

        round: fixture.round?.name
          ? `Regular Season - ${fixture.round.name}`
          : '',

        venue:
          getCorrectVenue(
            homeApiName,
            fixture.venue?.name
          ),

        homeTeam:
          getDisplayTeamName(
            homeApiName
          ),

        awayTeam:
          getDisplayTeamName(
            awayApiName
          ),

        homeLogo:
          getTeamLogo(
            homeApiName,
            homeTeam?.image_path || ''
          ),

        awayLogo:
          getTeamLogo(
            awayApiName,
            awayTeam?.image_path || ''
          ),

        homeGoals:
          hasStarted && homeTeam
            ? getCurrentScore(homeTeam.id)
            : null,

        awayGoals:
          hasStarted && awayTeam
            ? getCurrentScore(awayTeam.id)
            : null,
      };
    });

    const { error: deleteError } =
      await supabase
        .from('calendar')
        .delete()
        .neq('id', 0);

    if (deleteError) {
      throw deleteError;
    }

    if (rows.length > 0) {
      const { error: insertError } =
        await supabase
          .from('calendar')
          .insert(rows);

      if (insertError) {
        throw insertError;
      }
    }

    res.json({
      ok: true,
      provider: 'sportmonks',
      inserted: rows.length,
      season: competition.seasonId,
      league: competition.leagueId,
    });
  } catch (error) {
    console.error(
      'Error sincronizando calendario:',
      error
    );

    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Busca el próximo partido del Castellón
 * dentro del calendario sincronizado.
 */
router.post('/api/football/sync-next-match', async (req, res) => {
  try {
    const now = new Date().toISOString();

    const { data: matches, error } = await supabase
      .from('calendar')
      .select('*')
      .gte('date', now)
      .or(
        'homeTeam.ilike.%Castell%,awayTeam.ilike.%Castell%'
      )
      .order('date', { ascending: true })
      .limit(1);

    if (error) {
      throw error;
    }

    if (!matches || matches.length === 0) {
      return res.status(404).json({
        ok: false,
        message:
          'No se ha encontrado próximo partido del Castellón',
      });
    }

    const match = matches[0];
    const matchDate = new Date(match.date);

    const formattedDate =
      matchDate.toLocaleDateString('es-ES', {
        timeZone: TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    const formattedTime =
      matchDate.toLocaleTimeString('es-ES', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

  const castellonIsHome = isCastellon(match.homeTeam);

const nextMatch = {
  id: '1',

  teamName: match.homeTeam,
  teamShortName: getShortTeamName(match.homeTeam),

  opponent: match.awayTeam,
  opponentShortName: getShortTeamName(match.awayTeam),

  isHome: castellonIsHome,

  date: formattedDate,
  time: formattedTime,
  stadium: match.venue || '',
  competition: match.league || '',

  teamLogo: match.homeLogo,
  opponentLogo: match.awayLogo,

  updated_at: new Date().toISOString(),
};

    const { error: upsertError } = await supabase
      .from('next_match')
      .upsert(nextMatch, {
        onConflict: 'id',
      });

    if (upsertError) {
      throw upsertError;
    }

    res.json({
      ok: true,
      next_match: nextMatch,
    });
  } catch (error) {
    console.error(
      'Error sincronizando próximo partido:',
      error
    );

    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});


/**
 * Resultados en directo de la competición configurada.
 * GET /api/football/live
 */
/**
 * Resultados en directo de la competición configurada.
 * GET /api/football/live
 */
router.get('/api/football/live', async (req, res) => {
  try {
    const now = Date.now();

    const currentCacheMs = liveCache
      ? getLiveCacheMs(liveCache)
      : LIVE_CACHE_MS;

// Si tenemos datos recientes, no consultamos API-Football.
if (
  liveCache &&
  now - liveCacheSavedAt < currentCacheMs
) {
      return res.json({
        ...liveCache,
        cache: true,
      });
    }

    // Si otro usuario ya está actualizando los datos,
    // esperamos esa misma petición en lugar de lanzar otra.
    if (liveRefreshPromise) {
      const result = await liveRefreshPromise;

      return res.json({
        ...result,
        cache: true,
      });
    }

    liveRefreshPromise = (async () => {
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

       const [year, month, day] = today
        .split('-')
        .map(Number);

      let fixtures = [];

try {
  const selectedLeagueIds = [
    ...new Set(
      Object.values(SPORTMONKS_COMPETITIONS)
        .map((competition) => competition.leagueId)
        .filter((id) => Number.isFinite(id))
    ),
  ];

  /*
   * 1. Obtenemos todos los partidos de HOY
   * de nuestras cinco competiciones.
   */
  const todayFixturesCacheIsValid =
  sportmonksTodayFixturesCacheDate === today &&
  Array.isArray(sportmonksTodayFixturesCache) &&
  Date.now() - sportmonksTodayFixturesSavedAt <
    SPORTMONKS_TODAY_FIXTURES_CACHE_MS;

let todayFixtures;

if (todayFixturesCacheIsValid) {
  todayFixtures = sportmonksTodayFixturesCache;
} else {
  const dailyResponses = await Promise.all(
    selectedLeagueIds.map((leagueId) =>
      sportmonksFetch(
        `/fixtures/between/${today}/${today}` +
          `?include=participants;scores;state;periods;league` +
          `&filters=fixtureLeagues:${leagueId}`
      )
    )
  );

  todayFixtures = dailyResponses.flatMap(
    (response) =>
      Array.isArray(response.data)
        ? response.data
        : []
  );

  sportmonksTodayFixturesCache =
    todayFixtures;

  sportmonksTodayFixturesCacheDate =
    today;

  sportmonksTodayFixturesSavedAt =
    Date.now();
}

  /*
   * 2. Pedimos el directo actual.
   *
   * Sportmonks puede tener una versión más reciente
   * del partido en este endpoint: marcador, estado,
   * minuto, periodos, etc.
   */
  const liveData = await sportmonksFetch(
    '/livescores/inplay?include=participants;scores;state;periods;league'
  );

  const liveFixtures = Array.isArray(liveData.data)
    ? liveData.data
    : [];

  /*
   * 3. Nos quedamos solo con las competiciones
   * contratadas por Albinegros.
   */
  const allowedLeagueIds = new Set(
    selectedLeagueIds.map(Number)
  );

  const filteredLiveFixtures =
    liveFixtures.filter((fixture) =>
      allowedLeagueIds.has(
        Number(
          fixture.league_id ??
          fixture.league?.id
        )
      )
    );

  /*
   * 4. Indexamos los datos LIVE por fixtureId.
   */
  const liveFixturesById = new Map(
    filteredLiveFixtures.map((fixture) => [
      String(fixture.id),
      fixture,
    ])
  );

  /*
   * 5. Para cada partido del día usamos:
   *
   * - datos LIVE si existen;
   * - datos normales del fixture si todavía
   *   no está en directo o ya ha terminado.
   */
  fixtures = todayFixtures
    .map((fixture) => {
      const liveFixture =
        liveFixturesById.get(
          String(fixture.id)
        );

      return liveFixture || fixture;
    })
    .sort((a, b) => {
      const dateA = a.starting_at
        ? new Date(
            `${a.starting_at.replace(' ', 'T')}Z`
          ).getTime()
        : 0;

      const dateB = b.starting_at
        ? new Date(
            `${b.starting_at.replace(' ', 'T')}Z`
          ).getTime()
        : 0;

      return dateA - dateB;
    });
} catch (error) {
  console.warn(
    'No se pudieron actualizar los partidos del día con Sportmonks:',
    error.message
  );

  fixtures = [];
}
  const matches = fixtures.map((fixture) => {
  const participants = fixture.participants || [];
  const scores = fixture.scores || [];
  const periods = fixture.periods || [];

  const homeTeam = participants.find(
    (team) => team.meta?.location === 'home'
  );

  const awayTeam = participants.find(
    (team) => team.meta?.location === 'away'
  );

  const getCurrentScore = (participantId) => {
    const currentScore = scores.find(
      (score) =>
        score.participant_id === participantId &&
        score.description === 'CURRENT'
    );

    return currentScore?.score?.goals ?? null;
  };

  const activePeriod = periods
    .filter((period) => period.ticking === true)
    .sort(
      (a, b) =>
        Number(b.id || 0) - Number(a.id || 0)
    )[0];

  const elapsed =
    Number.isFinite(Number(activePeriod?.minutes))
      ? Number(activePeriod.minutes)
      : null;

  const seconds =
    Number.isFinite(Number(activePeriod?.seconds))
      ? Number(activePeriod.seconds)
      : null;

  const regulationEnd =
    Number.isFinite(Number(activePeriod?.counts_from)) &&
    Number.isFinite(Number(activePeriod?.period_length))
      ? Number(activePeriod.counts_from) +
        Number(activePeriod.period_length)
      : null;

  const extra =
    elapsed !== null &&
    regulationEnd !== null &&
    elapsed > regulationEnd
      ? elapsed - regulationEnd
      : 0;

  const sportmonksStatus =
    fixture.state?.short_name || '';

  const statusMap = {
    '1st': '1H',
    HT: 'HT',
    '2nd': '2H',
    ET: 'ET',
    FT: 'FT',
    NS: 'NS',
  };

  const normalizedStatus =
    statusMap[sportmonksStatus] ||
    sportmonksStatus;

  const homeScore =
    normalizedStatus !== 'NS' && homeTeam
      ? getCurrentScore(homeTeam.id)
      : null;

  const awayScore =
    normalizedStatus !== 'NS' && awayTeam
      ? getCurrentScore(awayTeam.id)
      : null;

  return {
    fixtureId: fixture.id,

    date: fixture.starting_at
      ? `${fixture.starting_at.replace(' ', 'T')}Z`
      : null,

    timestamp: fixture.starting_at
      ? Math.floor(
          new Date(
            `${fixture.starting_at.replace(' ', 'T')}Z`
          ).getTime() / 1000
        )
      : null,

    status: {
      short: normalizedStatus,
      long: fixture.state?.name ?? '',
      elapsed,
      extra,
      seconds,
    },

    league: {
      id: fixture.league?.id ?? null,
      name: getCompetitionName(
        fixture.league?.name || ''
      ),
      round: '',
      logo: fixture.league?.image_path ?? '',
    },

    venue: {
      id: null,
      name: '',
      city: '',
    },

    referee: '',

    home: {
      id: homeTeam?.id ?? null,
      name: getDisplayTeamName(
        homeTeam?.name || ''
      ),
      shortName: getShortTeamName(
        homeTeam?.name || ''
      ),
      logo: getTeamLogo(
        homeTeam?.name || '',
        homeTeam?.image_path || ''
      ),
      winner:
        homeScore !== null &&
        awayScore !== null &&
        homeScore !== awayScore
          ? homeScore > awayScore
          : null,
      isCastellon: isCastellon(
        homeTeam?.name || ''
      ),
    },

    away: {
      id: awayTeam?.id ?? null,
      name: getDisplayTeamName(
        awayTeam?.name || ''
      ),
      shortName: getShortTeamName(
        awayTeam?.name || ''
      ),
      logo: getTeamLogo(
        awayTeam?.name || '',
        awayTeam?.image_path || ''
      ),
      winner:
        homeScore !== null &&
        awayScore !== null &&
        homeScore !== awayScore
          ? awayScore > homeScore
          : null,
      isCastellon: isCastellon(
        awayTeam?.name || ''
      ),
    },

    goals: {
      home: homeScore,
      away: awayScore,
    },

    score: {
      halftime: {
        home:
          normalizedStatus !== 'NS' && homeTeam
            ? scores.find(
                (score) =>
                  score.participant_id === homeTeam.id &&
                  score.description === '1ST_HALF'
              )?.score?.goals ?? null
            : null,

        away:
          normalizedStatus !== 'NS' && awayTeam
            ? scores.find(
                (score) =>
                  score.participant_id === awayTeam.id &&
                  score.description === '1ST_HALF'
              )?.score?.goals ?? null
            : null,
      },

      fulltime: {
        home:
          normalizedStatus === 'FT'
            ? homeScore
            : null,

        away:
          normalizedStatus === 'FT'
            ? awayScore
            : null,
      },

      extratime: {
        home: null,
        away: null,
      },

      penalty: {
        home: null,
        away: null,
      },
    },
  };
});

      const result = {
  ok: true,
  provider: 'sportmonks',
  live: true,
  league: null,
  season: null,
  timezone: TIMEZONE,
  count: matches.length,
  updatedAt: new Date().toISOString(),
  matches,
};

      // Guardamos el resultado para los siguientes usuarios.
      liveCache = result;
      liveCacheSavedAt = Date.now();

      return result;
    })();

    try {
      const result = await liveRefreshPromise;

      return res.json({
        ...result,
        cache: false,
      });
    } finally {
      liveRefreshPromise = null;
    }
  } catch (error) {
    console.error(
      'Error cargando resultados en directo:',
      error
    );

    // Si API-Football falla temporalmente pero tenemos
    // datos anteriores, mejor servirlos que romper el directo.
    if (liveCache) {
      return res.json({
        ...liveCache,
        cache: true,
        stale: true,
      });
    }

    return res.status(500).json({
      ok: false,
      error:
        'No se pudieron cargar los resultados en directo',
      detail: error.message,
    });
  }
});


/**
 * Detalle completo de un partido.
 *
 * Devuelve información base, eventos, alineaciones y estadísticas.
 * Los bloques opcionales se degradan a [] si API-Football no dispone
 * todavía de esa información para el encuentro.
 *
 * GET /api/football/fixture/:fixtureId/details
 */
/**
 * GET /api/football/fixture/:fixtureId/details
 */
router.get('/api/football/fixture/:fixtureId/details', async (req, res) => {
  try {
    const fixtureId = String(req.params.fixtureId || '').trim();

    if (!/^\d+$/.test(fixtureId)) {
      return res.status(400).json({
        ok: false,
        error: 'ID de partido no válido',
      });
    }

    const fixtureData = await sportmonksFetch(
      `/fixtures/${encodeURIComponent(fixtureId)}` +
       `?include=participants;scores;state;periods;league;venue;round;events;lineups;statistics.type`
    );

    const match = fixtureData.data;

    if (!match) {
      return res.status(404).json({
        ok: false,
        error: 'Partido no encontrado',
      });
    }

    const participants = Array.isArray(match.participants)
      ? match.participants
      : [];

    const scores = Array.isArray(match.scores)
      ? match.scores
      : [];

    const periods = Array.isArray(match.periods)
      ? match.periods
      : [];

    const rawEvents = Array.isArray(match.events)
      ? match.events
      : [];

    const rawLineups = Array.isArray(match.lineups)
      ? match.lineups
      : [];

    const rawStatistics = Array.isArray(match.statistics)
      ? match.statistics
      : [];

    const homeTeam = participants.find(
      (team) => team.meta?.location === 'home'
    );

    const awayTeam = participants.find(
      (team) => team.meta?.location === 'away'
    );

    if (!homeTeam || !awayTeam) {
      return res.status(404).json({
        ok: false,
        error: 'No se encontraron los equipos del partido',
      });
    }

    const getScore = (participantId, descriptions) => {
      const descriptionList = Array.isArray(descriptions)
        ? descriptions
        : [descriptions];

      const score = scores.find(
        (item) =>
          Number(item.participant_id) === Number(participantId) &&
          descriptionList.includes(item.description)
      );

      return score?.score?.goals ?? null;
    };

    const sportmonksStatus =
      match.state?.short_name || '';

    const statusMap = {
      '1st': '1H',
      HT: 'HT',
      '2nd': '2H',
      ET: 'ET',
      BT: 'BT',
      FT: 'FT',
      AET: 'AET',
      PEN: 'PEN',
      NS: 'NS',
      LIVE: 'LIVE',
    };

    const normalizedStatus =
      statusMap[sportmonksStatus] ||
      sportmonksStatus;

    const activePeriod = periods
      .filter((period) => period.ticking === true)
      .sort(
        (a, b) =>
          Number(b.id || 0) - Number(a.id || 0)
      )[0];

    const elapsed =
      Number.isFinite(Number(activePeriod?.minutes))
        ? Number(activePeriod.minutes)
        : null;

    const regulationEnd =
      Number.isFinite(Number(activePeriod?.counts_from)) &&
      Number.isFinite(Number(activePeriod?.period_length))
        ? Number(activePeriod.counts_from) +
          Number(activePeriod.period_length)
        : null;

    const extra =
      elapsed !== null &&
      regulationEnd !== null &&
      elapsed > regulationEnd
        ? elapsed - regulationEnd
        : 0;

    const homeCurrentScore =
      normalizedStatus !== 'NS'
        ? getScore(homeTeam.id, 'CURRENT')
        : null;

    const awayCurrentScore =
      normalizedStatus !== 'NS'
        ? getScore(awayTeam.id, 'CURRENT')
        : null;

    const normalizeParticipant = (
      participant,
      currentScore,
      opponentScore
    ) => {
      const apiName = participant?.name || '';

      return {
        id: participant?.id ?? null,
        name: getDisplayTeamName(apiName),
        shortName: getShortTeamName(apiName),
        logo: getTeamLogo(
          apiName,
          participant?.image_path || ''
        ),
        winner:
          currentScore !== null &&
          opponentScore !== null &&
          currentScore !== opponentScore
            ? currentScore > opponentScore
            : null,
        isCastellon: isCastellon(apiName),
      };
    };

    const getParticipant = (participantId) =>
      participants.find(
        (participant) =>
          Number(participant.id) ===
          Number(participantId)
      );

    const normalizeEventType = (event) =>
      event.type?.name ||
      event.type?.developer_name ||
      event.type?.code ||
      event.type_name ||
      '';

    const events = rawEvents
      .map((event) => {
        const eventTeam = getParticipant(
          event.participant_id
        );

        const eventTeamName =
          eventTeam?.name || '';

        return {
          time: {
            elapsed:
              event.minute ??
              event.time?.minute ??
              event.time?.elapsed ??
              null,

            extra:
              event.extra_minute ??
              event.time?.extra ??
              null,
          },

          team: {
            id:
              eventTeam?.id ??
              event.participant_id ??
              null,

            name: getDisplayTeamName(
              eventTeamName
            ),

            logo: getTeamLogo(
              eventTeamName,
              eventTeam?.image_path || ''
            ),
          },

          player: {
            id:
              event.player_id ??
              event.player?.id ??
              null,

            name:
              event.player_name ||
              event.player?.display_name ||
              event.player?.name ||
              '',
          },

          assist: {
            id:
              event.related_player_id ??
              event.assist?.id ??
              null,

            name:
              event.related_player_name ||
              event.assist?.display_name ||
              event.assist?.name ||
              '',
          },

          type: normalizeEventType(event),

          detail:
            event.type?.name ||
            event.type?.developer_name ||
            event.result ||
            '',

          comments:
            event.info ||
            event.addition ||
            '',
        };
      })
      .sort((a, b) => {
        const minuteA =
          Number(a.time.elapsed || 0) * 100 +
          Number(a.time.extra || 0);

        const minuteB =
          Number(b.time.elapsed || 0) * 100 +
          Number(b.time.extra || 0);

        return minuteA - minuteB;
      });

    const buildPlayer = (entry) => ({
      id:
        entry.player_id ??
        entry.player?.id ??
        null,

      name:
        entry.player_name ||
        entry.player?.display_name ||
        entry.player?.name ||
        '',

      number:
        entry.jersey_number ??
        entry.number ??
        null,

      position:
  ({
    24: 'G',
    25: 'D',
    26: 'M',
    27: 'F',
  })[Number(entry.position_id)] || '',

      grid:
        entry.formation_field ||
        entry.formation_position ||
        '',
    });

    const getFormation = (participantId) => {
  const teamEntries = rawLineups.filter(
    (entry) =>
      Number(entry.team_id) ===
      Number(participantId)
  );

  return '';
};

    const buildLineup = (participant) => {
  const teamEntries = rawLineups.filter(
    (entry) =>
      Number(entry.team_id) ===
      Number(participant.id)
  );

      const starters = teamEntries.filter(
        (entry) => Number(entry.type_id) === 11
      );

      const substitutes = teamEntries.filter(
        (entry) => Number(entry.type_id) === 12
      );

      return {
        team: {
          id: participant.id,
          name: getDisplayTeamName(
            participant.name || ''
          ),
          logo: getTeamLogo(
            participant.name || '',
            participant.image_path || ''
          ),
        },

        coach: {
          id: null,
          name: '',
          photo: '',
        },

        formation: getFormation(
          participant.id
        ),

        startXI: starters.map(buildPlayer),

        substitutes:
          substitutes.map(buildPlayer),
      };
    };

    const lineups =
      rawLineups.length > 0
        ? [
            buildLineup(homeTeam),
            buildLineup(awayTeam),
          ]
        : [];

    const getStatTypeName = (stat) => {
  const developerName =
    stat.type?.developer_name || '';

  const typeMap = {
    BALL_POSSESSION: 'Ball Possession',
    SHOTS_TOTAL: 'Total Shots',
    SHOTS_ON_TARGET: 'Shots on Goal',
    SHOTS_OFF_TARGET: 'Shots off Goal',
    SHOTS_BLOCKED: 'Blocked Shots',
    CORNERS: 'Corner Kicks',
    OFFSIDES: 'Offsides',
    FOULS: 'Fouls',
    YELLOWCARDS: 'Yellow Cards',
    REDCARDS: 'Red Cards',
    SAVES: 'Goalkeeper Saves',
    PASSES: 'Total passes',
    SUCCESSFUL_PASSES: 'Passes accurate',
    SUCCESSFUL_PASSES_PERCENTAGE: 'Passes %',
  };

  return (
    typeMap[developerName] ||
    stat.type?.name ||
    developerName ||
    String(stat.type_id || '')
  );
};

    const getStatValue = (stat) => {
      if (
        stat.data &&
        typeof stat.data === 'object' &&
        Object.prototype.hasOwnProperty.call(
          stat.data,
          'value'
        )
      ) {
        return stat.data.value;
      }

      if (stat.value !== undefined) {
        return stat.value;
      }

      return null;
    };

    const buildStatistics = (participant) => {
      const teamStats = rawStatistics.filter(
        (stat) =>
          Number(stat.participant_id) ===
          Number(participant.id)
      );

      return {
        team: {
          id: participant.id,
          name: getDisplayTeamName(
            participant.name || ''
          ),
          logo: getTeamLogo(
            participant.name || '',
            participant.image_path || ''
          ),
        },

        statistics: teamStats.map((stat) => ({
          type: getStatTypeName(stat),
          value: getStatValue(stat),
        })),
      };
    };

    const statistics =
      rawStatistics.length > 0
        ? [
            buildStatistics(homeTeam),
            buildStatistics(awayTeam),
          ]
        : [];

    const matchDate = match.starting_at
      ? `${match.starting_at.replace(' ', 'T')}Z`
      : null;

    return res.json({
      ok: true,
      provider: 'sportmonks',
      updatedAt: new Date().toISOString(),

      fixture: {
        id: match.id ?? Number(fixtureId),

        date: matchDate,

        timestamp: matchDate
          ? Math.floor(
              new Date(matchDate).getTime() /
                1000
            )
          : null,

        referee:
          match.referee?.common_name ||
          match.referee?.display_name ||
          match.referee?.name ||
          '',

        timezone: TIMEZONE,

        status: {
          short: normalizedStatus,
          long: match.state?.name || '',
          elapsed,
          extra,
        },

        venue: {
          id: match.venue?.id ?? null,

          name: getCorrectVenue(
            homeTeam.name || '',
            match.venue?.name || ''
          ),

          city:
            match.venue?.city_name ||
            match.venue?.city ||
            '',
        },
      },

      league: {
        id: match.league?.id ?? null,

        name: getCompetitionName(
          match.league?.name || ''
        ),

        round:
          match.round?.name !== undefined
            ? `Regular Season - ${match.round.name}`
            : '',

        logo:
          match.league?.image_path || '',
      },

      home: normalizeParticipant(
        homeTeam,
        homeCurrentScore,
        awayCurrentScore
      ),

      away: normalizeParticipant(
        awayTeam,
        awayCurrentScore,
        homeCurrentScore
      ),

      goals: {
        home: homeCurrentScore,
        away: awayCurrentScore,
      },

      score: {
        halftime: {
          home: getScore(
            homeTeam.id,
            '1ST_HALF'
          ),

          away: getScore(
            awayTeam.id,
            '1ST_HALF'
          ),
        },

        fulltime: {
          home:
            ['FT', 'AET', 'PEN'].includes(
              normalizedStatus
            )
              ? homeCurrentScore
              : null,

          away:
            ['FT', 'AET', 'PEN'].includes(
              normalizedStatus
            )
              ? awayCurrentScore
              : null,
        },

        extratime: {
          home: getScore(homeTeam.id, [
            'EXTRA_TIME',
            'ET',
          ]),

          away: getScore(awayTeam.id, [
            'EXTRA_TIME',
            'ET',
          ]),
        },

        penalty: {
          home: getScore(homeTeam.id, [
            'PENALTIES',
            'PENALTY_SHOOTOUT',
          ]),

          away: getScore(awayTeam.id, [
            'PENALTIES',
            'PENALTY_SHOOTOUT',
          ]),
        },
      },

      events,
      lineups,
      statistics,
    });
  } catch (error) {
    console.error(
      'Error cargando detalle del partido con Sportmonks:',
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        'No se pudo cargar el detalle del partido',
      detail: error.message,
    });
  }
});

router.get('/api/football/team/:teamId/details', async (req, res) => {
  try {
    const teamId = String(req.params.teamId || '').trim();

    if (!/^\d+$/.test(teamId)) {
      return res.status(400).json({
        ok: false,
        error: 'ID de equipo no válido',
      });
    }

    const calculateAge = (birthDate) => {
      if (!birthDate) return null;

      const birth = new Date(`${birthDate}T12:00:00Z`);

      if (Number.isNaN(birth.getTime())) {
        return null;
      }

      const today = new Date();
      let age = today.getUTCFullYear() - birth.getUTCFullYear();

      const hasNotHadBirthday =
        today.getUTCMonth() < birth.getUTCMonth() ||
        (
          today.getUTCMonth() === birth.getUTCMonth() &&
          today.getUTCDate() < birth.getUTCDate()
        );

      if (hasNotHadBirthday) {
        age -= 1;
      }

      return age;
    };

    const normalizeImage = (image) => {
      if (!image) return '';

      if (
        String(image).toLowerCase().includes('placeholder')
      ) {
        return '';
      }

      return image;
    };

    const positionMap = {
      24: 'Goalkeeper',
      25: 'Defender',
      26: 'Midfielder',
      27: 'Attacker',
    };

const [
  teamData,
  squadData,
  playerOverridesResult,
] = await Promise.all([
  sportmonksFetch(
    `/teams/${encodeURIComponent(teamId)}` +
      `?include=venue;coaches.coach;statistics.details.type`
  ),
  sportmonksFetch(
    `/squads/teams/${encodeURIComponent(teamId)}` +
      `?include=player`
  ),
  Number(teamId) === 10008
    ? supabase
        .from('castellon_player_overrides')
        .select('sportmonks_player_id, photo')
    : Promise.resolve({
        data: [],
        error: null,
      }),
]);

    const team = teamData?.data;

    if (!team?.id) {
      return res.status(404).json({
        ok: false,
        error: 'Equipo no encontrado',
      });
    }

    const apiTeamName = team.name || '';
    const venue = team.venue || {};

    const squadRows = Array.isArray(squadData?.data)
      ? squadData.data
      : [];

      if (playerOverridesResult?.error) {
  console.warn(
    `No se pudieron cargar los overrides de jugadores del Castellón:`,
    playerOverridesResult.error.message
  );
}

const playerPhotoOverrides = new Map(
  (playerOverridesResult?.data || [])
    .filter(
      (row) =>
        row.sportmonks_player_id !== null &&
        row.sportmonks_player_id !== undefined &&
        row.photo
    )
    .map((row) => [
      String(row.sportmonks_player_id),
      row.photo,
    ])
);

    const squad = squadRows
      .filter((entry) => entry?.player)
      .map((entry) => {
        const player = entry.player || {};

        return {
          id:
            player.id ??
            entry.player_id ??
            null,

          name:
            player.display_name ||
            player.name ||
            player.common_name ||
            '',

          age: calculateAge(
            player.date_of_birth
          ),

          number:
            entry.jersey_number ??
            null,

          position:
            positionMap[
              Number(
                entry.position_id ??
                player.position_id
              )
            ] || '',

          photo:
  playerPhotoOverrides.get(
    String(
      player.id ??
      entry.player_id ??
      ''
    )
  ) ||
  normalizeImage(
    player.image_path || ''
  ),
        };
      });

    const coachRows = Array.isArray(team.coaches)
      ? team.coaches
      : [];

    const activeCoachEntry =
      coachRows.find(
        (entry) => entry.active === true
      ) ||
      coachRows.find(
        (entry) => entry.coach
      ) ||
      null;

    const activeCoach =
      activeCoachEntry?.coach || null;

    let coach = activeCoach
      ? {
          id: activeCoach.id ?? null,

          name:
            activeCoach.display_name ||
            activeCoach.name ||
            activeCoach.common_name ||
            '',

          firstname:
            activeCoach.firstname || '',

          lastname:
            activeCoach.lastname || '',

          age: calculateAge(
            activeCoach.date_of_birth
          ),

          birth: {
            date:
              activeCoach.date_of_birth ||
              null,
            place: '',
            country: '',
          },

          nationality: '',

          height:
            activeCoach.height
              ? String(activeCoach.height)
              : '',

          weight:
            activeCoach.weight
              ? String(activeCoach.weight)
              : '',

          photo: normalizeImage(
            activeCoach.image_path || ''
          ),

          career: [],
        }
      : null;

    /*
     * Conservamos temporalmente los datos propios del Castellón
     * mientras Sportmonks no tenga fotografía/datos completos
     * del entrenador.
     *
     * El ID usado por la APP ya es Sportmonks: 10008.
     */
    let customCastellonTeam = null;

    if (Number(teamId) === 10008) {
      const {
        data: customTeamRows,
        error: customTeamError,
      } = await supabase
        .from('castellon_team')
        .select(
          'team_id,name,founded,country,coach_name,coach_photo,coach_birth_date,coach_birth_place,coach_birth_country,coach_nationality,coach_height,stadium_name,stadium_city,stadium_capacity,stadium_surface,stadium_image'
        )
        .limit(1);

      if (customTeamError) {
        console.warn(
          'No se pudieron cargar los datos propios del Castellón:',
          customTeamError.message
        );
      }

      customCastellonTeam =
        Array.isArray(customTeamRows) &&
        customTeamRows.length > 0
          ? customTeamRows[0]
          : null;
    }

    if (
      Number(teamId) === 10008 &&
      customCastellonTeam?.coach_name
    ) {
      coach = {
        id: activeCoach?.id ?? null,

        name:
          customCastellonTeam.coach_name,

        firstname:
          activeCoach?.firstname ||
          'Pablo',

        lastname:
          activeCoach?.lastname ||
          'Hernández',

        age: calculateAge(
          customCastellonTeam.coach_birth_date ||
          activeCoach?.date_of_birth
        ),

        birth: {
          date:
            customCastellonTeam.coach_birth_date ||
            activeCoach?.date_of_birth ||
            null,

          place:
            customCastellonTeam.coach_birth_place ||
            '',

          country:
            customCastellonTeam.coach_birth_country ||
            '',
        },

        nationality:
          customCastellonTeam.coach_nationality ||
          '',

        height:
          customCastellonTeam.coach_height ||
          (
            activeCoach?.height
              ? String(activeCoach.height)
              : ''
          ),

        weight:
          activeCoach?.weight
            ? String(activeCoach.weight)
            : '',

        photo:
          customCastellonTeam.coach_photo ||
          normalizeImage(
            activeCoach?.image_path || ''
          ),

        career: [],
      };
    }

    /*
     * Detectamos cuál de nuestras competiciones corresponde
     * a la temporada actual del equipo.
     */
    const statisticRows = Array.isArray(
      team.statistics
    )
      ? team.statistics
      : [];

    const competitionList =
      Object.values(
        SPORTMONKS_COMPETITIONS
      ).filter(
        (competition) =>
          competition?.seasonId
      );

    const currentCompetition =
      competitionList.find(
        (competition) =>
          statisticRows.some(
            (stat) =>
              Number(stat.season_id) ===
              Number(competition.seasonId)
          )
      ) || null;

    let form = '';

    if (
      currentCompetition?.leagueId &&
      currentCompetition?.seasonId
    ) {
      try {
        const today =
          new Date()
            .toISOString()
            .slice(0, 10);

        const formData =
          await sportmonksFetch(
            `/fixtures/between/2026-08-01/${today}/${teamId}` +
              `?include=participants;scores;state;league`
          );

        const finishedFixtures =
          (formData?.data || [])
            .map(normalizeSportmonksFixture)
            .filter(
              (fixture) =>
                Number(fixture.league?.id) ===
                  Number(
                    currentCompetition.leagueId
                  ) &&
                ['FT', 'AET', 'PEN'].includes(
                  fixture.status?.shortName
                ) &&
                fixture.home?.score !== null &&
                fixture.away?.score !== null
            )
            .sort(
              (a, b) =>
                new Date(b.date) -
                new Date(a.date)
            )
            .slice(0, 5);

        form = finishedFixtures
          .map((fixture) => {
            const isHome =
              Number(fixture.home?.teamId) ===
              Number(teamId);

            const teamScore =
              Number(
                isHome
                  ? fixture.home?.score
                  : fixture.away?.score
              );

            const opponentScore =
              Number(
                isHome
                  ? fixture.away?.score
                  : fixture.home?.score
              );

            if (teamScore > opponentScore) {
              return 'V';
            }

            if (teamScore < opponentScore) {
              return 'D';
            }

            return 'E';
          })
          .reverse()
          .join('');
      } catch (formError) {
        console.warn(
          `No se pudo cargar la forma del equipo ${teamId}:`,
          formError.message
        );
      }
        }

    let standing = null;

    if (currentCompetition?.seasonId) {
      try {
        const standingsData =
          await sportmonksFetch(
            `/standings/seasons/${currentCompetition.seasonId}` +
              `?include=participant;details.type`
          );

        const standingsRows =
          Array.isArray(standingsData?.data)
            ? standingsData.data
            : [];

        const standingRow =
          standingsRows.find(
            (row) =>
              Number(row.participant_id) ===
              Number(teamId)
          );

        if (standingRow) {
          standing =
            normalizeSportmonksStanding(
              standingRow
            );
        }
      } catch (standingError) {
        console.warn(
          `No se pudo cargar la clasificación del equipo ${teamId}:`,
          standingError.message
        );
      }
    }

    const played =
      Number(
        standing?.playedgames ?? 0
      );

    const wins =
      Number(
        standing?.won ?? 0
      );

    const draws =
      Number(
        standing?.draw ?? 0
      );

    const losses =
      Number(
        standing?.lost ?? 0
      );

    const goalsFor =
      Number(
        standing?.goalsfor ?? 0
      );

    const goalsAgainst =
      Number(
        standing?.goalsagainst ?? 0
      );

          const currentTeamStatistic =
      statisticRows.find(
        (stat) =>
          Number(stat.season_id) ===
          Number(currentCompetition?.seasonId)
      ) || null;

    const statisticDetails =
      Array.isArray(
        currentTeamStatistic?.details
      )
        ? currentTeamStatistic.details
        : [];

    const cleanSheetStat =
      statisticDetails.find(
        (detail) =>
          detail?.type?.developer_name ===
          'CLEANSHEET'
      );

    const failedToScoreStat =
      statisticDetails.find(
        (detail) =>
          detail?.type?.developer_name ===
          'FAILED_TO_SCORE'
      );

    const cleanSheet = {
      home: Number(
        cleanSheetStat?.value?.home?.count ?? 0
      ),
      away: Number(
        cleanSheetStat?.value?.away?.count ?? 0
      ),
      total: Number(
        cleanSheetStat?.value?.all?.count ?? 0
      ),
    };

    const failedToScore = {
      home: Number(
        failedToScoreStat?.value?.home?.count ?? 0
      ),
      away: Number(
        failedToScoreStat?.value?.away?.count ?? 0
      ),
      total: Number(
        failedToScoreStat?.value?.all?.count ?? 0
      ),
    };



    return res.json({
      ok: true,
      provider: 'sportmonks',
      updatedAt: new Date().toISOString(),

      team: {
        id: Number(team.id),

        name:
          customCastellonTeam?.name ||
          getDisplayTeamName(
            apiTeamName
          ),

        shortName:
          getShortTeamName(
            customCastellonTeam?.name ||
            apiTeamName
          ),

        code:
          team.short_code || '',

        country:
          customCastellonTeam?.country ||
          (
            Number(team.country_id) === 32
              ? 'España'
              : ''
          ),

        founded:
          customCastellonTeam?.founded ??
          team.founded ??
          null,

        national:
          team.type === 'national',

        logo:
          getTeamLogo(
            apiTeamName,
            team.image_path || ''
          ),

        isCastellon:
          isCastellon(apiTeamName),
      },

      venue: {
        id:
          venue.id ??
          null,

        name:
          customCastellonTeam?.stadium_name ||
          getCorrectVenue(
            apiTeamName,
            venue.name || ''
          ),

        address:
          venue.address || '',

        city:
          customCastellonTeam?.stadium_city ||
          venue.city_name ||
          '',

        capacity:
          customCastellonTeam?.stadium_capacity ??
          venue.capacity ??
          null,

        surface:
          customCastellonTeam?.stadium_surface ||
          venue.surface ||
          '',

        image:
          customCastellonTeam?.stadium_image ||
          normalizeImage(
            venue.image_path || ''
          ),
      },

      coach,

      coaches:
        coach
          ? [coach]
          : [],

      squad,

      season: {
        leagueId:
          currentCompetition?.leagueId ??
          null,

        season:
          currentCompetition?.seasonId
            ? String(
                currentCompetition.seasonId
              )
            : null,

        form,

        fixtures: {
          played: {
            home: 0,
            away: 0,
            total: played,
          },

          wins: {
            home: 0,
            away: 0,
            total: wins,
          },

          draws: {
            home: 0,
            away: 0,
            total: draws,
          },

          loses: {
            home: 0,
            away: 0,
            total: losses,
          },
        },

        goals: {
          for: {
            total: {
              home: 0,
              away: 0,
              total: goalsFor,
            },

            average: {
              home: null,
              away: null,
              total:
                played > 0
                  ? Number(
                      (
                        goalsFor /
                        played
                      ).toFixed(2)
                    )
                  : null,
            },
          },

          against: {
            total: {
              home: 0,
              away: 0,
              total: goalsAgainst,
            },

            average: {
              home: null,
              away: null,
              total:
                played > 0
                  ? Number(
                      (
                        goalsAgainst /
                        played
                      ).toFixed(2)
                    )
                  : null,
            },
          },
        },

        biggest: {
          streak: {
            wins: 0,
            draws: 0,
            loses: 0,
          },

          wins: {
            home: null,
            away: null,
          },

          loses: {
            home: null,
            away: null,
          },
        },

        cleanSheet,
        failedToScore,
        lineups: [],
      },
    });
  } catch (error) {
    console.error(
      'Error cargando ficha del equipo:',
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        'No se pudo cargar la ficha del equipo',
      detail: error.message,
    });
  }
});


/**
 * Ficha completa de un jugador.
 *
 * Devuelve perfil personal y estadísticas de la temporada configurada.
 *
 * GET /api/football/player/:playerId/details
 */
router.get('/api/football/player/:playerId/details', async (req, res) => {
  try {
    const playerId = String(req.params.playerId || '').trim();
    const requestedTeamId = String(req.query.teamId || '').trim();

    if (!/^\d+$/.test(playerId)) {
      return res.status(400).json({
        ok: false,
        error: 'ID de jugador no válido',
      });
    }

    if (
      requestedTeamId &&
      !/^\d+$/.test(requestedTeamId)
    ) {
      return res.status(400).json({
        ok: false,
        error: 'ID de equipo no válido',
      });
    }

    const positionMap = {
      24: 'Goalkeeper',
      25: 'Defender',
      26: 'Midfielder',
      27: 'Attacker',
    };

    const normalizeImage = (image) => {
      if (!image) return '';

      if (
        String(image)
          .toLowerCase()
          .includes('placeholder')
      ) {
        return '';
      }

      return image;
    };

    const calculateAge = (birthDate) => {
      if (!birthDate) return null;

      const birth = new Date(
        `${birthDate}T12:00:00Z`
      );

      if (Number.isNaN(birth.getTime())) {
        return null;
      }

      const today = new Date();

      let age =
        today.getUTCFullYear() -
        birth.getUTCFullYear();

      const hasNotHadBirthday =
        today.getUTCMonth() <
          birth.getUTCMonth() ||
        (
          today.getUTCMonth() ===
            birth.getUTCMonth() &&
          today.getUTCDate() <
            birth.getUTCDate()
        );

      if (hasNotHadBirthday) {
        age -= 1;
      }

      return age;
    };

    const playerData = await sportmonksFetch(
  `/players/${encodeURIComponent(playerId)}` +
    `?include=country;nationality;statistics.details.type;statistics.team;statistics.season`
);

    const player = playerData?.data;

    if (!player?.id) {
      return res.status(404).json({
        ok: false,
        error: 'Jugador no encontrado',
      });
    }

    const allStatistics = Array.isArray(
      player.statistics
    )
      ? player.statistics
      : [];

    /*
     * Solo usamos estadísticas pertenecientes a las
     * temporadas actuales de nuestras competiciones.
     */
    const competitionList =
      Object.values(
        SPORTMONKS_COMPETITIONS
      ).filter(
        (competition) =>
          competition?.seasonId
      );

    const currentSeasonIds = new Set(
      competitionList.map(
        (competition) =>
          Number(competition.seasonId)
      )
    );

    const currentStatistics =
      allStatistics.filter((stat) =>
        currentSeasonIds.has(
          Number(stat.season_id)
        )
      );

    /*
     * Si hemos llegado desde la ficha de un equipo,
     * damos prioridad a ese equipo.
     */
    const preferredRawStatistic =
      (
        requestedTeamId
          ? currentStatistics.find(
              (stat) =>
                Number(stat.team_id) ===
                Number(requestedTeamId)
            )
          : null
      ) ||
      currentStatistics.find(
        (stat) => stat.has_values === true
      ) ||
      currentStatistics[0] ||
      null;

    const resolvedTeamId =
      requestedTeamId ||
      (
        preferredRawStatistic?.team_id
          ? String(
              preferredRawStatistic.team_id
            )
          : ''
      );

    /*
     * Cargamos todos los equipos que necesitamos
     * para poder formar statistics y la ficha.
     */
    const relevantTeamIds = Array.from(
      new Set(
        [
          resolvedTeamId,
          ...currentStatistics.map(
            (stat) =>
              String(stat.team_id || '')
          ),
        ].filter(
          (id) =>
            id &&
            /^\d+$/.test(id)
        )
      )
    );

    const teamEntries =
      await Promise.all(
        relevantTeamIds.map(
          async (id) => {
            try {
              const teamData =
                await sportmonksFetch(
                  `/teams/${encodeURIComponent(id)}`
                );

              return [
                String(id),
                teamData?.data || null,
              ];
            } catch (error) {
              console.warn(
                `No se pudo cargar el equipo ${id} del jugador ${playerId}:`,
                error.message
              );

              return [
                String(id),
                null,
              ];
            }
          }
        )
      );

    const teamMap = new Map(
      teamEntries
    );

    const buildTeam = (teamId) => {
      if (!teamId) return null;

      const rawTeam = teamMap.get(
        String(teamId)
      );

      if (!rawTeam) {
        return {
          id: Number(teamId),
          name: '',
          shortName: '',
          logo: '',
          isCastellon:
            Number(teamId) === 10008,
        };
      }

      const rawName =
        rawTeam.name || '';

      return {
        id:
          rawTeam.id ??
          Number(teamId),

        name:
          getDisplayTeamName(rawName),

        shortName:
          getShortTeamName(rawName),

        logo:
          getTeamLogo(
            rawName,
            rawTeam.image_path || ''
          ),

        isCastellon:
          isCastellon(rawName),
      };
    };

    const getDetail = (
      stat,
      developerName
    ) => {
      const details =
        Array.isArray(stat?.details)
          ? stat.details
          : [];

      return (
        details.find(
          (detail) =>
            detail?.type
              ?.developer_name ===
            developerName
        ) || null
      );
    };

    const getValue = (
      stat,
      developerName,
      key = 'total',
      fallback = 0
    ) => {
      const detail = getDetail(
        stat,
        developerName
      );

      const value = detail?.value;

      if (
        value === null ||
        value === undefined
      ) {
        return fallback;
      }

      if (
        typeof value === 'number' ||
        typeof value === 'string'
      ) {
        const parsed = Number(value);

        return Number.isNaN(parsed)
          ? value
          : parsed;
      }

      if (
        typeof value === 'object'
      ) {
        const candidate =
          value[key] ??
          value.total ??
          value.value;

        if (
          candidate === null ||
          candidate === undefined
        ) {
          return fallback;
        }

        const parsed =
          Number(candidate);

        return Number.isNaN(parsed)
          ? candidate
          : parsed;
      }

      return fallback;
    };

    const normalizePlayerStatistic = (
      stat
    ) => {
      const competition =
        competitionList.find(
          (item) =>
            Number(item.seasonId) ===
            Number(stat.season_id)
        ) || null;

      const ratingDetail = getDetail(
        stat,
        'RATING'
      );

      const ratingValue =
        ratingDetail?.value &&
        typeof ratingDetail.value ===
          'object'
          ? (
              ratingDetail.value.average ??
              ratingDetail.value.value ??
              null
            )
          : (
              ratingDetail?.value ??
              null
            );

      const substitutionDetail =
        getDetail(
          stat,
          'SUBSTITUTIONS'
        );

      const substitutionValue =
        substitutionDetail?.value &&
        typeof substitutionDetail.value ===
          'object'
          ? substitutionDetail.value
          : {};

      return {
        team:
          buildTeam(
            stat.team_id
          ) || {
            id:
              stat.team_id ??
              null,
            name: '',
            shortName: '',
            logo: '',
            isCastellon: false,
          },

        league: {
          id:
            competition?.leagueId ??
            null,

          name:
            competition?.name ||
            '',

          country: 'España',

          logo: '',

          season:
            stat.season_id ??
            null,
        },

        games: {
          appearances:
            getValue(
              stat,
              'APPEARANCES'
            ),

          lineups:
            getValue(
              stat,
              'LINEUPS'
            ),

          minutes:
            getValue(
              stat,
              'MINUTES_PLAYED'
            ),

          number:
            stat.jersey_number ??
            null,

          position:
            positionMap[
              Number(
                stat.position_id ??
                player.position_id
              )
            ] || '',

          rating:
            ratingValue,

          captain: false,
        },

        substitutes: {
          in:
            Number(
              substitutionValue.in ??
              0
            ),

          out:
            Number(
              substitutionValue.out ??
              0
            ),

          bench:
            getValue(
              stat,
              'BENCH'
            ),
        },

        shots: {
          total:
            getValue(
              stat,
              'SHOTS_TOTAL'
            ),

          on:
            getValue(
              stat,
              'SHOTS_ON_TARGET'
            ),
        },

        goals: {
          total:
            getValue(
              stat,
              'GOALS'
            ),

          conceded:
            getValue(
              stat,
              'GOALS_CONCEDED'
            ),

          assists:
            getValue(
              stat,
              'ASSISTS'
            ),

          saves:
            getValue(
              stat,
              'SAVES'
            ),
        },

        passes: {
          total:
            getValue(
              stat,
              'PASSES'
            ),

          key:
            getValue(
              stat,
              'KEY_PASSES'
            ),

          accuracy:
            getValue(
              stat,
              'ACCURATE_PASSES_PERCENTAGE',
              'total',
              null
            ),
        },

        tackles: {
          total:
            getValue(
              stat,
              'TACKLES'
            ),

          blocks:
            getValue(
              stat,
              'BLOCKED_SHOTS'
            ),

          interceptions:
            getValue(
              stat,
              'INTERCEPTIONS'
            ),
        },

        duels: {
          total:
            getValue(
              stat,
              'TOTAL_DUELS'
            ),

          won:
            getValue(
              stat,
              'DUELS_WON'
            ),
        },

        dribbles: {
          attempts:
            getValue(
              stat,
              'DRIBBLED_ATTEMPTS'
            ),

          success:
            getValue(
              stat,
              'SUCCESSFUL_DRIBBLES'
            ),

          past:
            getValue(
              stat,
              'DRIBBLED_PAST'
            ),
        },

        fouls: {
          drawn:
            getValue(
              stat,
              'FOULS_DRAWN'
            ),

          committed:
            getValue(
              stat,
              'FOULS'
            ),
        },

        cards: {
          yellow:
            getValue(
              stat,
              'YELLOWCARDS'
            ),

          yellowRed:
            getValue(
              stat,
              'YELLOWRED_CARDS'
            ),

          red:
            getValue(
              stat,
              'REDCARDS'
            ),
        },

        penalty: {
          won: 0,
          committed: 0,
          scored: 0,
          missed: 0,
          saved: 0,
        },
      };
    };

    /*
     * Solo consideramos disponibles aquellas
     * estadísticas que realmente tienen valores.
     */
    const statistics =
      currentStatistics
        .filter(
          (stat) =>
            stat.has_values === true &&
            Array.isArray(
              stat.details
            ) &&
            stat.details.length > 0
        )
        .map(
          normalizePlayerStatistic
        );

    const preferredStatistics =
      (
        preferredRawStatistic
          ?.has_values === true &&
        Array.isArray(
          preferredRawStatistic.details
        ) &&
        preferredRawStatistic
          .details.length > 0
          ? normalizePlayerStatistic(
              preferredRawStatistic
            )
          : null
      ) ||
      statistics[0] ||
      null;

    const preferredTeam =
      buildTeam(
        resolvedTeamId
      ) ||
      preferredStatistics?.team ||
      null;

    /*
     * Aunque el jugador todavía no tenga estadísticas,
     * usamos su registro de temporada para dorsal y posición.
     */
    const playerNumber =
      preferredRawStatistic
        ?.jersey_number ??
      null;

    const playerPosition =
      positionMap[
        Number(
          preferredRawStatistic
            ?.position_id ??
          player.position_id
        )
      ] || '';


    let playerPhotoOverride = '';

    if (Number(resolvedTeamId) === 10008) {
      const {
        data: playerOverride,
        error: playerOverrideError,
      } = await supabase
        .from('castellon_player_overrides')
        .select('photo')
        .eq(
          'sportmonks_player_id',
          Number(player.id)
        )
        .maybeSingle();

      if (playerOverrideError) {
        console.warn(
          `No se pudo cargar el override de foto del jugador ${playerId}:`,
          playerOverrideError.message
        );
      } else {
        playerPhotoOverride =
          playerOverride?.photo || '';
      }
    }

    const playerProfile = {
      id: Number(player.id),

      name:
        player.display_name ||
        player.name ||
        player.common_name ||
        '',

      firstname:
        player.firstname || '',

      lastname:
        player.lastname || '',

      age:
        calculateAge(
          player.date_of_birth
        ),

            birth: {
        date:
          player.date_of_birth ||
          null,

        place: '',

        country:
  player.country?.iso2
    ? new Intl.DisplayNames(['es'], { type: 'region' }).of(player.country.iso2) ||
      player.country?.name ||
      ''
    : player.country?.name || '',
      },

      nationality:
  player.nationality?.iso2
    ? new Intl.DisplayNames(['es'], { type: 'region' }).of(player.nationality.iso2) ||
      player.nationality?.name ||
      ''
    : player.nationality?.name || '',

      nationalityCode:
        player.nationality?.iso2 ||
        '',

      height:
        player.height
          ? `${player.height} cm`
          : '',

      weight:
        player.weight
          ? `${player.weight} kg`
          : '',

      injured: false,

            photo:
        playerPhotoOverride ||
        normalizeImage(
          player.image_path || ''
        ),
      number:
        playerNumber,

      position:
        playerPosition,
    };

    /*
        /*
         /*
     * Trayectoria del jugador.
     *
     * Sportmonks se mantiene como fallback.
     * API-Football FREE aporta la trayectoria histórica
     * completa cuando está disponible.
     */
    const careerMap = new Map();

    for (const stat of allStatistics) {
      const rawTeam = stat?.team;

      if (!rawTeam?.id) {
        continue;
      }

      const rawTeamName = rawTeam.name || '';

      const seasonName =
        stat?.season?.name !== null &&
        stat?.season?.name !== undefined
          ? String(stat.season.name).trim()
          : '';

      const teamKey = String(rawTeam.id);

      if (!careerMap.has(teamKey)) {
        careerMap.set(teamKey, {
          team: {
            id: Number(rawTeam.id),
            name: getDisplayTeamName(rawTeamName),
            shortName: getShortTeamName(rawTeamName),
            logo: getTeamLogo(
              rawTeamName,
              rawTeam.image_path || ''
            ),
            isCastellon: isCastellon(rawTeamName),
          },
          seasons: [],
        });
      }

      const careerEntry =
        careerMap.get(teamKey);

      if (
        seasonName &&
        !careerEntry.seasons.includes(
          seasonName
        )
      ) {
        careerEntry.seasons.push(
          seasonName
        );
      }
    }

    const sportmonksCareer =
      Array.from(
        careerMap.values()
      ).sort((a, b) => {
        const latestA =
          a.seasons
            .slice()
            .sort()
            .at(-1) || '';

        const latestB =
          b.seasons
            .slice()
            .sort()
            .at(-1) || '';

        return latestB.localeCompare(
          latestA
        );
      });

    let career = sportmonksCareer;
    let careerSource = 'sportmonks';

    try {
      const historicalCareer =
        await getApiFootballFreeCareer(
          player
        );

      if (
        historicalCareer?.career?.length
      ) {
        career =
          historicalCareer.career;

        careerSource =
          historicalCareer.source ||
          'api-football-free';
      }
    } catch (error) {
      console.error(
        'Error aplicando trayectoria histórica:',
        error
      );
    }

    const preferredCompetition =
      competitionList.find(
        (competition) =>
          Number(
            competition.seasonId
          ) ===
          Number(
            preferredRawStatistic
              ?.season_id
          )
      ) || null;

    return res.json({
      ok: true,
      provider: 'sportmonks',
      updatedAt:
        new Date().toISOString(),

      profileSource:
        'sportmonks',

      statisticsAvailable:
        statistics.length > 0,

      player:
        playerProfile,

      team:
        preferredTeam,

      season:
        preferredCompetition
          ?.seasonId
          ? String(
              preferredCompetition
                .seasonId
            )
          : (
              preferredRawStatistic
                ?.season_id
                ? String(
                    preferredRawStatistic
                      .season_id
                  )
                : null
            ),

            preferredStatistics,

      statistics,

      careerSource,

      career,
    });
  } catch (error) {
    console.error(
      'Error cargando ficha del jugador:',
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        'No se pudo cargar la ficha del jugador',
      detail: error.message,
    });
  }
});



/**
 * Contador de comentarios para uno o varios partidos.
 * GET /api/football/comments/counts?fixtureIds=123,456
 */
router.get('/api/football/comments/counts', async (req, res) => {
  try {
    const fixtureIds = String(req.query.fixtureIds || '')
      .split(',')
      .map((value) => Number(String(value).trim()))
      .filter((value) => Number.isInteger(value) && value > 0)
      .slice(0, 100);

    if (fixtureIds.length === 0) {
      return res.json({
        ok: true,
        counts: {},
      });
    }

    const { data, error } = await supabase
      .from('match_comments')
      .select('fixture_id')
      .in('fixture_id', fixtureIds)
      .eq('is_deleted', false);

    if (error) throw error;

    const counts = {};

    for (const row of data || []) {
      const key = String(row.fixture_id);
      counts[key] = (counts[key] || 0) + 1;
    }

    return res.json({
      ok: true,
      counts,
    });
  } catch (error) {
    console.error('Error cargando contadores de comentarios:', error);

    return res.status(500).json({
      ok: false,
      error: 'No se pudieron cargar los contadores de comentarios',
      detail: error.message,
    });
  }
});

/**
 * Comentarios de un partido.
 * GET /api/football/fixture/:fixtureId/comments
 */
router.get('/api/football/fixture/:fixtureId/comments', async (req, res) => {
  try {
    const fixtureId = String(req.params.fixtureId || '').trim();

    if (!/^\d+$/.test(fixtureId)) {
      return res.status(400).json({ ok: false, error: 'ID de partido no válido' });
    }

    const { data, error } = await supabase
      .from('match_comments')
      .select('id,fixture_id,nickname,message,created_at,is_reported')
      .eq('fixture_id', Number(fixtureId))
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;

    return res.json({
      ok: true,
      fixtureId: Number(fixtureId),
      count: Array.isArray(data) ? data.length : 0,
      comments: Array.isArray(data) ? data : [],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error cargando comentarios del partido:', error);
    return res.status(500).json({
      ok: false,
      error: 'No se pudieron cargar los comentarios',
      detail: error.message,
    });
  }
});

/**
 * Publica un comentario.
 * POST /api/football/fixture/:fixtureId/comments
 */
router.post('/api/football/fixture/:fixtureId/comments', async (req, res) => {
  try {
    const fixtureId = String(req.params.fixtureId || '').trim();

    if (!/^\d+$/.test(fixtureId)) {
      return res.status(400).json({ ok: false, error: 'ID de partido no válido' });
    }

    const nickname = String(req.body?.nickname || '').trim();
    const message = String(req.body?.message || '').trim();
    const deviceId = String(req.body?.deviceId || '').trim();

    if (nickname.length < 2 || nickname.length > 30) {
      return res.status(400).json({
        ok: false,
        error: 'El nick debe tener entre 2 y 30 caracteres',
      });
    }

    if (!message || message.length > 300) {
      return res.status(400).json({
        ok: false,
        error: 'El comentario debe tener entre 1 y 300 caracteres',
      });
    }

    if (deviceId.length < 8 || deviceId.length > 120) {
      return res.status(400).json({
        ok: false,
        error: 'Identificador del dispositivo no válido',
      });
    }

    const threeSecondsAgo = new Date(Date.now() - 3000).toISOString();

    const { data: recentComments, error: recentError } = await supabase
      .from('match_comments')
      .select('id')
      .eq('fixture_id', Number(fixtureId))
      .eq('device_id', deviceId)
      .gte('created_at', threeSecondsAgo)
      .limit(1);

    if (recentError) throw recentError;

    if (Array.isArray(recentComments) && recentComments.length > 0) {
      return res.status(429).json({
        ok: false,
        error: 'Espera unos segundos antes de volver a comentar',
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('match_comments')
      .insert({
        fixture_id: Number(fixtureId),
        nickname,
        message,
        device_id: deviceId,
      })
      .select('id,fixture_id,nickname,message,created_at,is_reported')
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      ok: true,
      comment: inserted,
    });
  } catch (error) {
    console.error('Error publicando comentario:', error);
    return res.status(500).json({
      ok: false,
      error: 'No se pudo publicar el comentario',
      detail: error.message,
    });
  }
});

/**
 * Reporta un comentario.
 * POST /api/football/comments/:commentId/report
 */
router.post('/api/football/comments/:commentId/report', async (req, res) => {
  try {
    const commentId = String(req.params.commentId || '').trim();

    if (!/^\d+$/.test(commentId)) {
      return res.status(400).json({
        ok: false,
        error: 'ID de comentario no válido',
      });
    }

    const { error } = await supabase.rpc('report_match_comment', {
      comment_id: Number(commentId),
    });

    if (error) throw error;

    return res.json({
      ok: true,
      message: 'Comentario reportado',
    });
  } catch (error) {
    console.error('Error reportando comentario:', error);
    return res.status(500).json({
      ok: false,
      error: 'No se pudo reportar el comentario',
      detail: error.message,
    });
  }
});

/**
 * Sirve los escudos de API-Football a través de nuestro backend.
 *
 * Ejemplo:
 * GET /api/football/team-logo/9585
 */
router.get('/api/football/team-logo/:teamId', async (req, res) => {
  try {
    const teamId = String(req.params.teamId || '').trim();

    if (!/^\d+$/.test(teamId)) {
      return res.status(400).json({
        ok: false,
        error: 'ID de equipo no válido',
      });
    }

    const logoUrl =
      `https://media.api-sports.io/football/teams/${teamId}.png`;

    const response = await fetch(logoUrl);

    if (!response.ok) {
      throw new Error(
        `No se pudo descargar el escudo: ${response.status}`
      );
    }

    const imageBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Cache-Control',
      'public, max-age=604800, immutable'
    );

    return res.send(imageBuffer);
  } catch (error) {
    console.error('Error sirviendo escudo:', error);

    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

module.exports = router;