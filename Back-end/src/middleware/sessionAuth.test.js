import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionAuth } from './sessionAuth.js';
function res() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } }; }
test('requires a configured server and valid Clerk session, ignoring claimed user IDs', async () => {
  const cases = [
    [{ headers: {} }, { CLERK_SECRET_KEY: 'test' }, 401],
    [{ headers: { authorization: 'Bearer valid' } }, {}, 503],
    [{ headers: { authorization: 'Bearer bad' } }, { CLERK_SECRET_KEY: 'test' }, 401],
  ];
  for (const [req, env, status] of cases) {
    const response = res(); await sessionAuth({ env, verifySession: async () => { throw new Error('Invalid'); } })(req, response, () => assert.fail());
    assert.equal(response.statusCode, status);
  }
  const req = { headers: { authorization: 'Bearer valid' }, body: { userId: 'other' } };
  let called = false;
  await sessionAuth({ env: { CLERK_SECRET_KEY: 'test', CLERK_AUTHORIZED_PARTIES: 'http://one, http://two' }, verifySession: async (token, options) => {
    assert.equal(token, 'valid'); assert.deepEqual(options.authorizedParties, ['http://one', 'http://two']); return { sub: 'verified', sid: 'session' };
  } })(req, res(), () => { called = true; });
  assert.equal(called, true); assert.equal(req.userId, 'verified'); assert.equal(req.pantryUserId, 'verified');
});
test('non-session JWTs cannot access metered AI', async () => {
  for (const payload of [{ sub: 'user' }, { sid: 'session' }]) {
    const response = res();
    await sessionAuth({ env: { CLERK_JWT_KEY: 'key' }, verifySession: async () => payload })({ headers: { authorization: 'Bearer valid' } }, response, () => assert.fail());
    assert.equal(response.statusCode, 401);
  }
});
