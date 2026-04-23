require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log('API KEY:', process.env.API_FOOTBALL_KEY);

// CLASIFICACIÓN
app.get('/standings/first-team', async (req, res) => {
  try {
    const response = await axios.get('https://v3.football.api-sports.io/standings', {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY.trim(),
      },
      params: {
        league: 141,
        season: 2024,
      },
    });

    const standings =
      response.data?.response?.[0]?.league?.standings?.[0] || [];

    const cleanTable = standings.map((team) => ({
      position: team.rank,
      team: team.team.name,
      points: team.points,
      playedGames: team.all.played,
      won: team.all.win,
      draw: team.all.draw,
      lost: team.all.lose,
      goalsFor: team.all.goals.for,
      goalsAgainst: team.all.goals.against,
      goalDifference: team.goalsDiff,
    }));

    res.json(cleanTable);
  } catch (error) {
    console.error('ERROR API-FOOTBALL STANDINGS:');
    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: 'No se pudo obtener la clasificación',
      details: error.response?.data || error.message,
    });
  }
});

// CALENDARIO
app.get('/calendar/first-team', async (req, res) => {
  try {
    const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY.trim(),
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

const PORT = process.env.PORT || 3001;
const nextMatchPath = path.join(__dirname, 'data', 'nextMatch.json');
const aboutPath = path.join(__dirname, 'data', 'about.json');
const adsPath = path.join(__dirname, 'data', 'ads.json');

app.get('/api/admin/next-match', (req, res) => {
  const data = JSON.parse(fs.readFileSync(nextMatchPath, 'utf8'));
  res.json(data);
});

app.post('/api/admin/next-match', (req, res) => {
  fs.writeFileSync(nextMatchPath, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/api/admin/about', (req, res) => {
  const data = JSON.parse(fs.readFileSync(aboutPath, 'utf8'));
  res.json(data);
});

app.post('/api/admin/about', (req, res) => {
  fs.writeFileSync(aboutPath, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

app.get('/api/admin/ads', (req, res) => {
  const data = JSON.parse(fs.readFileSync(adsPath, 'utf8'));
  res.json(data);
});

app.post('/api/admin/ads', (req, res) => {
  fs.writeFileSync(adsPath, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});
