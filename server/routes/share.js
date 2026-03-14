const express = require('express');
const router = express.Router();
const { getAnalysisByShareId } = require('../db');

// GET /api/share/:shareId
router.get('/:shareId', (req, res) => {
  try {
    const analysis = getAnalysisByShareId(req.params.shareId);
    if (!analysis) return res.status(404).json({ error: 'Shared report not found.' });
    return res.json(analysis);
  } catch (err) {
    console.error('Share fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch shared report.' });
  }
});

module.exports = router;
