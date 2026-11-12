const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const validateRouter = require('./routes/validate');
const historyRouter = require('./routes/history');
const compareRouter = require('./routes/compare');
const competitorRouter = require('./routes/competitor');
const chatRouter = require('./routes/chat');
const shareRouter = require('./routes/share');

function createApp() {
  const app = express();

  // Behind a reverse proxy (Render, Railway, nginx) set TRUST_PROXY=1 so
  // rate limiting sees the real client IP.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

  app.use(helmet());
  app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()) }));
  app.use(express.json({ limit: '200kb' }));

  // The per-browser daily limit can be reset by clearing localStorage, so AI
  // endpoints also get a per-IP ceiling to protect the Groq and Serper quota.
  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests from this network. Please try again in an hour.' },
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

  // Only the POST runs the AI. GET /api/validate/usage is polled on every
  // page change and must not use up the hourly AI allowance.
  app.post('/api/validate', aiLimiter);
  app.use('/api/validate', validateRouter);
  app.use('/api/compare', aiLimiter, compareRouter);
  app.use('/api/chat', aiLimiter, chatRouter);
  app.use('/api/competitor', aiLimiter, competitorRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/share', shareRouter);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

  // Malformed JSON bodies and anything unexpected end up here.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large.' });
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}

module.exports = { createApp };
