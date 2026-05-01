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

const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Panel Admin"');
    return res.status(401).send('Acceso restringido');
  }

  const base64Credentials = auth.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [user, password] = credentials.split(':');

  if (
    user === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Panel Admin"');
  return res.status(401).send('Usuario o contraseña incorrectos');
};

// 🔐 proteger acceso al admin.html
app.get('/admin.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 🔐 proteger POST del panel
app.use('/api/admin', (req, res, next) => {
  if (req.method === 'POST') {
    return requireAdmin(req, res, next);
  }
  next();
});

// 👇 esto SIEMPRE al final
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3001;
const aboutPath = path.join(__dirname, 'data', 'about.json');

// CALENDARIO
// CALENDARIO - SUPABASE
app.get('/calendar/first-team', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calendar')
      .select('*')
      .order('date', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener el calendario',
      details: error.message,
    });
  }
});

app.get('/api/admin/calendar', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calendar')
      .select('*')
      .order('date', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener el calendario',
      details: error.message,
    });
  }
});

app.post('/api/admin/calendar', async (req, res) => {
  try {
    const calendar = req.body;

    if (!Array.isArray(calendar)) {
      return res.status(400).json({ error: 'El calendario debe ser un array' });
    }

    const cleanCalendar = calendar.map((match, index) => ({
      id: Number(match.id || index + 1),
      date: match.date || '',
      status: match.status || '',
      league: match.league || '',
      round: match.round || '',
      venue: match.venue || '',
      homeTeam: match.homeTeam || '',
      awayTeam: match.awayTeam || '',
      homeLogo: match.homeLogo || '',
      awayLogo: match.awayLogo || '',
      homeGoals:
        match.homeGoals === '' || match.homeGoals === null || match.homeGoals === undefined
          ? null
          : Number(match.homeGoals),
      awayGoals:
        match.awayGoals === '' || match.awayGoals === null || match.awayGoals === undefined
          ? null
          : Number(match.awayGoals),
    }));

    await supabase.from('calendar').delete().neq('id', 0);

    const { error } = await supabase
      .from('calendar')
      .insert(cleanCalendar);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo guardar el calendario',
      details: error.message,
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
// QUIÉNES SOMOS - SUPABASE
app.get('/api/admin/about', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('about')
      .select('*')
      .eq('id', '1')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      title: data.title,
      text: data.text,
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener la sección Quiénes somos',
      details: error.message,
    });
  }
});

app.post('/api/admin/about', async (req, res) => {
  try {
    const payload = {
      id: '1',
      title: req.body.title,
      text: req.body.text,
    };

    const { error } = await supabase
      .from('about')
      .upsert(payload);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo guardar la sección Quiénes somos',
      details: error.message,
    });
  }
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
// NOTICIAS - SUPABASE
app.get('/api/admin/news', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron obtener las noticias',
      details: error.message,
    });
  }
});

app.post('/api/admin/news', async (req, res) => {
  try {
    const news = req.body;

    if (!Array.isArray(news)) {
      return res.status(400).json({ error: 'Las noticias deben ser un array' });
    }

    await supabase.from('news').delete().neq('id', '');

    const { error } = await supabase.from('news').insert(news);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron guardar las noticias',
      details: error.message,
    });
  }
});

app.get('/news', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron obtener las noticias',
      details: error.message,
    });
  }
});

app.get('/get-token', async (req, res) => {
  try {
    const code = req.query.code;

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: 'https://localhost/',
        code,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/instagram/posts', async (req, res) => {
  try {
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
    );

    const data = await response.json();

    res.json(data);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/instagram/sync', async (req, res) => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN.trim();

    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp&access_token=${token}`
    );

    const data = await response.json();

    for (const post of data.data) {
      // comprobar si ya existe
      const { data: existing } = await supabase
        .from('news')
        .select('*')
        .eq('instagram_id', post.id)
        .single();

      if (!existing) {
        await supabase.from('news').insert({
          title: post.caption || 'Post de Instagram',
          content: post.caption || '',
          image_url: post.media_url,
          source_url: post.permalink,
          published_at: post.timestamp,
          instagram_id: post.id
        });
      }
    }

    res.json({ success: true, posts: data.data.length });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});