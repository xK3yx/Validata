// Test setup: in-memory database and stubbed AI/search calls.
// Stubs must be installed before the routes are required, because the routes
// destructure these functions at load time.
process.env.VALIDATA_DB_PATH = ':memory:';
process.env.GROQ_API_KEY = 'test-key';
delete process.env.SERPER_API_KEY;

const groq = require('../groq');
const serper = require('../serper');

const calls = { analyze: 0, research: 0, fail: false };

function fakeReport(score = 72) {
  return groq.parseReport(JSON.stringify({
    viability_score: score,
    summary: 'A solid idea.',
    market_opportunity: { score: 7, analysis: 'Growing market [1].', market_size: '$1B', market_size_source: 1 },
    competition: { score: 6, analysis: 'Some players.', competitors: ['Acme'] },
    monetization: { strategies: [{ name: 'Subscription', description: 'Monthly plan' }] },
    risks: [{ title: 'Churn', severity: 'High', description: 'Users leave' }],
    mvp_features: [{ feature: 'Login', priority: 'Must Have' }],
    pivot_suggestions: [],
    dimension_scores: { innovation: 6, execution_feasibility: 7, monetization_potential: 6 },
  }), [{ id: 1, title: 'Source', url: 'https://example.com', snippet: 'x' }]);
}

groq.analyzeIdea = async idea => {
  calls.analyze++;
  if (calls.fail) throw new Error('groq down');
  return fakeReport(idea.idea_title.includes('weak') ? 30 : 72);
};
groq.chatAboutIdea = async () => 'Focus on distribution first.';
serper.researchIdea = async () => { calls.research++; return []; };

const { initDb } = require('../db');
const { createApp } = require('../app');
initDb();

const app = createApp();
const IDEA = {
  idea_title: 'Textbook marketplace',
  idea_description: 'A marketplace where university students buy and sell used textbooks on campus.',
  industry: 'EdTech',
};
const clientId = name => `test-client-${name}-0000000000`;

module.exports = { app, calls, IDEA, clientId, fakeReport };
