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

module.exports = router;