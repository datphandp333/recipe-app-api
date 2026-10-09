import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewItems, confirmedItems, scanChefPrompt, scanRequestError } from '../services/ingredientScan.js';
test('native cancellation distinguishes timeout, user cancellation and network failure', () => {
  const failure = new Error('fetch failed: FetchRequestCanceledException: Fetch request has been canceled');
  assert.match(scanRequestError(failure, { timedOut: true, aborted: true }).message, /timed out/);
  assert.match(scanRequestError(failure, { aborted: true }).message, /Request canceled/);
  assert.match(scanRequestError(failure).message, /same Wi-Fi/);
  const serverError = new Error('Photo analysis is temporarily unavailable.');
  assert.equal(scanRequestError(serverError), serverError);
});
test('AI suggestions require user-entered quantities before pantry saving', () => {
  const items = reviewItems([{ name: 'Tomato', quantity: 99, uncertain: false }]);
  assert.equal(items[0].quantity, '');
  assert.throws(() => confirmedItems(items), /quantity/);
  items[0].quantity = '2';
  assert.deepEqual(confirmedItems(items), [{ id: '0', name: 'Tomato', quantity: '2', unit: 'items', expiresOn: null }]);
});
test('saved and ambiguous-save rows are excluded from further submissions', () => {
  const items = reviewItems([{ name: 'Tomato' }, { name: 'Onion' }, { name: 'Rice' }]).map(item => ({ ...item, quantity: '1' }));
  items[0].status = 'saved'; items[1].status = 'check';
  assert.deepEqual(confirmedItems(items).map(item => item.name), ['Rice']);
  items[2].selected = false; assert.throws(() => confirmedItems(items), /Select/);
});
test('quantities are bounded and Chef receives selected reviewed names only', () => {
  const items = reviewItems([{ name: 'Onion' }, { name: 'Rice' }]); items[1].selected = false;
  for (const quantity of ['-1', '0', 'NaN', '1.1234', '1000000000']) { items[0].quantity = quantity; assert.throws(() => confirmedItems(items)); }
  items[0].quantity = '';
  assert.match(scanChefPrompt(items), /Onion/); assert.ok(!scanChefPrompt(items).includes('Rice'));
});
