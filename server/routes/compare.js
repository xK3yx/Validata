const express = require('express');
const router = express.Router();
const { analyzeComparison } = require('../groq');
const { saveAnalysis, saveComparison, checkAndIncrementUsage, getUsageInfo } = require('../db');

router.post('/', async (req, res) => {
  const { idea_a, idea_b } = req.body;
  const clientId = req.headers['x-client-id'] || null;

  if (!idea_a?.idea_title || !idea_a?.idea_description || !idea_b?.idea_title || !idea_b?.idea_description) {
    return res.status(400).json({ error: 'Both ideas require a title and description.' });
  }

  // Counts as 2 usages — pre-check before incrementing
  const current = getUsageInfo(clientId);
  if (current.remaining < 2) {
    return res.status(429).json({
      error: `Comparison requires 2 validations. You have ${current.remaining} remaining today. Upgrade to Pro for unlimited access.`,
      upgrade: true,
    });
  }
  const usageA = checkAndIncrementUsage(clientId);
  const usageB = checkAndIncrementUsage(clientId);

  try {
    const { reportA, reportB, winner, comparison_summary } = await analyzeComparison(idea_a, idea_b);

    const { id: idA, share_id: shareA } = saveAnalysis({
      idea_title: idea_a.idea_title,
      idea_description: idea_a.idea_description,
      target_audience: idea_a.target_audience,
      industry: idea_a.industry,
      report: reportA,
      viability_score: reportA.viability_score,
    });

    const { id: idB, share_id: shareB } = saveAnalysis({
      idea_title: idea_b.idea_title,
      idea_description: idea_b.idea_description,
      target_audience: idea_b.target_audience,
      industry: idea_b.industry,
      report: reportB,
      viability_score: reportB.viability_score,
    });

    saveComparison({ analysis_a_id: idA, analysis_b_id: idB, winner, comparison_summary });

    return res.json({
      idea_a: { id: idA, share_id: shareA, report: reportA, viability_score: reportA.viability_score, ...idea_a },
      idea_b: { id: idB, share_id: shareB, report: reportB, viability_score: reportB.viability_score, ...idea_b },
      winner,
      comparison_summary,
      remaining: usageB.remaining,
    });
  } catch (err) {
    console.error('Compare error:', err);
    return res.status(500).json({ error: err.message || 'Failed to compare ideas.' });
  }
});

module.exports = router;
