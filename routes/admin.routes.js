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

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      teamName: data.teamName,
      teamShortName: data.teamShortName,
      opponent: data.opponent,
      opponentShortName: data.opponentShortName,
      isHome: data.isHome,
      date: data.date,
      time: data.time,
      stadium: data.stadium,
      competition: data.competition,
      teamLogo: data.teamLogo || data.teamlogo,
      opponentLogo: data.opponentLogo,
      updatedAt: data.updated_at,
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
  teamLogo: req.body.teamLogo,
  opponentLogo: req.body.opponentLogo,
  updated_at: new Date().toISOString(),
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
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const rows = data || [];

    const historyRow = rows.find((item) => String(item.id) === '1');
    const teamRow = rows.find((item) => String(item.id) === '2');
    const collaborateRow = rows.find((item) => String(item.id) === '3');
    const socialsRow = rows.find((item) => String(item.id) === '4');

    const parseData = (value) => {
      try {
        return value ? JSON.parse(value) : {};
      } catch {
        return {};
      }
    };

    res.json({
      // Compatibilidad con la versión actual de la app
      title: historyRow?.title || '',
      text: historyRow?.text || '',

      history: {
        title: historyRow?.title || '',
        text: historyRow?.text || '',
      },

      team: parseData(teamRow?.text),

      collaborate: parseData(collaborateRow?.text),

      socials: parseData(socialsRow?.text),
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
    const history = req.body.history || {
      title: req.body.title || '',
      text: req.body.text || '',
    };

    const team = req.body.team || {};
    const collaborate = req.body.collaborate || {};
    const socials = req.body.socials || {};

    const rows = [
      {
        id: '1',
        title: history.title || '',
        text: history.text || '',
      },
      {
        id: '2',
        title: 'team',
        text: JSON.stringify(team),
      },
      {
        id: '3',
        title: 'collaborate',
        text: JSON.stringify(collaborate),
      },
      {
        id: '4',
        title: 'socials',
        text: JSON.stringify(socials),
      },
    ];

    const { error } = await supabase
      .from('about')
      .upsert(rows);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo guardar la sección Quiénes somos',
      details: error.message,
    });
  }
});
router.get('/api/admin/ticker', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('home_ticker')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      text: data?.text || '',
      active: Boolean(data?.active),
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo obtener el ticker',
      details: error.message,
    });
  }
});

router.post('/api/admin/ticker', adminAuth, async (req, res) => {
  try {
    const text = typeof req.body.text === 'string'
      ? req.body.text.trim()
      : '';

    const active = Boolean(req.body.active);

    const { error } = await supabase
      .from('home_ticker')
      .upsert({
        id: 1,
        text,
        active,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      text,
      active,
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudo guardar el ticker',
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

    const { error: deleteError } = await supabase
      .from('ads')
      .delete()
      .neq('id', '');

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    if (ads.length > 0) {
      const { error: insertError } = await supabase
        .from('ads')
        .insert(ads);

      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }
    }

    res.json({
      success: true,
      total: ads.length,
    });
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
  console.log("====== GALLERY POST ======");
console.log(req.body.length);
  
try {
    const gallery = req.body;

    if (!Array.isArray(gallery)) {
      return res.status(400).json({
        error: 'La galería debe ser un array',
      });
    }
console.log("BORRANDO...");
console.log("INSERTANDO...");    
const { error: deleteError } = await supabase
      .from('gallery')
      .delete()
      .neq('id', '');
    
console.log("BORRADO TERMINADO");
    if (deleteError) {
      console.error('ERROR BORRANDO GALERÍA:', deleteError);

      return res.status(500).json({
        error: 'No se pudo borrar la galería anterior',
        details: deleteError.message,
      });
    }

    if (gallery.length > 0) {
      const { error: insertError } = await supabase
        .from('gallery')
        .insert(gallery);

      if (insertError) {
        console.error('ERROR INSERTANDO GALERÍA:', insertError);

        return res.status(500).json({
          error: 'No se pudo insertar la nueva galería',
          details: insertError.message,
        });
      }
    }

    res.json({
      success: true,
      total: gallery.length,
    });
  } catch (error) {
    console.error('ERROR GENERAL GALERÍA:', error);

    res.status(500).json({
      error: 'No se pudo guardar la galería',
      details: error.message,
    });
  }
});

    

module.exports = router;