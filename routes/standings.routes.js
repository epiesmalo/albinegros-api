const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

router.get('/standings/first-team', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('standings')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    // Defensa adicional: si quedara alguna fila duplicada
    // antigua en Supabase, nunca la entregamos dos veces a la app.
    const uniqueByTeam = new Map();

    for (const row of data || []) {
      const key = Number(row?.teamId);

      if (!Number.isFinite(key)) {
        continue;
      }

      if (!uniqueByTeam.has(key)) {
        uniqueByTeam.set(key, row);
      }
    }

    res.json(
      Array.from(uniqueByTeam.values()).sort(
        (a, b) =>
          Number(a.position) -
          Number(b.position)
      )
    );
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;