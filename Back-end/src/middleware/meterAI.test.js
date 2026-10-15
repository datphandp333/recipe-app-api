import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { meterAI as makeMeterAI } from './meterAI.js';
const meterAI = (service, features) => makeMeterAI(service, features, { enabled: true });
import { aiRequestSignal } from '../services/aiUsage.js';

function response() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.status = code => { res.statusCode = code; return res; };
  res.delivered = new Promise(resolve => { res.json = body => { res.body = body; resolve(body); return res; }; });
  return res;
}
const request = (changes = {}) => ({ headers: { 'x-request-id': 'test-request-id-1234' }, userId: 'clerk-user', path: '/chat', originalUrl: '/api/ai/recipes/chat', body: { finalize: false }, ...changes });

test('missing auth or request IDs never start AI calls', async () => {
  const handler = meterAI({ reserve: () => assert.fail('Should not reserve') });
  for (const [req, status] of [[request({ headers: {} }), 400], [request({ userId: null }), 401]]) {
    const res = response(); await handler(req, res, () => assert.fail()); assert.equal(res.statusCode, status);
  }
});
test('quota errors are structured, database failures fail closed, receipts bypass AI', async () => {
  for (const [reserve, status, code] of [
    [async () => ({ kind: 'quota', feature: 'chat', resetsAt: '2026-11-14' }), 403, 'quota_exceeded'],
    [async () => { throw new Error('database offline'); }, 503, 'allowance_unavailable'],
    [async () => ({ kind: 'pending' }), 409, 'request_pending'],
  ]) {
    const res = response(); await meterAI({ reserve })(request(), res, () => assert.fail());
    assert.equal(res.statusCode, status); assert.equal(res.body.code, code);
  }
  const res = response();
  await meterAI({ reserve: async () => ({ kind: 'replay', status: 201, body: { recipe: 'cached' } }) })(request(), res, () => assert.fail());
  assert.equal(res.statusCode, 201); assert.equal(res.body.recipe, 'cached');
});
test('settlement happens before sending; clarification and recipes charge distinct counters', async () => {
  for (const [body, feature] of [[{ reply: 'Clarify' }, 'chat'], [{ suggestedRecipe: { title: 'Dish' } }, 'recipes']]) {
    const calls = []; const res = response();
    await meterAI({ reserve: async () => ({ kind: 'reserved' }), settle: async (...args) => { calls.push(args); return true; } })(
      request({ body: { finalize: true } }), res, () => res.json(body));
    await res.delivered;
    assert.equal(calls.length, 1); assert.equal(calls[0][2], feature); assert.equal(calls[0][0], 'clerk-user');
  }
});
test('failed responses release usage and a disconnect aborts upstream work', async () => {
  const calls = []; const res = response();
  const service = { reserve: async () => ({ kind: 'reserved' }), settle: async (...args) => { calls.push(args); return true; } };
  await meterAI(service)(request(), res, () => res.status(502).json({ message: 'failed' }));
  await res.delivered; assert.equal(calls[0][2], null);
  const disconnected = response(); let signal;
  await meterAI(service)(request(), disconnected, () => { signal = aiRequestSignal(); });
  disconnected.emit('close'); assert.equal(signal.aborted, true);
  assert.equal(calls[1][2], null);
});
test('unconfirmed settlement never returns an uncharged success', async () => {
  const res = response();
  await meterAI({ reserve: async () => ({ kind: 'reserved' }), settle: async () => false })(request(), res, () => res.json({ reply: 'late' }));
  await res.delivered; assert.equal(res.statusCode, 503); assert.equal(res.body.code, 'request_expired');
});

test('a disconnect while reserving never starts a provider request', async () => {
  const res = response(); const calls = [];
  const service = { reserve: async () => { res.destroyed = true; return { kind: 'reserved' }; }, settle: async (...args) => { calls.push(args); return true; } };
  await meterAI(service)(request(), res, () => assert.fail('Disconnected request must not start AI'));
  assert.equal(calls.length, 1); assert.equal(calls[0][2], null);
});
