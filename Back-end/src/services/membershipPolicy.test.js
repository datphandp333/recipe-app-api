import test from 'node:test';
import assert from 'node:assert/strict';
import { BETA_LIMITS, monthlyWindow, membershipPeriod, meteredFeatures } from './membershipPolicy.js';

test('free beta has renewing allowances and no lifetime starter period', () => {
  assert.deepEqual(BETA_LIMITS, { chat: 20, recipes: 5, scans: 2, plans: 1 });
  const result = membershipPeriod({ createdAt: '2026-01-15T12:00:00Z' }, new Date('2026-03-15T12:00:00Z'));
  assert.equal(result.plan, 'beta');
  assert.equal(result.period, '2026-03-15T12:00:00.000Z');
  assert.equal(result.resetsAt, '2026-04-15T12:00:00.000Z');
});
test('UTC anniversaries clamp short months without drifting the original day', () => {
  const anchor = '2024-01-31T23:30:05.100Z';
  const february = monthlyWindow(anchor, new Date('2024-02-29T23:30:05.100Z'));
  assert.equal(february.start.toISOString(), '2024-02-29T23:30:05.100Z');
  assert.equal(february.end.toISOString(), '2024-03-31T23:30:05.100Z');
  const before = monthlyWindow(anchor, new Date('2024-02-29T23:30:05.099Z'));
  assert.equal(before.start.toISOString(), '2024-01-31T23:30:05.100Z');
  assert.equal(monthlyWindow(anchor, new Date('2025-02-28T23:30:05.100Z')).end.toISOString(), '2025-03-31T23:30:05.100Z');
});
test('month and year boundaries preserve UTC time and validate anchors', () => {
  assert.equal(monthlyWindow('2025-12-15T03:00:00Z', new Date('2026-01-01T00:00:00Z')).end.toISOString(), '2026-01-15T03:00:00.000Z');
  assert.throws(() => monthlyWindow('invalid'));
  assert.throws(() => monthlyWindow('2099-01-01', new Date('2026-01-01')));
});
test('finalization reserves both possible outcomes, generation reserves a recipe', () => {
  for (const path of ['/chat', '/chat/', '/CHAT']) assert.deepEqual(meteredFeatures({ path, body: { finalize: true } }), ['chat', 'recipes']);
  assert.deepEqual(meteredFeatures({ path: '/chat', body: { finalize: 'true' } }), ['chat']);
  for (const path of ['/generate', '/second-serving']) assert.deepEqual(meteredFeatures({ path }), ['recipes']);
});
