const Database = require('better-sqlite3');
const path = require('path');
const { randomUUID } = require('crypto');

// VALIDATA_DB_PATH=":memory:" is used by the test suite.
const DB_PATH = process.env.VALIDATA_DB_PATH || path.join(__dirname, '..', 'validata.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const FREE_LIMIT = Number(process.env.DAILY_FREE_LIMIT) || 5;

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_title TEXT NOT NULL,
      idea_description TEXT NOT NULL,
      target_audience TEXT,
      industry TEXT,
      report JSON NOT NULL,
      viability_score INTEGER NOT NULL,
      share_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      date TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      UNIQUE(client_id, date)
    );

    CREATE TABLE IF NOT EXISTS comparisons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_a_id INTEGER REFERENCES analyses(id) ON DELETE CASCADE,
      analysis_b_id INTEGER REFERENCES analyses(id) ON DELETE CASCADE,
      winner TEXT,
      comparison_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for databases created by older versions.
  // SQLite does not allow UNIQUE constraints in ALTER TABLE ADD COLUMN,
  // so columns are added plain and indexed separately.
  const columns = db.prepare(`PRAGMA table_info(analyses)`).all().map(c => c.name);
  if (!columns.includes('share_id')) db.exec(`ALTER TABLE analyses ADD COLUMN share_id TEXT`);
  if (!columns.includes('client_id')) db.exec(`ALTER TABLE analyses ADD COLUMN client_id TEXT`);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_analyses_share_id ON analyses(share_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_analyses_client_id ON analyses(client_id, created_at)`);
}

// ─── Analyses ────────────────────────────────────────────────────────────────
// Every analysis belongs to the browser (client_id) that created it. History
// reads and deletes are scoped to that owner; public access is only through
// the unguessable share_id.

function saveAnalysis({ client_id, idea_title, idea_description, target_audience, industry, report, viability_score }) {
  const share_id = randomUUID();
  const result = db.prepare(`
    INSERT INTO analyses (client_id, idea_title, idea_description, target_audience, industry, report, viability_score, share_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    client_id,
    idea_title,
    idea_description,
    target_audience || null,
    industry || null,
    JSON.stringify(report),
    viability_score,
    share_id
  );
  return { id: Number(result.lastInsertRowid), share_id };
}

function getAnalysesForClient(client_id) {
  return db.prepare(`
    SELECT id, idea_title, industry, viability_score, share_id, created_at,
           json_extract(report, '$.verdict') as verdict
    FROM analyses
    WHERE client_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(client_id);
}

function parseRow(row) {
  if (!row) return null;
  const { client_id, ...rest } = row;
  return { ...rest, report: JSON.parse(row.report) };
}

function getAnalysisForClient(id, client_id) {
  return parseRow(db.prepare(`SELECT * FROM analyses WHERE id = ? AND client_id = ?`).get(id, client_id));
}

function getAnalysisByShareId(share_id) {
  return parseRow(db.prepare(`SELECT * FROM analyses WHERE share_id = ?`).get(share_id));
}

function deleteAnalysisForClient(id, client_id) {
  return db.prepare(`DELETE FROM analyses WHERE id = ? AND client_id = ?`).run(id, client_id).changes > 0;
}

// ─── Usage Tracking ──────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0];
}

function getUsageInfo(client_id) {
  const row = db.prepare(`SELECT count FROM usage_tracking WHERE client_id = ? AND date = ?`).get(client_id, today());
  const used = row?.count || 0;
  return { used, remaining: Math.max(0, FREE_LIMIT - used), limit: FREE_LIMIT };
}

// Atomically reserve `amount` validations. Returns { allowed, remaining }.
const reserveUsage = db.transaction((client_id, amount = 1) => {
  const { used } = getUsageInfo(client_id);
  if (used + amount > FREE_LIMIT) {
    return { allowed: false, remaining: Math.max(0, FREE_LIMIT - used) };
  }
  db.prepare(`
    INSERT INTO usage_tracking (client_id, date, count) VALUES (?, ?, ?)
    ON CONFLICT(client_id, date) DO UPDATE SET count = count + excluded.count
  `).run(client_id, today(), amount);
  return { allowed: true, remaining: FREE_LIMIT - used - amount };
});

// Give back reserved validations when the AI call fails, so errors don't burn quota.
function releaseUsage(client_id, amount = 1) {
  db.prepare(`
    UPDATE usage_tracking SET count = MAX(0, count - ?) WHERE client_id = ? AND date = ?
  `).run(amount, client_id, today());
}

// ─── Comparisons ─────────────────────────────────────────────────────────────
function saveComparison({ analysis_a_id, analysis_b_id, winner, comparison_summary }) {
  return Number(db.prepare(`
    INSERT INTO comparisons (analysis_a_id, analysis_b_id, winner, comparison_summary)
    VALUES (?, ?, ?, ?)
  `).run(analysis_a_id, analysis_b_id, winner, comparison_summary).lastInsertRowid);
}

module.exports = {
  db,
  FREE_LIMIT,
  initDb,
  saveAnalysis, getAnalysesForClient, getAnalysisForClient, getAnalysisByShareId, deleteAnalysisForClient,
  getUsageInfo, reserveUsage, releaseUsage,
  saveComparison,
};
