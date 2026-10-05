import test from 'node:test';
import assert from 'node:assert/strict';
import { expiryInfo, pantryList, cookbookList } from '../services/kitchenLists.js';
const today = new Date(2026, 8, 30, 23, 30);
test('calendar date filters separate past dates, today, upcoming and undated items', () => {
  assert.equal(expiryInfo('2026-09-29', today).group, 'past');
  assert.equal(expiryInfo('2026-09-30', today).label, 'Date is today');
  assert.equal(expiryInfo('2026-10-03', today).group, 'soon');
  assert.equal(expiryInfo('2026-10-04', today).group, 'later');
  assert.equal(expiryInfo(null, today).group, 'undated');
  assert.equal(expiryInfo('bad', today).group, 'undated');
});
test('pantry search and filters combine without changing the source inventory', () => {
  const items = [{ name: 'Rice', expiresOn: null }, { name: 'Crème', expiresOn: '2026-10-01' }, { name: 'Milk', expiresOn: '2026-09-29' }];
  assert.deepEqual(pantryList(items, '', 'all', today).map(x => x.name), ['Milk', 'Crème', 'Rice']);
  assert.deepEqual(pantryList(items, 'creme', 'soon', today).map(x => x.name), ['Crème']);
  assert.equal(pantryList(items, 'rice', 'soon', today).length, 0);
  assert.equal(items[0].name, 'Rice');
});
test('cookbook searches mixed ingredient formats and notes, then sorts saved dates', () => {
  const items = [{ id: 1, title: 'Zesty soup', ingredients: ['Lentils'], createdAt: '2026-09-29' },
    { id: 2, title: 'Apple bowl', ingredients: [{ name: 'Crème' }], personalNote: 'Sunday favorite', createdAt: '2026-09-30' }];
  assert.equal(cookbookList(items, 'lentil', 'recent')[0].id, 1);
  assert.equal(cookbookList(items, 'creme', 'recent')[0].id, 2);
  assert.equal(cookbookList(items, 'sunday', 'recent')[0].id, 2);
  assert.deepEqual(cookbookList(items, '', 'recent').map(x => x.id), [2, 1]);
  assert.deepEqual(cookbookList(items, '', 'az').map(x => x.id), [2, 1]);
  assert.equal(items[0].id, 1);
});
