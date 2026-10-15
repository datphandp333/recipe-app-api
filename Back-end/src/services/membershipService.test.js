import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { PgDialect } from 'drizzle-orm/pg-core';
import { createMembershipService } from './membershipService.js';

async function setup(t) {
  const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec(await readFile(new URL('../db/migrations/0007_beta_usage.sql', import.meta.url), 'utf8'));
  const dialect = new PgDialect();
  const db = { execute: statement => { const { sql, params } = dialect.sqlToQuery(statement); return pg.query(sql, params); } };
  let clock;
  return { pg, service: createMembershipService({ db, now: () => clock || new Date() }), setNow: value => { clock = value; } };
}
test('actual PostgreSQL reservations enforce all limits and isolate users', async t => {
  const { service } = await setup(t);
  for (const [feature, limit] of Object.entries({ chat: 20, recipes: 5, scans: 2, plans: 1 })) {
    const results = await Promise.all(Array.from({ length: limit + 2 }, (_, i) => service.reserve('alice', `${feature}-${i}`, `${feature}-${i}`, [feature])));
    assert.equal(results.filter(x => x.kind === 'reserved').length, limit);
    assert.equal(results.filter(x => x.kind === 'quota').length, 2);
    for (let i = 0; i < limit; i++) assert.equal(await service.settle('alice', `${feature}-${i}`, feature, { ok: true }, 200), true);
    assert.equal((await service.status('alice')).allowances[feature].remaining, 0);
    assert.equal((await service.reserve('bob', `bob-${feature}`, 'hash', [feature])).kind, 'reserved');
  }
});
test('receipts replay without charging twice; conflicting IDs never reuse another result', async t => {
  const { service } = await setup(t);
  assert.equal((await service.reserve('a', 'id', 'hash', ['recipes'])).kind, 'reserved');
  assert.equal((await service.reserve('a', 'id', 'hash', ['recipes'])).kind, 'pending');
  assert.equal(await service.settle('a', 'id', 'recipes', { recipe: 'dish' }, 200), true);
  assert.deepEqual((await service.reserve('a', 'id', 'hash', ['recipes'])).body, { recipe: 'dish' });
  assert.equal(await service.settle('a', 'id', 'recipes', {}, 200), false);
  assert.equal((await service.status('a')).allowances.recipes.used, 1);
  assert.equal((await service.reserve('a', 'id', 'changed', ['recipes'])).kind, 'conflict');
  assert.equal((await service.reserve('b', 'id', 'hash', ['recipes'])).kind, 'reserved');
});
test('failures and abandoned leases release reservations without consuming allowance', async t => {
  const { pg, service } = await setup(t);
  await service.reserve('a', 'failed', 'hash', ['scans']);
  assert.equal(await service.settle('a', 'failed', null, null, 502), true);
  assert.equal((await service.status('a')).allowances.scans.remaining, 2);
  assert.equal((await service.reserve('a', 'failed', 'hash', ['scans'])).kind, 'released');
  await service.reserve('a', 'expired', 'hash', ['scans']);
  await pg.exec("UPDATE membership_requests SET lease_until=now()-interval '1 second' WHERE request_id='expired'");
  assert.equal(await service.settle('a', 'expired', 'scans', {}, 200), false);
  assert.equal((await service.status('a')).allowances.scans.remaining, 2);
});
test('finalization charges exactly the returned outcome and rejects unreserved features', async t => {
  const { service } = await setup(t);
  await service.reserve('a', 'clarify', 'hash', ['chat', 'recipes']);
  await service.settle('a', 'clarify', 'chat', { reply: 'Which ingredient?' }, 200);
  await service.reserve('a', 'final', 'hash', ['chat', 'recipes']);
  await service.settle('a', 'final', 'recipes', { suggestedRecipe: {} }, 200);
  const status = await service.status('a');
  assert.equal(status.allowances.chat.used, 1);
  assert.equal(status.allowances.recipes.used, 1);
  await service.reserve('a', 'wrong', 'hash', ['chat']);
  await assert.rejects(service.settle('a', 'wrong', 'plans', {}, 200), /Unreserved/);
});
test('a new month restores limits and old receipts expire without permitting duplicate charges', async t => {
  const { pg, service, setNow } = await setup(t);
  await service.reserve('a', 'old', 'hash', ['plans']);
  await service.settle('a', 'old', 'plans', { plan: 'old' }, 201);
  const nextMonth = new Date((await service.status('a')).resetsAt);
  setNow(new Date(nextMonth.getTime() + 1000));
  await pg.exec("UPDATE membership_requests SET created_at=now()-interval '25 hours'");
  assert.equal((await service.status('a')).allowances.plans.remaining, 1);
  assert.equal((await service.reserve('a', 'old', 'hash', ['plans'])).kind, 'expired');
  assert.equal((await service.status('a')).allowances.plans.used, 0);
});
