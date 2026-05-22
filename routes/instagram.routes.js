const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');

router.get('/instagram/posts', async (req, res) => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();

    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp&access_token=${token}`
    );

    const data = await response.json();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/instagram/sync', async (req, res) => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();

    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${token}`
    );

    const result = await response.json();

    if (result.error) {
      return res.status(500).json(result);
    }

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

    res.json({
      success: errors.length === 0,
      posts: result.data?.length || 0,
      inserted,
      skipped,
      errors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;