const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

const EXPO_PUSH_TOKEN_REGEX =
  /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;

router.post('/api/notifications/register', async (req, res) => {
  try {
    const {
      expoPushToken,
      platform = 'android',
      castellonEnabled = true,
      castellonBEnabled = true,
      matchReminderEnabled = true,
      matchStartEnabled = true,
      goalsEnabled = true,
      halftimeEnabled = true,
      fulltimeEnabled = true,
    } = req.body || {};

    if (
      typeof expoPushToken !== 'string' ||
      !EXPO_PUSH_TOKEN_REGEX.test(expoPushToken.trim())
    ) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid Expo push token',
      });
    }

    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid platform',
      });
    }

    const { error } = await supabase.rpc(
      'register_push_device',
      {
        p_expo_push_token: expoPushToken.trim(),
        p_platform: platform,
        p_castellon_enabled: Boolean(castellonEnabled),
        p_castellon_b_enabled: Boolean(castellonBEnabled),
        p_match_reminder_enabled: Boolean(matchReminderEnabled),
        p_match_start_enabled: Boolean(matchStartEnabled),
        p_goals_enabled: Boolean(goalsEnabled),
        p_halftime_enabled: Boolean(halftimeEnabled),
        p_fulltime_enabled: Boolean(fulltimeEnabled),
      }
    );

    if (error) {
      console.error(
        'Error registering push device:',
        error
      );

      return res.status(500).json({
        ok: false,
        error: 'Could not register push device',
      });
    }

    return res.json({
      ok: true,
      registered: true,
    });
  } catch (error) {
    console.error(
      'Unexpected push registration error:',
      error
    );

    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;