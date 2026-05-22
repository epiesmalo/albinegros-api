const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

router.get('/calendar/first-team', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calendar')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;