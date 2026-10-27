import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createBetaClient, isMeteredPath } from '../services/betaClient.js';
const url = 'http://localhost:5001/api/ai/recipes/chat';
const options = { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'Make a soup' }] }) };
const response = (body = {}, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function setup(fetchImpl) {
  let id = 0;
  const client = createBetaClient({ fetchImpl, randomId: () => `request-${++id}`, hashBody: async body => createHash('sha256').update(body).digest('hex') });
  client.bind({ userId: 'alice', getToken: async () => 'alice-token' });
  return client;
}
test('all metered routes are covered; reads and image lookups stay free', () => {
  for (const path of ['/ai/recipes/chat', '/ai/recipes/generate', '/ai/recipes/second-serving', '/pantry/scan', '/pantry/meal-plans/drafts']) assert.equal(isMeteredPath(`http://api/api${path}`), true);
  assert.equal(isMeteredPath('http://api/api/images/dish'), false);
  assert.equal(isMeteredPath('http://api/api/pantry'), false);
});
test('lost responses reuse the ID; successful new actions get new identifiers', async () => {
  const ids = []; let calls = 0;
  const client = setup(async (url, request) => {
    ids.push(request.headers.get('X-Request-Id'));
    assert.equal(request.headers.get('Authorization'), 'Bearer alice-token');
    if (++calls === 1) throw new TypeError('Network lost');
    return response({ reply: 'Soup' });
  });
  await assert.rejects(client.fetch(url, options));
  await client.fetch(url, options);
  await client.fetch(url, options);
  assert.equal(ids[0], ids[1]); assert.notEqual(ids[1], ids[2]);
});
test('uncertain settlement and pending calls preserve IDs; explicit failed requests release them', async () => {
  const ids = []; let count = 0;
  const client = setup(async (_, req) => {
    ids.push(req.headers.get('X-Request-Id'));
    const statuses = [[503, 'allowance_unavailable'], [409, 'request_pending'], [409, 'request_released'], [200, null]];
    const [status, code] = statuses[count++]; return response({ code }, status);
  });
  for (let i = 0; i < 4; i++) await client.fetch(url, options);
  assert.equal(ids[0], ids[1]); assert.equal(ids[1], ids[2]); assert.notEqual(ids[2], ids[3]);
});
test('quota errors notify without altering drafts or requiring payment', async () => {
  const notices = [];
  const client = setup(async () => response({ code: 'quota_exceeded', feature: 'chat', resetsAt: '2026-11-14' }, 403));
  client.bind({ userId: 'alice', getToken: async () => 'token', onQuota: data => notices.push(data) });
  const original = options.body;
  const result = await client.fetch(url, options);
  assert.equal(result.status, 403); assert.equal(options.body, original); assert.equal(notices[0].feature, 'chat');
});
test('sign-out and account changes reject stale results and prevent cross-account reuse', async () => {
  let release; const ids = []; let first = true;
  const client = setup(async (_, req) => {
    ids.push(req.headers.get('X-Request-Id'));
    if (first) { first = false; await new Promise(resolve => { release = resolve; }); }
    return response();
  });
  const pending = client.fetch(url, options);
  while (!release) await new Promise(resolve => setTimeout(resolve, 0));
  client.bind({ userId: 'bob', getToken: async () => 'bob-token' });
  release(); await assert.rejects(pending, /session changed/);
  await client.fetch(url, options); assert.notEqual(ids[0], ids[1]);
  client.bind(null); await assert.rejects(client.fetch(url, options), /Sign in/);
});
test('ordinary browsing requests do not require a session or consume an identifier', async () => {
  const client = setup(async (_, req) => { assert.equal(req.headers, undefined); return response(); });
  client.bind(null); assert.equal((await client.fetch('http://api/api/images/dish', options)).status, 200);
});
test('favorites attach session identity without metering and block signed-out calls', async () => {
  let calls = 0;
  const client = setup(async (url, options) => {
    calls++;
    assert.equal(options.headers.get('Authorization'), 'Bearer alice-token');
    assert.equal(options.headers.get('X-Request-Id'), null);
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    return response();
  });
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) await client.fetch('https://api.example/api/favorites/alice/recipe', { method, headers: { 'Content-Type': 'application/json' } });
  client.bind(null);
  await assert.rejects(client.fetch('https://api.example/api/favorites/alice'), /Sign in/);
  assert.equal(calls, 4);
});
test('favorites discard responses after account changes', async () => {
  let finish;
  const client = setup(() => new Promise(resolve => { finish = resolve; }));
  const pending = client.fetch('https://api.example/api/favorites/alice');
  await new Promise(resolve => setImmediate(resolve));
  client.bind(null);
  finish(response());
  await assert.rejects(pending, /session changed/);
});
