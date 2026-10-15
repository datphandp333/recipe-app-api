import test from 'node:test';
import assert from 'node:assert/strict';
import { betaLimitsEnabled } from './betaConfig.js';
import { meterAI } from '../middleware/meterAI.js';
import { EventEmitter } from 'node:events';

test('development testing has no beta limits; enabling limits is explicit', () => {
  assert.equal(betaLimitsEnabled({ NODE_ENV: 'development' }), false);
  assert.equal(betaLimitsEnabled({ NODE_ENV: 'production' }), true);
  assert.equal(betaLimitsEnabled({ BETA_LIMITS_ENABLED: 'false', NODE_ENV: 'development' }), false);
  assert.equal(betaLimitsEnabled({ BETA_LIMITS_ENABLED: 'true' }), true);
});
test('testing skips reservations and database failures but still requires identity', async () => {
  const res = new EventEmitter(); let called = false;
  await meterAI({ reserve: () => assert.fail('Testing must not reserve') }, () => ['plans'], { enabled: false })(
    { userId: 'verified', headers: {} }, res, () => { called = true; });
  assert.equal(called, true);
  const denied = { status(code) { assert.equal(code, 401); return this; }, json() {} };
  await meterAI({}, undefined, { enabled: false })({ headers: {} }, denied, () => assert.fail());
});
