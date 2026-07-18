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

module.exports = router;