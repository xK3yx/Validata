const express = require('express');
const router = express.Router();
const { searchCompetitor } = require('../serper');

// GET /api/competitor?name=Notion&industry=Productivity
router.get('/', async (req, res) => {
  const { name, industry } = req.query;
  if (!name) return res.status(400).json({ error: 'name query parameter is required.' });

  try {
    const data = await searchCompetitor(name.trim(), industry);
    return res.json(data);
  } catch (err) {
    console.error('Competitor lookup error:', err);
    return res.status(500).json({ error: 'Failed to fetch competitor data.' });
  }
});

module.exports = router;
