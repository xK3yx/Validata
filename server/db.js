const Database = require('better-sqlite3');
const path = require('path');
const { randomUUID } = require('crypto');

const db = new Database(path.join(__dirname, '..', 'validata.db'));

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

  // Migrate: add share_id column if it doesn't exist.
  // SQLite does NOT allow UNIQUE constraints in ALTER TABLE ADD COLUMN,
  // so we add the plain column first, then create the index separately.
  try { db.exec(`ALTER TABLE analyses ADD COLUMN share_id TEXT`); } catch (_) {}
  try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_analyses_share_id ON analyses(share_id)`); } catch (_) {}
}

// ─── Analyses ────────────────────────────────────────────────────────────────
function saveAnalysis({ idea_title, idea_description, target_audience, industry, report, viability_score }) {
  const share_id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO analyses (idea_title, idea_description, target_audience, industry, report, viability_score, share_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    idea_title,
    idea_description,
    target_audience || null,
    industry || null,
    JSON.stringify(report),
    viability_score,
    share_id
  );
  return { id: result.lastInsertRowid, share_id };
}

function getAllAnalyses() {
  return db.prepare(`
    SELECT id, idea_title, industry, viability_score, share_id, created_at,
           json_extract(report, '$.verdict') as verdict
    FROM analyses
    ORDER BY created_at DESC
  `).all();
}

function getAnalysisById(id) {
  const row = db.prepare(`SELECT * FROM analyses WHERE id = ?`).get(id);
  if (!row) return null;
  return { ...row, report: JSON.parse(row.report) };
}

function getAnalysisByShareId(share_id) {
  const row = db.prepare(`SELECT * FROM analyses WHERE share_id = ?`).get(share_id);
  if (!row) return null;
  return { ...row, report: JSON.parse(row.report) };
}

function deleteAnalysis(id) {
  const result = db.prepare(`DELETE FROM analyses WHERE id = ?`).run(id);
  return result.changes > 0;
}

// ─── Usage Tracking ──────────────────────────────────────────────────────────
const FREE_LIMIT = 5;

function checkAndIncrementUsage(clientId) {
  if (!clientId) return { allowed: true, remaining: FREE_LIMIT - 1, used: 1 };
  const today = new Date().toISOString().split('T')[0];

  const existing = db.prepare(
    `SELECT count FROM usage_tracking WHERE client_id = ? AND date = ?`
  ).get(clientId, today);

  if (existing && existing.count >= FREE_LIMIT) {
    return { allowed: false, remaining: 0, used: existing.count };
  }

  if (existing) {
    db.prepare(
      `UPDATE usage_tracking SET count = count + 1 WHERE client_id = ? AND date = ?`
    ).run(clientId, today);
    const used = existing.count + 1;
    return { allowed: true, remaining: FREE_LIMIT - used, used };
  } else {
    db.prepare(
      `INSERT INTO usage_tracking (client_id, date, count) VALUES (?, ?, 1)`
    ).run(clientId, today);
    return { allowed: true, remaining: FREE_LIMIT - 1, used: 1 };
  }
}

function getUsageInfo(clientId) {
  if (!clientId) return { used: 0, remaining: FREE_LIMIT, limit: FREE_LIMIT };
  const today = new Date().toISOString().split('T')[0];
  const row = db.prepare(
    `SELECT count FROM usage_tracking WHERE client_id = ? AND date = ?`
  ).get(clientId, today);
  const used = row?.count || 0;
  return { used, remaining: Math.max(0, FREE_LIMIT - used), limit: FREE_LIMIT };
}

// ─── Comparisons ─────────────────────────────────────────────────────────────
function saveComparison({ analysis_a_id, analysis_b_id, winner, comparison_summary }) {
  const result = db.prepare(`
    INSERT INTO comparisons (analysis_a_id, analysis_b_id, winner, comparison_summary)
    VALUES (?, ?, ?, ?)
  `).run(analysis_a_id, analysis_b_id, winner, comparison_summary);
  return result.lastInsertRowid;
}

module.exports = {
  initDb,
  saveAnalysis, getAllAnalyses, getAnalysisById, getAnalysisByShareId, deleteAnalysis,
  checkAndIncrementUsage, getUsageInfo,
  saveComparison,
};
