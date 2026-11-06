const supabase = require('../config/supabase');

async function refreshInstagramToken() {
  const { data, error } = await supabase
    .from('instagram_tokens')
    .select('access_token')
    .eq('id', 'albinegros')
    .maybeSingle();

  if (error) throw error;

  const currentToken =
    data?.access_token || process.env.INSTAGRAM_ACCESS_TOKEN?.trim();

  if (!currentToken) {
    throw new Error('No hay token de Instagram disponible');
  }

  const url = new URL('https://graph.instagram.com/refresh_access_token');
  url.searchParams.set('grant_type', 'ig_refresh_token');
  url.searchParams.set('access_token', currentToken);

  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || result.error || !result.access_token) {
    throw new Error(
      `Error renovando Instagram: ${result.error?.message || response.status}`
    );
  }

  const { error: saveError } = await supabase
    .from('instagram_tokens')
    .upsert({
      id: 'albinegros',
      access_token: result.access_token,
      updated_at: new Date().toISOString(),
    });

  if (saveError) throw saveError;

  return {
    success: true,
    expires_in: result.expires_in,
  };
}

module.exports = { refreshInstagramToken };
