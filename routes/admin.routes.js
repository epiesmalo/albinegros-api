const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');
const adminAuth = require('../middleware/adminAuth');

router.get('/api/admin/news', async (req, res) => {
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

router.post('/api/admin/news', adminAuth, async (req, res) => {
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

router.get('/api/admin/calendar', async (req, res) => {
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

router.post('/api/admin/calendar', adminAuth, async (req, res) => {
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

router.get('/api/admin/standings', async (req, res) => {
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

router.post('/api/admin/standings', adminAuth, async (req, res) => {
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

router.get('/api/admin/next-match', async (req, res) => {
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
      teamLogo: data.teamlogo,
      opponentLogo: data.opponentLogo,
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener el próximo partido',
      details: error.message,
    });
  }
});

router.post('/api/admin/next-match', adminAuth, async (req, res) => {
  try {
    const payload = {
      id: '1',
      teamName: req.body.teamName,
      opponent: req.body.opponent,
      date: req.body.date,
      time: req.body.time,
      stadium: req.body.stadium,
      competition: req.body.competition,
      teamlogo: req.body.teamLogo,
      opponentLogo: req.body.opponentLogo,
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

router.get('/api/admin/about', async (req, res) => {
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

router.post('/api/admin/about', adminAuth, async (req, res) => {
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

router.get('/api/admin/ads', async (req, res) => {
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

router.post('/api/admin/ads', adminAuth, async (req, res) => {
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

// ==================== GALLERY ====================

router.get('/api/admin/gallery', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json(data || []);
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener la galería',
      details: error.message,
    });
  }
});

router.post('/api/admin/gallery', adminAuth, async (req, res) => {
  try {
    const gallery = req.body;

    if (!Array.isArray(gallery)) {
      return res.status(400).json({
        error: 'La galería debe ser un array',
      });
    }

    await supabase
      .from('gallery')
      .delete()
      .neq('id', '');

    const { error } = await supabase
      .from('gallery')
      .insert(gallery);

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo guardar la galería',
      details: error.message,
    });
  }
});

module.exports = router;