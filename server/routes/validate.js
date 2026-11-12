const express = require('express');
const { analyzeIdea } = require('../groq');
const { researchIdea } = require('../serper');
const { saveAnalysis, reserveUsage, releaseUsage, getUsageInfo } = require('../db');
const { requireClientId } = require('../middleware/client');
const { body, IdeaSchema } = require('../middleware/validate');

const router = express.Router();
router.use(requireClientId);

// GET /api/validate/usage
router.get('/usage', (req, res) => {
  res.json(getUsageInfo(req.clientId));
});

// POST /api/validate
router.post('/', body(IdeaSchema), async (req, res) => {
  const idea = req.body;
  const usage = reserveUsage(req.clientId, 1);
  if (!usage.allowed) {
    return res.status(429).json({
      error: 'Daily limit reached (5 free validations per day). It resets at midnight UTC.',
      remaining: 0,
    });
  }

  try {
    const sources = await researchIdea(idea);
    const report = await analyzeIdea(idea, sources);
    const { id, share_id } = saveAnalysis({
      ...idea,
      client_id: req.clientId,
      report,
      viability_score: report.viability_score,
    });
    return res.json({ id, share_id, report, viability_score: report.viability_score, remaining: usage.remaining });
  } catch (err) {
    releaseUsage(req.clientId, 1);
    console.error('Validation error:', err);
    return res.status(502).json({ error: 'The AI analysis failed. Your free validation was not used. Please try again.' });
  }
});

module.exports = router;
