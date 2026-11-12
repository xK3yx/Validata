const express = require('express');
const { hasSerper, searchCompetitor } = require('../serper');

const router = express.Router();

// GET /api/competitor?name=Notion&industry=Productivity
router.get('/', async (req, res) => {
  const name = String(req.query.name || '').trim().slice(0, 100);
  const industry = String(req.query.industry || '').trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: 'name query parameter is required.' });
  if (!hasSerper()) return res.status(503).json({ error: 'Competitor lookup is not configured on this server.' });

  try {
    return res.json(await searchCompetitor(name, industry));
  } catch (err) {
    console.error('Competitor lookup error:', err);
    return res.status(502).json({ error: 'Failed to fetch competitor data.' });
  }
});

module.exports = router;
