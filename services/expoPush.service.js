const supabase = require('../config/supabase');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const EXPO_PUSH_TOKEN_REGEX =
  /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;

const EXPO_BATCH_SIZE = 100;

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function deactivatePushTokens(tokens) {
  const uniqueTokens = [...new Set(
    (tokens || [])
      .filter((token) => typeof token === 'string')
      .map((token) => token.trim())
      .filter(Boolean)
  )];

  if (!uniqueTokens.length) return;

  const { error } = await supabase
    .from('push_devices')
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .in('expo_push_token', uniqueTokens);

  if (error) {
    console.error('Error desactivando tokens push:', error);
  }
}

async function getActivePushDevices({ team = null, preference = null } = {}) {
  let query = supabase
    .from('push_devices')
    .select([
      'expo_push_token',
      'platform',
      'castellon_enabled',
      'castellon_b_enabled',
      'match_reminder_enabled',
      'match_start_enabled',
      'goals_enabled',
      'halftime_enabled',
      'fulltime_enabled',
    ].join(','))
    .eq('active', true);

  if (team === 'castellon') {
    query = query.eq('castellon_enabled', true);
  }

  if (team === 'castellon_b') {
    query = query.eq('castellon_b_enabled', true);
  }

  const allowedPreferences = new Set([
    'match_reminder_enabled',
    'match_start_enabled',
    'goals_enabled',
    'halftime_enabled',
    'fulltime_enabled',
  ]);

  if (preference && allowedPreferences.has(preference)) {
    query = query.eq(preference, true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `No se pudieron cargar los dispositivos push: ${error.message}`
    );
  }

  return (data || []).filter((device) =>
    EXPO_PUSH_TOKEN_REGEX.test(String(device.expo_push_token || '').trim())
  );
}

async function sendExpoBatch(messages) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Expo Push HTTP ${response.status}: ${JSON.stringify(result)}`
    );
  }

  return result;
}

async function sendPushNotification({
  title,
  body,
  data = {},
  team = null,
  preference = null,
  sound = 'default',
  channelId = 'match-alerts',
}) {
  if (!title || !body) {
    throw new Error('La notificación necesita title y body');
  }

  const devices = await getActivePushDevices({ team, preference });

  if (!devices.length) {
    return {
      ok: true,
      devices: 0,
      sent: 0,
      tickets: [],
    };
  }

  const messages = devices.map((device) => ({
    to: device.expo_push_token,
    sound,
    title,
    body,
    data,
    channelId: device.platform === 'android' ? channelId : undefined,
  }));

  const batches = chunkArray(messages, EXPO_BATCH_SIZE);
  const tickets = [];
  const invalidTokens = [];

  for (const batch of batches) {
    const result = await sendExpoBatch(batch);
    const batchTickets = Array.isArray(result?.data) ? result.data : [];

    batchTickets.forEach((ticket, index) => {
      const token = batch[index]?.to;

      if (
        ticket?.status === 'error' &&
        ticket?.details?.error === 'DeviceNotRegistered' &&
        token
      ) {
        invalidTokens.push(token);
      }

      tickets.push({ token, ...ticket });
    });
  }

  await deactivatePushTokens(invalidTokens);

  const sent = tickets.filter((ticket) => ticket.status === 'ok').length;

  return {
    ok: true,
    devices: devices.length,
    sent,
    tickets,
  };
}

async function getPushReceipts(ticketIds) {
  const ids = [...new Set(
    (ticketIds || [])
      .filter((id) => typeof id === 'string')
      .map((id) => id.trim())
      .filter(Boolean)
  )];

  if (!ids.length) {
    return { ok: true, receipts: {} };
  }

  const response = await fetch(EXPO_RECEIPTS_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Expo Receipts HTTP ${response.status}: ${JSON.stringify(result)}`
    );
  }

  return {
    ok: true,
    receipts: result?.data || {},
  };
}

module.exports = {
  getActivePushDevices,
  sendPushNotification,
  getPushReceipts,
  deactivatePushTokens,
};
