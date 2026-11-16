'use strict';
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const LIMIT = 50;
const validId = value => typeof value === 'string' && /^chapas-[a-z0-9-]{15,110}$/.test(value);
const validInt = value => Number.isSafeInteger(value) && value >= 0 && value <= 100000;
const better = (a, b) => a.losses - b.losses || (a.wins + a.losses) - (b.wins + b.losses) || (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against) || b.goals_for - a.goals_for || String(a.finished_at).localeCompare(String(b.finished_at));
router.get('/leaderboard', async (req, res) => {
  const period = req.query.period === 'month' ? 'month' : 'all';
  try {
    // Ranking mensual: mejor carrera terminada durante el mes UTC actual.
    let query = supabase.from(period === 'month' ? 'chapas_career_runs' : 'chapas_leaderboard').select('device_id,nickname,wins,losses,goals_for,goals_against,finished_at').limit(5000);
    if (period === 'month') {
      const d = new Date();
      query = query.gte('finished_at', new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString());
    }
    const { data, error } = await query;
    if (error) throw error;
    const unique = new Map();
    for (const row of data || []) { const previous = unique.get(row.device_id); if (!previous || better(row, previous) < 0) unique.set(row.device_id, row); }
    const entries = [...unique.values()].sort(better).slice(0, LIMIT).map(({ device_id, ...publicRow }) => publicRow);
    res.set('Cache-Control', 'public, max-age=30');
    return res.json({ ok: true, period, entries });
  } catch (error) {
    console.error('[chapas] leaderboard', error);
    return res.status(503).json({ ok: false, error: 'Clasificación temporalmente no disponible' });
  }
});
router.post('/leaderboard', express.json({ limit: '4kb' }), async (req, res) => {
  try {
    const { deviceId, wins, losses, goalsFor, goalsAgainst } = req.body || {};
    const nickname = String(req.body?.nickname || '').trim().replace(/\s+/g, ' ');
    if (!validId(deviceId) || nickname.length < 3 || nickname.length > 15 || !/^[\p{L}\p{N} _.-]+$/u.test(nickname) || wins !== 24 || ![losses, goalsFor, goalsAgainst].every(validInt) || goalsFor < 72 || goalsFor > (wins + losses) * 3 || goalsAgainst < losses * 3 || goalsAgainst > (wins + losses) * 3) {
      return res.status(400).json({ ok: false, error: 'Resultado o apodo no válido' });
    }
    const row = { device_id: deviceId, nickname, wins, losses, goals_for: goalsFor, goals_against: goalsAgainst, finished_at: new Date().toISOString() };
    const { data: old, error: lookupError } = await supabase.from('chapas_leaderboard').select('*').eq('device_id', deviceId).maybeSingle();
    if (lookupError) throw lookupError;
    // Guarda cada carrera terminada para el ranking mensual, aunque no supere el récord histórico.
    const { error: runError } = await supabase.from('chapas_career_runs').insert(row);
    if (runError) throw runError;
    if (old && better(row, old) >= 0) return res.json({ ok: true, improved: false });
    const { error } = await supabase.from('chapas_leaderboard').upsert(row, { onConflict: 'device_id' });
    if (error) throw error;
    return res.json({ ok: true, improved: true });
  } catch (error) {
    console.error('[chapas] register', error);
    return res.status(503).json({ ok: false, error: 'No se pudo guardar la marca' });
  }
});
// Clasificación pública de carreras en curso: mayor progreso, menos derrotas y mejor DG.
const aspirantBetter = (a, b) => b.wins - a.wins || a.losses - b.losses || (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against) || b.goals_for - a.goals_for || String(a.updated_at).localeCompare(String(b.updated_at));
router.get('/aspirants', async (req, res) => {
  const period = req.query.period === 'month' ? 'month' : 'all';
  try {
    let query = supabase.from('chapas_aspirants').select('nickname,wins,losses,goals_for,goals_against,updated_at').order('wins', { ascending: false }).limit(5000);
    if (period === 'month') {
      const d = new Date();
      query = query.gte('updated_at', new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString());
    }
    const { data, error } = await query;
    if (error) throw error;
    res.set('Cache-Control', 'public, max-age=15');
    return res.json({ ok: true, period, entries: (data || []).sort(aspirantBetter).slice(0, LIMIT) });
  } catch (error) {
    console.error('[chapas] aspirants get', error);
    return res.status(503).json({ ok: false, error: 'Ranking de aspirantes no disponible' });
  }
});
router.post('/aspirants', express.json({ limit: '4kb' }), async (req, res) => {
  try {
    const { deviceId, wins, losses, goalsFor, goalsAgainst } = req.body || {};
    const nickname = String(req.body?.nickname || '').trim().replace(/\s+/g, ' ');
    const matches = wins + losses;
    if (!validId(deviceId) || nickname.length < 3 || nickname.length > 15 || !/^[\p{L}\p{N} _.-]+$/u.test(nickname) ||
        ![wins, losses, goalsFor, goalsAgainst].every(validInt) || wins < 1 || wins > 24 ||
        goalsFor < wins * 3 || goalsFor > matches * 3 || goalsAgainst < losses * 3 || goalsAgainst > matches * 3) {
      return res.status(400).json({ ok: false, error: 'Progreso o apodo no válido' });
    }
    const { data: old, error: lookupError } = await supabase.from('chapas_aspirants').select('*').eq('device_id', deviceId).maybeSingle();
    if (lookupError) throw lookupError;
    // Una instalación conserva su apodo inicial. No se aceptan regresiones en el récord.
    if (old && old.nickname !== nickname) return res.status(409).json({ ok: false, error: 'Este dispositivo ya tiene un apodo asignado' });
    const row = { device_id: deviceId, nickname, wins, losses, goals_for: goalsFor, goals_against: goalsAgainst, updated_at: new Date().toISOString() };
    if (old && aspirantBetter(row, old) >= 0) return res.json({ ok: true, improved: false });
    const { error } = await supabase.from('chapas_aspirants').upsert(row, { onConflict: 'device_id' });
    if (error) throw error;
    return res.json({ ok: true, improved: true });
  } catch (error) {
    console.error('[chapas] aspirants post', error);
    return res.status(503).json({ ok: false, error: 'No se pudo guardar el progreso' });
  }
});
module.exports = router;
