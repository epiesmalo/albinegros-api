require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3001;
const aboutPath = path.join(__dirname, 'data', 'about.json');

// CALENDARIO
app.get('/calendar/first-team', async (req, res) => {
  try {
    const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY?.trim(),
      },
      params: {
        league: 141,
        season: 2024,
        team: 5254,
      },
    });

    const fixtures = response.data?.response || [];

    const cleanFixtures = fixtures.map((match) => ({
      id: match.fixture?.id,
      date: match.fixture?.date,
      status: match.fixture?.status?.short || '',
      league: match.league?.name || '',
      round: match.league?.round || '',
      venue: match.fixture?.venue?.name || 'Estadio pendiente',
      homeTeam: match.teams?.home?.name || '',
      awayTeam: match.teams?.away?.name || '',
      homeLogo: match.teams?.home?.logo || '',
      awayLogo: match.teams?.away?.logo || '',
      homeGoals: match.goals?.home,
      awayGoals: match.goals?.away,
    }));

    res.json(cleanFixtures);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener el calendario',
      details: error.response?.data || error.message,
    });
  }
});

// PRÓXIMO PARTIDO - SUPABASE
app.get('/api/admin/next-match', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('next_match')
      .select('*')
      .eq('id', '1')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      teamName: data.teamName,
      opponent: data.opponent,
      date: data.date,
      time: data.time,
      stadium: data.stadium,
      competition: data.competition,
      teamLogo: data.teamlogo,        // 👈 aquí
      opponentLogo: data.opponentLogo // 👈 aquí
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener el próximo partido',
      details: error.message,
    });
  }
});

app.post('/api/admin/next-match', async (req, res) => {
  try {
    const payload = {
      id: '1',
      teamName: req.body.teamName,
      opponent: req.body.opponent,
      date: req.body.date,
      time: req.body.time,
      stadium: req.body.stadium,
      competition: req.body.competition,
      teamlogo: req.body.teamLogo,        // 👈 aquí
      opponentLogo: req.body.opponentLogo // 👈 aquí
    };

    const { error } = await supabase
      .from('next_match')
      .upsert(payload);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo guardar el próximo partido',
      details: error.message,
     });
  }
});

// QUIÉNES SOMOS - DE MOMENTO JSON
app.get('/api/admin/about', (req, res) => {
  const data = JSON.parse(fs.readFileSync(aboutPath, 'utf8'));
  res.json(data);
});

app.post('/api/admin/about', (req, res) => {
  fs.writeFileSync(aboutPath, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

// SPONSORS - SUPABASE
app.get('/api/admin/ads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron obtener los sponsors',
      details: error.message,
    });
  }
});

app.post('/api/admin/ads', async (req, res) => {
  try {
    const ads = req.body;

    if (!Array.isArray(ads)) {
      return res.status(400).json({ error: 'Los sponsors deben ser un array' });
    }

    await supabase.from('ads').delete().neq('id', '');

    const { error } = await supabase.from('ads').insert(ads);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron guardar los sponsors',
      details: error.message,
    });
  }
});

// CLASIFICACIÓN - SUPABASE
app.get('/api/admin/standings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('standings')
      .select('*')
      .order('position', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const cleanData = (data || []).map((team) => ({
      id: team.id,
      position: team.position,
      team: team.team,
      logo: team.logo,
      points: team.points,
      playedgames: team.playedgames,
      playedGames: team.playedgames,
      won: team.won,
      draw: team.draw,
      lost: team.lost,
    }));

    res.json(cleanData);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener la clasificación',
      details: error.message,
    });
  }
});

app.post('/api/admin/standings', async (req, res) => {
  try {
    const standings = req.body;

    if (!Array.isArray(standings)) {
      return res.status(400).json({ error: 'La clasificación debe ser un array' });
    }

    const cleanStandings = standings.map((team, index) => ({
      id: team.id || index + 1,
      position: Number(team.position || index + 1),
      team: team.team || '',
      logo: team.logo || '',
      points: Number(team.points || 0),
      playedgames: Number(team.playedgames ?? team.playedGames ?? 0),
      won: Number(team.won || 0),
      draw: Number(team.draw || 0),
      lost: Number(team.lost || 0),
    }));

    await supabase.from('standings').delete().neq('id', 0);

    const { error } = await supabase
      .from('standings')
      .insert(cleanStandings);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo guardar la clasificación',
      details: error.message,
    });
  }
});

app.get('/standings/first-team', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('standings')
      .select('*')
      .order('position', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const cleanData = (data || []).map((team) => ({
      position: team.position,
      team: team.team,
      logo: team.logo,
      points: team.points,
      playedGames: team.playedgames,
      won: team.won,
      draw: team.draw,
      lost: team.lost,
    }));

    res.json(cleanData);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener la clasificación',
      details: error.message,
    });
  }
});

app.get('/test-supabase', async (req, res) => {
  res.json({
    hasUrl: !!process.env.SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_KEY,
    url: process.env.SUPABASE_URL,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});