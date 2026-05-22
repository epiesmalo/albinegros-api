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

module.exports = router;