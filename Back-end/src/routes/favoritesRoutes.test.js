import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { PgDialect } from 'drizzle-orm/pg-core';
import { createFavoritesRouter } from './favoritesRoutes.js';

test('favorites authenticate every operation and isolate account ownership', async () => {
  let filter, saved, rows = [], calls = 0;
  const query = {
    from() { return this; },
    where(value) { filter = new PgDialect().sqlToQuery(value); return this; },
    then(resolve, reject) { return Promise.resolve(rows).then(resolve, reject); },
    values(value) { saved = value; return this; },
    set(value) { saved = value; return this; },
    returning() { return Promise.resolve([{ recipeId: 'recipe' }]); },
  };
  const db = Object.fromEntries(['select', 'insert', 'update', 'delete'].map(method => [method, () => { calls++; return query; }]));
  const app = express();
  app.use(express.json());
  app.use('/api/favorites', createFavoritesRouter({ db, env: { CLERK_SECRET_KEY: 'test' }, verifySession: async token => {
    if (token !== 'valid') throw new Error('Invalid');
    return { sub: 'user-a', sid: 'session-a' };
  } }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const request = (method, path, token = 'valid', body) => fetch(`http://127.0.0.1:${server.address().port}/api/favorites${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  try {
    for (const [method, path] of [['GET', '/user-a'], ['POST', ''], ['PUT', '/user-a/recipe'], ['DELETE', '/user-a/recipe']]) {
      for (const token of ['', 'invalid']) assert.equal((await request(method, path, token)).status, 401);
    }
    for (const [method, path] of [['GET', '/user-b'], ['PUT', '/user-b/recipe'], ['DELETE', '/user-b/recipe']]) {
      assert.equal((await request(method, path)).status, 403);
    }
    assert.equal(calls, 0);
    assert.equal((await request('POST', '', 'valid', { userId: 'user-b', recipeId: 'recipe', title: 'Soup' })).status, 201);
    assert.equal(saved.userId, 'user-a');
    assert.deepEqual(filter.params, ['user-a', 'recipe']);
    assert.equal((await request('GET', '/user-a')).status, 200);
    assert.deepEqual(filter.params, ['user-a']);
    assert.equal((await request('PUT', '/user-a/recipe', 'valid', { userId: 'user-b', title: 'Updated' })).status, 200);
    assert.equal(saved.userId, undefined);
    assert.deepEqual(filter.params, ['user-a', 'recipe']);
    assert.equal((await request('DELETE', '/user-a/recipe')).status, 200);
    assert.deepEqual(filter.params, ['user-a', 'recipe']);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
