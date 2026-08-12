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
      teamId: item.team.id,
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

router.get('/api/football/team/:teamId/details', async (req, res) => {
  try {
    const teamId = String(req.params.teamId || '').trim();

    if (!/^\d+$/.test(teamId)) {
      return res.status(400).json({
        ok: false,
        error: 'ID de equipo no válido',
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
      teamData,
      squadData,
      coachData,
      statisticsData,
    ] = await Promise.all([
      footballFetch(
        `/teams?id=${encodeURIComponent(teamId)}`
      ),
      safeFootballFetch(
        `/players/squads?team=${encodeURIComponent(teamId)}`
      ),
      safeFootballFetch(
        `/coachs?team=${encodeURIComponent(teamId)}`
      ),
      LEAGUE_ID && SEASON
        ? safeFootballFetch(
            `/teams/statistics?league=${encodeURIComponent(LEAGUE_ID)}&season=${encodeURIComponent(SEASON)}&team=${encodeURIComponent(teamId)}`
          )
        : Promise.resolve({ response: [] }),
    ]);

    const teamEntry = teamData.response?.[0];

    if (!teamEntry?.team) {
      return res.status(404).json({
        ok: false,
        error: 'Equipo no encontrado',
      });
    }

    const apiTeamName = teamEntry.team.name || '';
    const team = teamEntry.team;
    const venue = teamEntry.venue || {};

    const squadEntry = Array.isArray(squadData.response)
      ? squadData.response[0]
      : null;

    let squad = Array.isArray(squadEntry?.players)
      ? squadEntry.players.map((player) => ({
          id: player.id ?? null,
          name: player.name || '',
          age: player.age ?? null,
          number: player.number ?? null,
          position: player.position || '',
          photo: player.photo || '',
        }))
      : [];

    // Para el C.D. Castellón usamos nuestra plantilla curada en Supabase.
    // El resto de equipos continúa usando API-Football sin cambios.
    if (Number(teamId) === 5254) {
      const { data: castellonSquad, error: castellonSquadError } = await supabase
        .from('castellon_squad')
        .select('id,player_id,name,age,number,position,photo,active')
        .eq('active', true)
        .order('position', { ascending: true })
        .order('name', { ascending: true });

      if (castellonSquadError) {
        throw castellonSquadError;
      }

      squad = Array.isArray(castellonSquad)
        ? castellonSquad.map((player) => ({
            // Si API-Football todavía no tiene player_id (p. ej. un fichaje),
            // usamos un identificador local estable para poder abrir su ficha.
            id:
              player.player_id !== null && player.player_id !== undefined
                ? player.player_id
                : `local-${player.id}`,
            name: player.name || '',
            age: player.age ?? null,
            number: player.number ?? null,
            position: player.position || '',
            photo: player.photo || '',
          }))
        : [];
    }

    const coaches = Array.isArray(coachData.response)
      ? coachData.response.map((coach) => ({
          id: coach.id ?? null,
          name: coach.name || '',
          firstname: coach.firstname || '',
          lastname: coach.lastname || '',
          age: coach.age ?? null,
          birth: {
            date: coach.birth?.date || null,
            place: coach.birth?.place || '',
            country: coach.birth?.country || '',
          },
          nationality: coach.nationality || '',
          height: coach.height || '',
          weight: coach.weight || '',
          photo: coach.photo || '',
          career: Array.isArray(coach.career)
            ? coach.career.map((item) => ({
                team: {
                  id: item.team?.id ?? null,
                  name: item.team?.name || '',
                  logo: item.team?.logo || '',
                },
                start: item.start || null,
                end: item.end || null,
              }))
            : [],
        }))
      : [];

    // Para el C.D. Castellón, los datos propios de castellon_team
    // tienen prioridad sobre API-Football (entrenador, estadio, etc.).
    let customCastellonTeam = null;

    if (Number(teamId) === 5254) {
      const { data: customTeamRows, error: customTeamError } = await supabase
        .from('castellon_team')
        .select(
          'team_id,name,founded,country,coach_name,coach_photo,stadium_name,stadium_city,stadium_capacity,stadium_surface,stadium_image'
        )
        .eq('team_id', 5254)
        .limit(1);

      if (customTeamError) {
        throw customTeamError;
      }

      customCastellonTeam =
        Array.isArray(customTeamRows) && customTeamRows.length > 0
          ? customTeamRows[0]
          : null;
    }

    const apiCoach = coaches[0] || null;

    const resolvedCoach =
      customCastellonTeam?.coach_name
        ? {
            ...(apiCoach || {}),
            // El nombre de Supabase manda para evitar entrenadores desactualizados
            // en API-Football.
            name: customCastellonTeam.coach_name,
            firstname: '',
            lastname: '',
            photo:
              customCastellonTeam.coach_photo ||
              apiCoach?.photo ||
              '',
          }
        : apiCoach;

    const resolvedCoaches =
      resolvedCoach
        ? [
            resolvedCoach,
            ...coaches.filter(
              (coach) =>
                String(coach?.name || '').trim().toLowerCase() !==
                String(resolvedCoach?.name || '').trim().toLowerCase()
            ),
          ]
        : coaches;

    const teamStats =
      statisticsData &&
      statisticsData.response &&
      !Array.isArray(statisticsData.response)
        ? statisticsData.response
        : null;

    const normalizeFixtures = (fixtures) => ({
      played: {
        home: fixtures?.played?.home ?? 0,
        away: fixtures?.played?.away ?? 0,
        total: fixtures?.played?.total ?? 0,
      },
      wins: {
        home: fixtures?.wins?.home ?? 0,
        away: fixtures?.wins?.away ?? 0,
        total: fixtures?.wins?.total ?? 0,
      },
      draws: {
        home: fixtures?.draws?.home ?? 0,
        away: fixtures?.draws?.away ?? 0,
        total: fixtures?.draws?.total ?? 0,
      },
      loses: {
        home: fixtures?.loses?.home ?? 0,
        away: fixtures?.loses?.away ?? 0,
        total: fixtures?.loses?.total ?? 0,
      },
    });

    return res.json({
      ok: true,
      updatedAt: new Date().toISOString(),

      team: {
        id: team.id ?? Number(teamId),
        name:
          customCastellonTeam?.name ||
          getDisplayTeamName(apiTeamName),
        shortName: getShortTeamName(
          customCastellonTeam?.name || apiTeamName
        ),
        code: team.code || '',
        country:
          customCastellonTeam?.country ||
          team.country ||
          '',
        founded:
          customCastellonTeam?.founded ??
          team.founded ??
          null,
        national: team.national ?? false,
        logo: getTeamLogo(apiTeamName, team.logo || ''),
        isCastellon: isCastellon(apiTeamName),
      },

      venue: {
        id: venue.id ?? null,
        name:
          customCastellonTeam?.stadium_name ||
          getCorrectVenue(apiTeamName, venue.name || ''),
        address: venue.address || '',
        city:
          customCastellonTeam?.stadium_city ||
          venue.city ||
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
          venue.image ||
          '',
      },

      coach: resolvedCoach,
      coaches: resolvedCoaches,
      squad,

      season: {
        leagueId: LEAGUE_ID ? Number(LEAGUE_ID) : null,
        season: SEASON || null,

        form: teamStats?.form || '',

        fixtures: normalizeFixtures(teamStats?.fixtures),

        goals: {
          for: {
            total: {
              home: teamStats?.goals?.for?.total?.home ?? 0,
              away: teamStats?.goals?.for?.total?.away ?? 0,
              total: teamStats?.goals?.for?.total?.total ?? 0,
            },
            average: {
              home: teamStats?.goals?.for?.average?.home ?? null,
              away: teamStats?.goals?.for?.average?.away ?? null,
              total: teamStats?.goals?.for?.average?.total ?? null,
            },
          },
          against: {
            total: {
              home: teamStats?.goals?.against?.total?.home ?? 0,
              away: teamStats?.goals?.against?.total?.away ?? 0,
              total: teamStats?.goals?.against?.total?.total ?? 0,
            },
            average: {
              home: teamStats?.goals?.against?.average?.home ?? null,
              away: teamStats?.goals?.against?.average?.away ?? null,
              total: teamStats?.goals?.against?.average?.total ?? null,
            },
          },
        },

        biggest: {
          streak: {
            wins: teamStats?.biggest?.streak?.wins ?? 0,
            draws: teamStats?.biggest?.streak?.draws ?? 0,
            loses: teamStats?.biggest?.streak?.loses ?? 0,
          },
          wins: {
            home: teamStats?.biggest?.wins?.home || null,
            away: teamStats?.biggest?.wins?.away || null,
          },
          loses: {
            home: teamStats?.biggest?.loses?.home || null,
            away: teamStats?.biggest?.loses?.away || null,
          },
        },

        cleanSheet: {
          home: teamStats?.clean_sheet?.home ?? 0,
          away: teamStats?.clean_sheet?.away ?? 0,
          total: teamStats?.clean_sheet?.total ?? 0,
        },

        failedToScore: {
          home: teamStats?.failed_to_score?.home ?? 0,
          away: teamStats?.failed_to_score?.away ?? 0,
          total: teamStats?.failed_to_score?.total ?? 0,
        },

        lineups: Array.isArray(teamStats?.lineups)
          ? teamStats.lineups.map((lineup) => ({
              formation: lineup.formation || '',
              played: lineup.played ?? 0,
            }))
          : [],
      },
    });
  } catch (error) {
    console.error('Error cargando ficha del equipo:', error);

    return res.status(500).json({
      ok: false,
      error: 'No se pudo cargar la ficha del equipo',
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

    const isNumericPlayerId = /^\d+$/.test(playerId);
    const localMatch = playerId.match(/^local-(\d+)$/);
    const isLocalPlayerId = Boolean(localMatch);

    if (!isNumericPlayerId && !isLocalPlayerId) {
      return res.status(400).json({
        ok: false,
        error: 'ID de jugador no válido',
      });
    }

    if (!SEASON) {
      return res.status(500).json({
        ok: false,
        error: 'FOOTBALL_SEASON no está configurado',
      });
    }

    const CASTELLON_TEAM_ID = 5254;
    const isCastellonRequest =
      String(requestedTeamId) === String(CASTELLON_TEAM_ID) ||
      isLocalPlayerId;

    // ---------------------------------------------------------
    // DATOS PROPIOS DEL C.D. CASTELLÓN
    // ---------------------------------------------------------
    // Si el jugador pertenece a nuestra plantilla curada,
    // Supabase tiene prioridad para identidad, foto y datos personales.
    let customPlayer = null;

    if (isCastellonRequest) {
      let customQuery = supabase
        .from('castellon_squad')
        .select(
          'id,player_id,name,firstname,lastname,number,position,age,birth_date,birth_place,birth_country,nationality,height,photo,active'
        )
        .eq('active', true);

      if (isLocalPlayerId) {
        customQuery = customQuery.eq('id', Number(localMatch[1]));
      } else {
        customQuery = customQuery.eq('player_id', Number(playerId));
      }

      const { data: customRows, error: customError } = await customQuery.limit(1);

      if (customError) {
        throw customError;
      }

      customPlayer =
        Array.isArray(customRows) && customRows.length > 0
          ? customRows[0]
          : null;
    }

    // ---------------------------------------------------------
    // API-FOOTBALL: perfil + estadísticas
    // ---------------------------------------------------------
    let player = null;
    let rawStatistics = [];

    // Los jugadores locales todavía no existen en API-Football,
    // por lo que no hacemos una petición con un ID inventado.
    if (isNumericPlayerId) {
      try {
        const seasonData = await footballFetch(
          `/players?id=${encodeURIComponent(playerId)}&season=${encodeURIComponent(SEASON)}`
        );

        const entry = Array.isArray(seasonData.response)
          ? seasonData.response[0]
          : null;

        player = entry?.player || null;
        rawStatistics = Array.isArray(entry?.statistics)
          ? entry.statistics
          : [];
      } catch (error) {
        console.warn(
          'API-Football no devolvió ficha estadística del jugador:',
          error.message
        );
      }
    }

    // Al inicio de temporada puede existir en /players/squads
    // pero todavía no en /players?season=....
    let squadPlayer = null;
    let squadTeam = null;

    if (
      isNumericPlayerId &&
      !player &&
      /^\d+$/.test(requestedTeamId)
    ) {
      try {
        const squadData = await footballFetch(
          `/players/squads?team=${encodeURIComponent(requestedTeamId)}`
        );

        const squadEntry = Array.isArray(squadData.response)
          ? squadData.response[0]
          : null;

        squadTeam = squadEntry?.team || null;

        squadPlayer = Array.isArray(squadEntry?.players)
          ? squadEntry.players.find(
              (item) => String(item.id) === String(playerId)
            )
          : null;
      } catch (error) {
        console.warn(
          'No se pudo usar la plantilla API como fallback del jugador:',
          error.message
        );
      }
    }

    if (!customPlayer && !player && !squadPlayer) {
      return res.status(404).json({
        ok: false,
        error: 'Jugador no encontrado',
        hint:
          'Si todavía no tiene estadísticas de la temporada, envía también ?teamId=ID_DEL_EQUIPO',
      });
    }

    const normalizeStatistics = (statistics) =>
      statistics.map((stat) => {
        const teamApiName = stat.team?.name || '';

        return {
          team: {
            id: stat.team?.id ?? null,
            name: getDisplayTeamName(teamApiName),
            shortName: getShortTeamName(teamApiName),
            logo: getTeamLogo(teamApiName, stat.team?.logo || ''),
            isCastellon: isCastellon(teamApiName),
          },
          league: {
            id: stat.league?.id ?? null,
            name: getCompetitionName(stat.league?.name || ''),
            country: stat.league?.country || '',
            logo: stat.league?.logo || '',
            flag: stat.league?.flag || '',
            season: stat.league?.season ?? SEASON,
          },
          games: {
            appearances: stat.games?.appearences ?? 0,
            lineups: stat.games?.lineups ?? 0,
            minutes: stat.games?.minutes ?? 0,
            number: stat.games?.number ?? null,
            position: stat.games?.position || '',
            rating: stat.games?.rating || null,
            captain: stat.games?.captain ?? false,
          },
          substitutes: {
            in: stat.substitutes?.in ?? 0,
            out: stat.substitutes?.out ?? 0,
            bench: stat.substitutes?.bench ?? 0,
          },
          shots: {
            total: stat.shots?.total ?? 0,
            on: stat.shots?.on ?? 0,
          },
          goals: {
            total: stat.goals?.total ?? 0,
            conceded: stat.goals?.conceded ?? 0,
            assists: stat.goals?.assists ?? 0,
            saves: stat.goals?.saves ?? 0,
          },
          passes: {
            total: stat.passes?.total ?? 0,
            key: stat.passes?.key ?? 0,
            accuracy: stat.passes?.accuracy ?? null,
          },
          tackles: {
            total: stat.tackles?.total ?? 0,
            blocks: stat.tackles?.blocks ?? 0,
            interceptions: stat.tackles?.interceptions ?? 0,
          },
          duels: {
            total: stat.duels?.total ?? 0,
            won: stat.duels?.won ?? 0,
          },
          dribbles: {
            attempts: stat.dribbles?.attempts ?? 0,
            success: stat.dribbles?.success ?? 0,
            past: stat.dribbles?.past ?? 0,
          },
          fouls: {
            drawn: stat.fouls?.drawn ?? 0,
            committed: stat.fouls?.committed ?? 0,
          },
          cards: {
            yellow: stat.cards?.yellow ?? 0,
            yellowRed: stat.cards?.yellowred ?? 0,
            red: stat.cards?.red ?? 0,
          },
          penalty: {
            won: stat.penalty?.won ?? 0,
            committed: stat.penalty?.commited ?? 0,
            scored: stat.penalty?.scored ?? 0,
            missed: stat.penalty?.missed ?? 0,
            saved: stat.penalty?.saved ?? 0,
          },
        };
      });

    const statistics = normalizeStatistics(rawStatistics);

    const preferredStatistics =
      statistics.find((stat) =>
        LEAGUE_ID
          ? String(stat.league.id) === String(LEAGUE_ID)
          : false
      ) ||
      statistics[0] ||
      null;

    const fallbackTeamName = squadTeam?.name || '';
    const fallbackTeam = squadTeam
      ? {
          id: squadTeam.id ?? Number(requestedTeamId),
          name: getDisplayTeamName(fallbackTeamName),
          shortName: getShortTeamName(fallbackTeamName),
          logo: getTeamLogo(fallbackTeamName, squadTeam.logo || ''),
          isCastellon: isCastellon(fallbackTeamName),
        }
      : null;

    const castellonTeam = {
      id: CASTELLON_TEAM_ID,
      name: getDisplayTeamName('CD Castellón'),
      shortName: getShortTeamName('CD Castellón'),
      logo: getTeamLogo('CD Castellón', ''),
      isCastellon: true,
    };

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

    const apiBasePlayer = player
      ? {
          id: player.id ?? (isNumericPlayerId ? Number(playerId) : playerId),
          name: player.name || '',
          firstname: player.firstname || '',
          lastname: player.lastname || '',
          age: player.age ?? null,
          birth: {
            date: player.birth?.date || null,
            place: player.birth?.place || '',
            country: player.birth?.country || '',
          },
          nationality: player.nationality || '',
          height: player.height || '',
          injured: player.injured ?? false,
          photo: player.photo || '',
          number: preferredStatistics?.games?.number ?? null,
          position: preferredStatistics?.games?.position || '',
        }
      : squadPlayer
        ? {
            id: squadPlayer.id ?? (isNumericPlayerId ? Number(playerId) : playerId),
            name: squadPlayer.name || '',
            firstname: '',
            lastname: '',
            age: squadPlayer.age ?? null,
            birth: {
              date: null,
              place: '',
              country: '',
            },
            nationality: '',
            height: '',
            injured: false,
            photo: squadPlayer.photo || '',
            number: squadPlayer.number ?? null,
            position: squadPlayer.position || '',
          }
        : {
            id: playerId,
            name: '',
            firstname: '',
            lastname: '',
            age: null,
            birth: {
              date: null,
              place: '',
              country: '',
            },
            nationality: '',
            height: '',
            injured: false,
            photo: '',
            number: null,
            position: '',
          };

    // Supabase manda únicamente cuando tenemos un dato propio.
    const mergedPlayer = customPlayer
      ? {
          ...apiBasePlayer,
          id:
            customPlayer.player_id !== null &&
            customPlayer.player_id !== undefined
              ? customPlayer.player_id
              : `local-${customPlayer.id}`,
          name: customPlayer.name || apiBasePlayer.name,
          firstname: customPlayer.firstname || apiBasePlayer.firstname,
          lastname: customPlayer.lastname || apiBasePlayer.lastname,
          age:
            calculateAge(customPlayer.birth_date) ??
            customPlayer.age ??
            apiBasePlayer.age,
          birth: {
            date:
              customPlayer.birth_date ||
              apiBasePlayer.birth.date ||
              null,
            place:
              customPlayer.birth_place ||
              apiBasePlayer.birth.place ||
              '',
            country:
              customPlayer.birth_country ||
              apiBasePlayer.birth.country ||
              '',
          },
          nationality:
            customPlayer.nationality ||
            apiBasePlayer.nationality ||
            '',
          height:
            customPlayer.height ||
            apiBasePlayer.height ||
            '',
          photo:
            customPlayer.photo ||
            apiBasePlayer.photo ||
            '',
          number:
            customPlayer.number ??
            apiBasePlayer.number ??
            null,
          position:
            customPlayer.position ||
            apiBasePlayer.position ||
            '',
        }
      : apiBasePlayer;

    return res.json({
      ok: true,
      updatedAt: new Date().toISOString(),
      profileSource: customPlayer
        ? 'castellon_squad'
        : player
          ? 'season'
          : 'squad',
      statisticsAvailable: statistics.length > 0,

      player: mergedPlayer,

      team:
        customPlayer
          ? castellonTeam
          : preferredStatistics?.team || fallbackTeam,

      season: SEASON,
      preferredStatistics,
      statistics,
    });
  } catch (error) {
    console.error('Error cargando ficha del jugador:', error);

    return res.status(500).json({
      ok: false,
      error: 'No se pudo cargar la ficha del jugador',
      detail: error.message,
    });
  }
});


/**
 * Importa a Supabase la plantilla actual del C.D. Castellón desde API-Football.
 *
 * IMPORTANTE:
 * - Solo inserta jugadores que todavía no existen en castellon_squad.
 * - No sobrescribe correcciones manuales ya realizadas en Supabase.
 * - No reactiva automáticamente jugadores marcados como active=false.
 *
 * POST /api/football/sync-castellon-squad
 */
router.post('/api/football/sync-castellon-squad', async (req, res) => {
  try {
    const CASTELLON_TEAM_ID = 5254;

    const squadData = await footballFetch(
      `/players/squads?team=${encodeURIComponent(CASTELLON_TEAM_ID)}`
    );

    const squadEntry = Array.isArray(squadData.response)
      ? squadData.response[0]
      : null;

    const apiPlayers = Array.isArray(squadEntry?.players)
      ? squadEntry.players
      : [];

    if (!apiPlayers.length) {
      return res.status(404).json({
        ok: false,
        error: 'API-Football no ha devuelto jugadores para el C.D. Castellón',
      });
    }

    const { data: existingRows, error: existingError } = await supabase
      .from('castellon_squad')
      .select('player_id, active');

    if (existingError) {
      throw existingError;
    }

    const existingPlayerIds = new Set(
      (existingRows || [])
        .map((row) => row.player_id)
        .filter((id) => id !== null && id !== undefined)
        .map((id) => String(id))
    );

    const rowsToInsert = apiPlayers
      .filter((player) => {
        if (player.id === null || player.id === undefined) {
          return false;
        }

        return !existingPlayerIds.has(String(player.id));
      })
      .map((player) => ({
        player_id: player.id,
        name: player.name || '',
        firstname: null,
        lastname: null,
        number: player.number ?? null,
        position: player.position || null,
        age: player.age ?? null,
        birth_date: null,
        birth_place: null,
        birth_country: null,
        nationality: null,
        height: null,
        weight: null,
        photo: player.photo || null,
        active: true,
      }));

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('castellon_squad')
        .insert(rowsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    return res.json({
      ok: true,
      teamId: CASTELLON_TEAM_ID,
      team: getDisplayTeamName(
        squadEntry?.team?.name || 'CD Castellón'
      ),
      apiCount: apiPlayers.length,
      existingCount: existingPlayerIds.size,
      inserted: rowsToInsert.length,
      skipped: apiPlayers.length - rowsToInsert.length,
      message:
        rowsToInsert.length > 0
          ? 'Plantilla importada. Las correcciones manuales existentes no se han sobrescrito.'
          : 'No había jugadores nuevos que importar.',
      playersInserted: rowsToInsert.map((player) => ({
        playerId: player.player_id,
        name: player.name,
        number: player.number,
        position: player.position,
      })),
    });
  } catch (error) {
    console.error(
      'Error sincronizando plantilla propia del Castellón:',
      error
    );

    return res.status(500).json({
      ok: false,
      error: 'No se pudo importar la plantilla del C.D. Castellón',
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