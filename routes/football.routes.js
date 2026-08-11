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

const API_BASE_URL = process.env.API_FOOTBALL_BASE_URL;
const API_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = process.env.FOOTBALL_LEAGUE_ID;
const SEASON = process.env.FOOTBALL_SEASON;
const TIMEZONE =
  process.env.FOOTBALL_TIMEZONE || 'Europe/Madrid';

/**
 * Realiza peticiones a API-Football.
 */
const footballFetch = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
};

/**
 * Comprueba que API-Football está conectada.
 */
router.get('/api/football/test', async (req, res) => {
  try {
    const data = await footballFetch('/status');

    res.json({
      ok: true,
      message: 'API-Football conectada correctamente',
      account: data.response?.account || null,
      requests: data.response?.requests || null,
    });
  } catch (error) {
    console.error('Error comprobando API-Football:', error);

    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Sincroniza la clasificación.
 */
router.post('/api/football/sync-standings', async (req, res) => {
  try {
    const data = await footballFetch(
      `/standings?league=${LEAGUE_ID}&season=${SEASON}`
    );

    const standings =
      data.response?.[0]?.league?.standings?.[0] || [];

    const rows = standings.map((item) => ({
      position: item.rank,

      team: getDisplayTeamName(item.team.name),

      logo: getTeamLogo(
        item.team.name,
        item.team.logo
      ),

      points: item.points,
      playedgames: item.all.played,
      won: item.all.win,
      draw: item.all.draw,
      lost: item.all.lose,
    }));

    const { error: deleteError } = await supabase
      .from('standings')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      throw deleteError;
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('standings')
        .insert(rows);

      if (insertError) {
        throw insertError;
      }
    }

    res.json({
      ok: true,
      inserted: rows.length,
      season: SEASON,
      league: LEAGUE_ID,
    });
  } catch (error) {
    console.error('Error sincronizando clasificación:', error);

    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

/**
 * Sincroniza el calendario completo.
 */
router.post('/api/football/sync-calendar', async (req, res) => {
  try {
    const data = await footballFetch(
      `/fixtures?league=${LEAGUE_ID}&season=${SEASON}&timezone=${TIMEZONE}`
    );

    const fixtures = data.response || [];

    const rows = fixtures.map((match) => {
      const homeApiName = match.teams.home.name;
      const awayApiName = match.teams.away.name;

      return {
        fixtureId: match.fixture.id,
        homeTeamId: match.teams.home.id,
        awayTeamId: match.teams.away.id,

        date: match.fixture.date,
        status: match.fixture.status.short,

        league: getCompetitionName(
          match.league.name
        ),

        round: match.league.round,

        venue: getCorrectVenue(
          homeApiName,
          match.fixture.venue?.name
        ),

        homeTeam: getDisplayTeamName(
          homeApiName
        ),

        awayTeam: getDisplayTeamName(
          awayApiName
        ),

        homeLogo: getTeamLogo(
          homeApiName,
          match.teams.home.logo
        ),

        awayLogo: getTeamLogo(
          awayApiName,
          match.teams.away.logo
        ),

        homeGoals:
          match.goals.home === null
            ? ''
            : String(match.goals.home),

        awayGoals:
          match.goals.away === null
            ? ''
            : String(match.goals.away),
      };
    });

    const { error: deleteError } = await supabase
      .from('calendar')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      throw deleteError;
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('calendar')
        .insert(rows);

      if (insertError) {
        throw insertError;
      }
    }

    res.json({
      ok: true,
      inserted: rows.length,
      season: SEASON,
      league: LEAGUE_ID,
    });
  } catch (error) {
    console.error('Error sincronizando calendario:', error);

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
router.get('/api/football/live', async (req, res) => {
  try {
    if (!LEAGUE_ID) {
      return res.status(500).json({
        ok: false,
        error: 'FOOTBALL_LEAGUE_ID no está configurado',
      });
    }

    const data = await footballFetch(
      `/fixtures?live=${encodeURIComponent(LEAGUE_ID)}&timezone=${encodeURIComponent(TIMEZONE)}`
    );

    const fixtures = Array.isArray(data.response) ? data.response : [];

    const matches = fixtures.map((match) => {
      const homeApiName = match.teams?.home?.name || '';
      const awayApiName = match.teams?.away?.name || '';

      return {
        fixtureId: match.fixture?.id ?? null,
        date: match.fixture?.date || null,
        timestamp: match.fixture?.timestamp ?? null,
        status: {
          short: match.fixture?.status?.short || '',
          long: match.fixture?.status?.long || '',
          elapsed: match.fixture?.status?.elapsed ?? null,
          extra: match.fixture?.status?.extra ?? null,
        },
        league: {
          id: match.league?.id ?? null,
          name: getCompetitionName(match.league?.name || ''),
          round: match.league?.round || '',
          logo: match.league?.logo || '',
        },
        venue: {
          id: match.fixture?.venue?.id ?? null,
          name: getCorrectVenue(homeApiName, match.fixture?.venue?.name || ''),
          city: match.fixture?.venue?.city || '',
        },
        referee: match.fixture?.referee || '',
        home: {
          id: match.teams?.home?.id ?? null,
          name: getDisplayTeamName(homeApiName),
          shortName: getShortTeamName(homeApiName),
          logo: getTeamLogo(homeApiName, match.teams?.home?.logo || ''),
          winner: match.teams?.home?.winner ?? null,
          isCastellon: isCastellon(homeApiName),
        },
        away: {
          id: match.teams?.away?.id ?? null,
          name: getDisplayTeamName(awayApiName),
          shortName: getShortTeamName(awayApiName),
          logo: getTeamLogo(awayApiName, match.teams?.away?.logo || ''),
          winner: match.teams?.away?.winner ?? null,
          isCastellon: isCastellon(awayApiName),
        },
        goals: {
          home: match.goals?.home ?? null,
          away: match.goals?.away ?? null,
        },
        score: {
          halftime: {
            home: match.score?.halftime?.home ?? null,
            away: match.score?.halftime?.away ?? null,
          },
          fulltime: {
            home: match.score?.fulltime?.home ?? null,
            away: match.score?.fulltime?.away ?? null,
          },
          extratime: {
            home: match.score?.extratime?.home ?? null,
            away: match.score?.extratime?.away ?? null,
          },
          penalty: {
            home: match.score?.penalty?.home ?? null,
            away: match.score?.penalty?.away ?? null,
          },
        },
      };
    });

    return res.json({
      ok: true,
      live: true,
      league: Number(LEAGUE_ID),
      season: SEASON || null,
      timezone: TIMEZONE,
      count: matches.length,
      updatedAt: new Date().toISOString(),
      matches,
    });
  } catch (error) {
    console.error('Error cargando resultados en directo:', error);

    return res.status(500).json({
      ok: false,
      error: 'No se pudieron cargar los resultados en directo',
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
router.get('/api/football/fixture/:fixtureId/details', async (req, res) => {
  try {
    const fixtureId = String(req.params.fixtureId || '').trim();

    if (!/^\d+$/.test(fixtureId)) {
      return res.status(400).json({
        ok: false,
        error: 'ID de partido no válido',
      });
    }

    const safeFootballFetch = async (endpoint) => {
      try {
        return await footballFetch(endpoint);
      } catch (error) {
        console.warn(
          `API-Football no devolvió datos para ${endpoint}:`,
          error.message
        );

        return {
          response: [],
        };
      }
    };

    const [
      fixtureData,
      eventsData,
      lineupsData,
      statisticsData,
    ] = await Promise.all([
      footballFetch(
        `/fixtures?id=${encodeURIComponent(fixtureId)}&timezone=${encodeURIComponent(TIMEZONE)}`
      ),
      safeFootballFetch(
        `/fixtures/events?fixture=${encodeURIComponent(fixtureId)}`
      ),
      safeFootballFetch(
        `/fixtures/lineups?fixture=${encodeURIComponent(fixtureId)}`
      ),
      safeFootballFetch(
        `/fixtures/statistics?fixture=${encodeURIComponent(fixtureId)}`
      ),
    ]);

    const match = fixtureData.response?.[0];

    if (!match) {
      return res.status(404).json({
        ok: false,
        error: 'Partido no encontrado',
      });
    }

    const homeApiName = match.teams?.home?.name || '';
    const awayApiName = match.teams?.away?.name || '';

    const normalizeTeam = (team, apiName) => ({
      id: team?.id ?? null,
      name: getDisplayTeamName(apiName),
      shortName: getShortTeamName(apiName),
      logo: getTeamLogo(apiName, team?.logo || ''),
      winner: team?.winner ?? null,
      isCastellon: isCastellon(apiName),
    });

    const events = Array.isArray(eventsData.response)
      ? eventsData.response.map((event) => ({
          time: {
            elapsed: event.time?.elapsed ?? null,
            extra: event.time?.extra ?? null,
          },
          team: {
            id: event.team?.id ?? null,
            name: getDisplayTeamName(event.team?.name || ''),
            logo: getTeamLogo(
              event.team?.name || '',
              event.team?.logo || ''
            ),
          },
          player: {
            id: event.player?.id ?? null,
            name: event.player?.name || '',
          },
          assist: {
            id: event.assist?.id ?? null,
            name: event.assist?.name || '',
          },
          type: event.type || '',
          detail: event.detail || '',
          comments: event.comments || '',
        }))
      : [];

    const lineups = Array.isArray(lineupsData.response)
      ? lineupsData.response.map((lineup) => ({
          team: {
            id: lineup.team?.id ?? null,
            name: getDisplayTeamName(lineup.team?.name || ''),
            logo: getTeamLogo(
              lineup.team?.name || '',
              lineup.team?.logo || ''
            ),
          },
          coach: {
            id: lineup.coach?.id ?? null,
            name: lineup.coach?.name || '',
            photo: lineup.coach?.photo || '',
          },
          formation: lineup.formation || '',
          startXI: Array.isArray(lineup.startXI)
            ? lineup.startXI.map((entry) => ({
                id: entry.player?.id ?? null,
                name: entry.player?.name || '',
                number: entry.player?.number ?? null,
                position: entry.player?.pos || '',
                grid: entry.player?.grid || '',
              }))
            : [],
          substitutes: Array.isArray(lineup.substitutes)
            ? lineup.substitutes.map((entry) => ({
                id: entry.player?.id ?? null,
                name: entry.player?.name || '',
                number: entry.player?.number ?? null,
                position: entry.player?.pos || '',
                grid: entry.player?.grid || '',
              }))
            : [],
        }))
      : [];

    const statistics = Array.isArray(statisticsData.response)
      ? statisticsData.response.map((item) => ({
          team: {
            id: item.team?.id ?? null,
            name: getDisplayTeamName(item.team?.name || ''),
            logo: getTeamLogo(
              item.team?.name || '',
              item.team?.logo || ''
            ),
          },
          statistics: Array.isArray(item.statistics)
            ? item.statistics.map((stat) => ({
                type: stat.type || '',
                value: stat.value ?? null,
              }))
            : [],
        }))
      : [];

    return res.json({
      ok: true,
      updatedAt: new Date().toISOString(),

      fixture: {
        id: match.fixture?.id ?? Number(fixtureId),
        date: match.fixture?.date || null,
        timestamp: match.fixture?.timestamp ?? null,
        referee: match.fixture?.referee || '',
        timezone: match.fixture?.timezone || TIMEZONE,

        status: {
          short: match.fixture?.status?.short || '',
          long: match.fixture?.status?.long || '',
          elapsed: match.fixture?.status?.elapsed ?? null,
          extra: match.fixture?.status?.extra ?? null,
        },

        venue: {
          id: match.fixture?.venue?.id ?? null,
          name: getCorrectVenue(
            homeApiName,
            match.fixture?.venue?.name || ''
          ),
          city: match.fixture?.venue?.city || '',
        },
      },

      league: {
        id: match.league?.id ?? null,
        name: getCompetitionName(match.league?.name || ''),
        round: match.league?.round || '',
        logo: match.league?.logo || '',
      },

      home: normalizeTeam(match.teams?.home, homeApiName),
      away: normalizeTeam(match.teams?.away, awayApiName),

      goals: {
        home: match.goals?.home ?? null,
        away: match.goals?.away ?? null,
      },

      score: {
        halftime: {
          home: match.score?.halftime?.home ?? null,
          away: match.score?.halftime?.away ?? null,
        },
        fulltime: {
          home: match.score?.fulltime?.home ?? null,
          away: match.score?.fulltime?.away ?? null,
        },
        extratime: {
          home: match.score?.extratime?.home ?? null,
          away: match.score?.extratime?.away ?? null,
        },
        penalty: {
          home: match.score?.penalty?.home ?? null,
          away: match.score?.penalty?.away ?? null,
        },
      },

      events,
      lineups,
      statistics,
    });
  } catch (error) {
    console.error('Error cargando detalle del partido:', error);

    return res.status(500).json({
      ok: false,
      error: 'No se pudo cargar el detalle del partido',
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