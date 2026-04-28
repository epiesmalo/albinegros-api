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

const nextMatchPath = path.join(__dirname, 'data', 'nextMatch.json');
const aboutPath = path.join(__dirname, 'data', 'about.json');
const standingsPath = path.join(__dirname, 'data', 'standings.json');

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
    console.error('ERROR API-FOOTBALL CALENDAR:');
    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: 'No se pudo obtener el calendario',
      details: error.response?.data || error.message,
    });
  }
});

// PRÓXIMO PARTIDO
app.get('/api/admin/next-match', (req, res) => {
  const data = JSON.parse(fs.readFileSync(nextMatchPath, 'utf8'));
  res.json(data);
});

app.post('/api/admin/next-match', (req, res) => {
  fs.writeFileSync(nextMatchPath, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

// QUIÉNES SOMOS
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

    if (error) {
      return res.status(500).json({ error: error.message });
    }

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

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron guardar los sponsors',
      details: error.message,
    });
  }
});

// CLASIFICACIÓN
app.get('/api/admin/standings', (req, res) => {
  const data = JSON.parse(fs.readFileSync(standingsPath, 'utf8'));
  res.json(data);
});

app.post('/api/admin/standings', (req, res) => {
  fs.writeFileSync(standingsPath, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/standings/first-team', (req, res) => {
  const data = JSON.parse(fs.readFileSync(standingsPath, 'utf8'));
  res.json(data);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});