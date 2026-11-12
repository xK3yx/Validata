require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

if (!process.env.GROQ_API_KEY) {
  console.error('\nMissing required environment variable: GROQ_API_KEY');
  console.error('Copy .env.example to .env at the project root and add your key.\n');
  process.exit(1);
}
if (!process.env.SERPER_API_KEY) {
  console.warn('SERPER_API_KEY not set: reports will not be grounded in web results and competitor lookup is disabled.');
}

const { initDb } = require('./db');
const { createApp } = require('./app');
const { MODEL } = require('./groq');

initDb();

const PORT = process.env.PORT || 3001;
const server = createApp().listen(PORT, () => {
  console.log(`Validata server running on http://localhost:${PORT} (model: ${MODEL})`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Stop the other process or change PORT in .env.\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  console.error('Unhandled promise rejection:', reason);
});
