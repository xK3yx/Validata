const express = require('express');
const router = express.Router();
const { analyzeIdea } = require('../groq');
const { saveAnalysis, checkAndIncrementUsage, getUsageInfo } = require('../db');

// GET /api/validate/usage
router.get('/usage', (req, res) => {
  const clientId = req.headers['x-client-id'] || null;
  res.json(getUsageInfo(clientId));
});

// POST /api/validate
router.post('/', async (req, res) => {
  const { idea_title, idea_description, target_audience, industry, refinement_context } = req.body;
  const clientId = req.headers['x-client-id'] || null;

  if (!idea_title || !idea_description) {
    return res.status(400).json({ error: 'idea_title and idea_description are required.' });
  }

  const usage = checkAndIncrementUsage(clientId);
  if (!usage.allowed) {
    return res.status(429).json({
      error: 'Daily limit reached (5 free validations/day). Upgrade to Pro for unlimited access.',
      upgrade: true, remaining: 0,
    });
  }

  try {
    const report = await analyzeIdea({ idea_title, idea_description, target_audience, industry, refinement_context });
    const viability_score = report.viability_score;
    const { id, share_id } = saveAnalysis({ idea_title, idea_description, target_audience, industry, report, viability_score });
    return res.json({ id, share_id, report, viability_score, remaining: usage.remaining });
  } catch (err) {
    console.error('Validation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze idea. Please try again.' });
  }
});

module.exports = router;
