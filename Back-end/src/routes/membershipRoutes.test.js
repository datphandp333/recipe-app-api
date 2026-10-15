import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { sessionAuth } from '../middleware/sessionAuth.js';
import { createMembershipRouter } from './membershipRoutes.js';

test('beta status requires a session and only loads the verified account', async t => {
  const seen = [];
  const app = express();
  const authenticate = sessionAuth({ env: { CLERK_SECRET_KEY: 'test' }, verifySession: async token => {
    if (!['alice', 'bob'].includes(token)) throw new Error('Invalid');
    return { sub: token, sid: 'session' };
  } });
  app.use('/api/membership', createMembershipRouter({ enabled: true, authenticate, service: { status: async userId => {
    seen.push(userId); return { plan: 'beta', purchasesEnabled: false, allowances: { chat: { remaining: userId === 'alice' ? 20 : 10 } } };
  } } }));
  app.use('/api/testing-membership', createMembershipRouter({ enabled: false, authenticate, service: { status: () => assert.fail('Testing must not load beta usage') } }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}/api/membership`;
  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(url, { headers: { Authorization: 'Bearer invalid' } })).status, 401);
  for (const [user, remaining] of [['alice', 20], ['bob', 10]]) {
    const response = await fetch(`${url}?userId=someone-else`, { headers: { Authorization: `Bearer ${user}` } });
    const body = await response.json(); assert.equal(body.plan, 'beta'); assert.equal(body.purchasesEnabled, false);
    assert.equal(body.allowances.chat.remaining, remaining);
  }
  assert.deepEqual(seen, ['alice', 'bob']);
  const testing = await fetch(url.replace('/membership', '/testing-membership'), { headers: { Authorization: 'Bearer alice' } });
  const disabled = await testing.json();
  assert.equal(disabled.plan, 'testing'); assert.equal(disabled.allowancesEnabled, false); assert.equal(disabled.allowances, null);
});
