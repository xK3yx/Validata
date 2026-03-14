const express = require('express');
const router = express.Router();
const { getAllAnalyses, getAnalysisById, deleteAnalysis } = require('../db');

router.get('/', (req, res) => {
  try {
    const analyses = getAllAnalyses();
    return res.json(analyses);
  } catch (err) {
    console.error('History fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const analysis = getAnalysisById(Number(req.params.id));
    if (!analysis) return res.status(404).json({ error: 'Analysis not found.' });
    return res.json(analysis);
  } catch (err) {
    console.error('History fetch by id error:', err);
    return res.status(500).json({ error: 'Failed to fetch analysis.' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteAnalysis(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Analysis not found.' });
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ error: 'Failed to delete analysis.' });
  }
});

module.exports = router;
