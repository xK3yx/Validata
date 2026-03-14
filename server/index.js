require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Validate required environment variables before anything else
const REQUIRED_ENV = ['GROQ_API_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Create a .env file at the project root with these keys.\n');
  process.exit(1);
}

if (!process.env.SERPER_API_KEY) {
  console.warn('⚠️  SERPER_API_KEY not set — competitor lookup will be unavailable.');
}

const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const validateRouter = require('./routes/validate');
const historyRouter = require('./routes/history');
const compareRouter = require('./routes/compare');
const competitorRouter = require('./routes/competitor');
const chatRouter = require('./routes/chat');
const shareRouter = require('./routes/share');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Health check — useful for debugging proxy/server connectivity
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/validate', validateRouter);
app.use('/api/history', historyRouter);
app.use('/api/compare', compareRouter);
app.use('/api/competitor', competitorRouter);
app.use('/api/chat', chatRouter);
app.use('/api/share', shareRouter);

// 404 fallback for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

initDb();

const server = app.listen(PORT, () => {
  console.log(`✅ Validata server running on http://localhost:${PORT}`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error('   Kill the existing process or change PORT in .env and restart.\n');
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
