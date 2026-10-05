import test from 'node:test';
import assert from 'node:assert/strict';
import { backOrReplace } from '../services/navigation.js';

test('uses back when navigator history exists', () => {
  const calls = [];
  backOrReplace({ canGoBack: () => true, back: () => calls.push('back'), replace: () => calls.push('replace') });
  assert.deepEqual(calls, ['back']);
});
test('direct recipe links return home without dispatching GO_BACK', () => {
  const calls = [];
  backOrReplace({ canGoBack: () => false, back: () => assert.fail('No history'), replace: route => calls.push(route) });
  assert.deepEqual(calls, ['/(taps)']);
});
test('saved recipe screens fall back to the cookbook', () => {
  const calls = [];
  backOrReplace({ canGoBack: () => false, back: () => assert.fail('No history'), replace: route => calls.push(route) }, '/(taps)/favorites');
  assert.deepEqual(calls, ['/(taps)/favorites']);
});
