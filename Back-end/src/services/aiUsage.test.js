import test from 'node:test';
import assert from 'node:assert/strict';
import { recordAIUsage, withAIUsage } from './aiUsage.js';

test('cost metrics include billable thinking tokens without logging content or abort objects', t => {
  const logger = t.mock.method(console, 'info', () => {});
  withAIUsage({ feature: 'chat', requestId: 'request', signal: new AbortController().signal, prompt: 'private' }, () => {
    recordAIUsage('model', { promptTokenCount: 1000, candidatesTokenCount: 100, thoughtsTokenCount: 50 }, { AI_INPUT_USD_PER_MILLION: '1', AI_OUTPUT_USD_PER_MILLION: '2' });
  });
  const metric = JSON.parse(logger.mock.calls[0].arguments[0]);
  assert.equal(metric.inputTokens, 1000); assert.equal(metric.outputTokens, 150);
  assert.equal(metric.estimatedCostUSD, 0.0013); assert.equal(metric.feature, 'chat');
  assert.equal(metric.prompt, undefined); assert.equal(metric.signal, undefined);
});
test('missing usage metadata or configured prices never invent a zero cost', t => {
  const logger = t.mock.method(console, 'info', () => {});
  recordAIUsage('model', undefined, { AI_INPUT_USD_PER_MILLION: '1', AI_OUTPUT_USD_PER_MILLION: '2' });
  const metric = JSON.parse(logger.mock.calls[0].arguments[0]);
  assert.equal(metric.estimatedCostUSD, null); assert.equal(metric.inputTokens, null);
});
