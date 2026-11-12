const express = require('express');
const { analyzeIdea, compareReports } = require('../groq');
const { researchIdea } = require('../serper');
const { saveAnalysis, saveComparison, reserveUsage, releaseUsage } = require('../db');
const { requireClientId } = require('../middleware/client');
const { body, CompareSchema } = require('../middleware/validate');

const router = express.Router();
router.use(requireClientId);

// POST /api/compare (counts as two validations)
router.post('/', body(CompareSchema), async (req, res) => {
  const { idea_a, idea_b } = req.body;
  const usage = reserveUsage(req.clientId, 2);
  if (!usage.allowed) {
    return res.status(429).json({
      error: `A comparison uses 2 validations and you have ${usage.remaining} left today. The limit resets at midnight UTC.`,
      remaining: usage.remaining,
    });
  }

  try {
    const [reportA, reportB] = await Promise.all([
      researchIdea(idea_a).then(sources => analyzeIdea(idea_a, sources)),
      researchIdea(idea_b).then(sources => analyzeIdea(idea_b, sources)),
    ]);
    const { winner, comparison_summary } = compareReports(idea_a, reportA, idea_b, reportB);

    const a = saveAnalysis({ ...idea_a, client_id: req.clientId, report: reportA, viability_score: reportA.viability_score });
    const b = saveAnalysis({ ...idea_b, client_id: req.clientId, report: reportB, viability_score: reportB.viability_score });
    saveComparison({ analysis_a_id: a.id, analysis_b_id: b.id, winner, comparison_summary });

    return res.json({
      idea_a: { ...idea_a, id: a.id, share_id: a.share_id, report: reportA, viability_score: reportA.viability_score },
      idea_b: { ...idea_b, id: b.id, share_id: b.share_id, report: reportB, viability_score: reportB.viability_score },
      winner,
      comparison_summary,
      remaining: usage.remaining,
    });
  } catch (err) {
    releaseUsage(req.clientId, 2);
    console.error('Compare error:', err);
    return res.status(502).json({ error: 'The AI comparison failed. Your free validations were not used. Please try again.' });
  }
});

module.exports = router;
