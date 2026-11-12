const express = require('express');
const { getAnalysesForClient, getAnalysisForClient, deleteAnalysisForClient } = require('../db');
const { requireClientId } = require('../middleware/client');

const router = express.Router();
router.use(requireClientId);

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// History only ever returns analyses created by the requesting browser.
router.get('/', (req, res) => {
  res.json(getAnalysesForClient(req.clientId));
});

router.get('/:id', (req, res) => {
  const id = parseId(req.params.id);
  const analysis = id && getAnalysisForClient(id, req.clientId);
  if (!analysis) return res.status(404).json({ error: 'Analysis not found.' });
  res.json(analysis);
});

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id || !deleteAnalysisForClient(id, req.clientId)) {
    return res.status(404).json({ error: 'Analysis not found.' });
  }
  res.json({ success: true });
});

module.exports = router;
