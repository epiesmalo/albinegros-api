const express = require('express');
const router = express.Router();

const {
  getInstagramPosts,
  syncInstagramPosts,
} = require('../services/instagram.service');

router.get('/instagram/posts', async (req, res) => {
  try {
    const data = await getInstagramPosts();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message || error,
    });
  }
});

router.get('/instagram/sync', async (req, res) => {
  try {
    const result = await syncInstagramPosts();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message || error,
    });
  }
});

module.exports = router;