const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseReport, verdictFor, InvalidAIResponse } = require('../groq');

const base = {
  viability_score: '85',
  summary: 'Great.',
  market_opportunity: { score: 12, analysis: 'Big.', market_size: '$5B', market_size_source: 9 },
  competition: { score: 0, analysis: 'Few.', competitors: ['A'] },
  monetization: { strategies: [{ name: 'Ads', description: 'Ads' }] },
  risks: [{ title: 'R', severity: 'Critical', description: 'D' }],
  mvp_features: [{ feature: 'F', priority: 'Must Have' }],
  dimension_scores: { innovation: 5, execution_feasibility: 5, monetization_potential: 5 },
};

test('coerces and clamps numbers, derives the verdict', () => {
  const r = parseReport(JSON.stringify(base), []);
  assert.equal(r.viability_score, 85);
  assert.equal(r.verdict, 'Highly Promising');
  assert.equal(r.market_opportunity.score, 10);
  assert.equal(r.competition.score, 1);
  assert.equal(r.risks[0].severity, 'Medium', 'unknown severity falls back to Medium');
});

test('drops a market size citation that points at a missing source', () => {
  const r = parseReport(JSON.stringify(base), [{ id: 1, title: 't', url: 'u', snippet: 's' }]);
  assert.equal(r.market_opportunity.market_size_source, null);
  assert.equal(r.sources.length, 1);
});

test('strips code fences around JSON', () => {
  const r = parseReport('```json\n' + JSON.stringify(base) + '\n```', []);
  assert.equal(r.viability_score, 85);
});

test('rejects invalid JSON and incomplete reports so they are retried', () => {
  assert.throws(() => parseReport('not json', []), InvalidAIResponse);
  assert.throws(() => parseReport(JSON.stringify({ viability_score: 50 }), []), InvalidAIResponse);
});

test('verdict thresholds', () => {
  assert.equal(verdictFor(80), 'Highly Promising');
  assert.equal(verdictFor(60), 'Promising');
  assert.equal(verdictFor(40), 'Needs Refinement');
  assert.equal(verdictFor(39), 'Risky');
});
