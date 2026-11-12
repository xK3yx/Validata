const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, calls, IDEA, clientId } = require('./helpers');

beforeEach(() => { calls.fail = false; });

const validate = (client, idea = IDEA) =>
  request(app).post('/api/validate').set('X-Client-ID', client).send(idea);

test('health check responds', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('validation requires a client id', async () => {
  const res = await request(app).post('/api/validate').send(IDEA);
  assert.equal(res.status, 400);
});

test('validation rejects incomplete ideas', async () => {
  const res = await validate(clientId('short'), { idea_title: 'x', idea_description: 'too short' });
  assert.equal(res.status, 400);
});

test('validate returns a report with a verdict derived from the score', async () => {
  const res = await validate(clientId('happy'));
  assert.equal(res.status, 200);
  assert.equal(res.body.viability_score, 72);
  assert.equal(res.body.report.verdict, 'Promising');
  assert.ok(res.body.share_id);
});

test('history is private to the browser that created it', async () => {
  const alice = clientId('alice');
  const bob = clientId('bob');
  const { body } = await validate(alice);

  const aliceList = await request(app).get('/api/history').set('X-Client-ID', alice);
  assert.deepEqual(aliceList.body.map(a => a.id), [body.id]);

  const bobList = await request(app).get('/api/history').set('X-Client-ID', bob);
  assert.deepEqual(bobList.body, []);

  const bobGet = await request(app).get(`/api/history/${body.id}`).set('X-Client-ID', bob);
  assert.equal(bobGet.status, 404);

  const bobDelete = await request(app).delete(`/api/history/${body.id}`).set('X-Client-ID', bob);
  assert.equal(bobDelete.status, 404);

  const aliceGet = await request(app).get(`/api/history/${body.id}`).set('X-Client-ID', alice);
  assert.equal(aliceGet.status, 200);
  assert.equal(aliceGet.body.client_id, undefined, 'client id must not leak');
});

test('history without a client id is rejected', async () => {
  const res = await request(app).get('/api/history');
  assert.equal(res.status, 400);
});

test('share links are public but do not expose the owner', async () => {
  const { body } = await validate(clientId('sharer'));
  const res = await request(app).get(`/api/share/${body.share_id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.idea_title, IDEA.idea_title);
  assert.equal(res.body.client_id, undefined);
});

test('daily limit is enforced and failed AI calls do not use quota', async () => {
  const client = clientId('limit');
  calls.fail = true;
  const failed = await validate(client);
  assert.equal(failed.status, 502);
  calls.fail = false;

  for (let i = 0; i < 5; i++) assert.equal((await validate(client)).status, 200);
  const blocked = await validate(client);
  assert.equal(blocked.status, 429);
  assert.doesNotMatch(blocked.body.error, /upgrade|pro/i);
});

test('compare uses two validations and picks a winner', async () => {
  const client = clientId('compare');
  const res = await request(app).post('/api/compare').set('X-Client-ID', client).send({
    idea_a: IDEA,
    idea_b: { ...IDEA, idea_title: 'A weak idea' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.winner, 'A');
  assert.equal(res.body.remaining, 3);
});

test('chat validates its input', async () => {
  const bad = await request(app).post('/api/chat').send({ messages: [], report: {}, idea_title: 'x' });
  assert.equal(bad.status, 400);
  const ok = await request(app).post('/api/chat').send({
    messages: [{ role: 'user', content: 'What first?' }], report: { viability_score: 70 }, idea_title: 'x',
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.reply, 'Focus on distribution first.');
});

test('competitor lookup reports when Serper is not configured', async () => {
  const res = await request(app).get('/api/competitor?name=Notion');
  assert.equal(res.status, 503);
});

test('malformed JSON bodies return 400', async () => {
  const res = await request(app).post('/api/validate')
    .set('X-Client-ID', clientId('json')).set('Content-Type', 'application/json').send('{bad');
  assert.equal(res.status, 400);
});
