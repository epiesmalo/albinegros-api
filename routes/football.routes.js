const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

const API_BASE_URL = process.env.API_FOOTBALL_BASE_URL;
const API_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = process.env.FOOTBALL_LEAGUE_ID;
const SEASON = process.env.FOOTBALL_SEASON;
const TIMEZONE = process.env.FOOTBALL_TIMEZONE || 'Europe/Madrid';

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
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

router.post('/api/football/sync-standings', async (req, res) => {
  try {
    const data = await footballFetch(
      `/standings?league=${LEAGUE_ID}&season=${SEASON}`
    );

    const standings =
      data.response?.[0]?.league?.standings?.[0] || [];

    const rows = standings.map((item) => ({
      position: item.rank,
      team: item.team.name,
      logo: item.team.logo,
      points: item.points,
      playedgames: item.all.played,
      won: item.all.win,
      draw: item.all.draw,
      lost: item.all.lose,
    }));

    await supabase.from('standings').delete().neq('id', 0);

    const { error } = await supabase.from('standings').insert(rows);

    if (error) throw error;

    res.json({
      ok: true,
      inserted: rows.length,
      season: SEASON,
      league: LEAGUE_ID,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

router.post('/api/football/sync-calendar', async (req, res) => {
  try {
    const data = await footballFetch(
      `/fixtures?league=${LEAGUE_ID}&season=${SEASON}&timezone=${TIMEZONE}`
    );

    const fixtures = data.response || [];

    const rows = fixtures.map((match) => ({
      date: match.fixture.date,
      status: match.fixture.status.short,
      league: match.league.name,
      round: match.league.round,
      venue: match.fixture.venue?.name || '',
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      homeLogo: match.teams.home.logo,
      awayLogo: match.teams.away.logo,
      homeGoals:
        match.goals.home === null ? '' : String(match.goals.home),
      awayGoals:
        match.goals.away === null ? '' : String(match.goals.away),
    }));

    await supabase.from('calendar').delete().neq('id', 0);

    const { error } = await supabase.from('calendar').insert(rows);

    if (error) throw error;

    res.json({
      ok: true,
      inserted: rows.length,
      season: SEASON,
      league: LEAGUE_ID,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

module.exports = router;