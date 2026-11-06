const supabase = require('../config/supabase');

async function getInstagramPosts() {
  const { data, error } = await supabase
    .from('instagram_tokens')
    .select('access_token')
    .eq('id', 'albinegros')
    .maybeSingle();

  if (error) {
    throw new Error(`Error leyendo token de Instagram: ${error.message}`);
  }

  const token =
    data?.access_token || process.env.INSTAGRAM_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new Error('No hay token de Instagram configurado');
  }

  const response = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${token}`
  );

  const result = await response.json();

  if (result.error) {
    throw result.error;
  }

  return result;
}

async function syncInstagramPosts() {
  const result = await getInstagramPosts();

  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (const post of result.data || []) {
    const { data: existing, error: existingError } = await supabase
      .from('news')
      .select('id')
      .eq('instagram_id', post.id)
      .maybeSingle();

    if (existingError) {
      errors.push(existingError.message);
      continue;
    }

    if (existing) {
      skipped++;
      continue;
    }

    const { error: insertError } = await supabase.from('news').insert({
      id: post.id,
      title: post.caption ? post.caption.slice(0, 80) : 'Post de Instagram',
      description: post.caption || '',
      image: post.thumbnail_url || post.media_url || '',
      link: post.permalink || '',
      date: post.timestamp || new Date().toISOString(),
      source: 'instagram',
      instagram_id: post.id,
    });

    if (insertError) {
      console.log('ERROR INSERT NEWS:', insertError);
      errors.push(insertError.message);
    } else {
      inserted++;
    }
  }

  return {
    success: errors.length === 0,
    posts: result.data?.length || 0,
    inserted,
    skipped,
    errors,
  };
}

module.exports = {
  getInstagramPosts,
  syncInstagramPosts,
};