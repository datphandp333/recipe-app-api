// Additive setup for existing databases originally provisioned with drizzle-kit push.
// Does not replay earlier migrations or change favorites/pantry records.
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { ENV } from '../src/config/env.js';

if (!ENV.DATABASE_URL) throw new Error('Configure DATABASE_URL in Back-end/.env first.');
const database = neon(ENV.DATABASE_URL);
const rows = await database`SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' AND table_name IN ('membership_accounts','membership_usage','membership_requests')`;
if (rows.length === 3) {
  const functions = await database`SELECT proname FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('membership_reserve','membership_settle')`;
  if (functions.length !== 2) throw new Error('Beta tables exist but setup is incomplete. Inspect the migration before continuing.');
  console.log('Free beta schema is already installed. No changes made.');
} else {
  if (rows.length) throw new Error('Partial beta schema detected. Inspect it before applying the migration.');
  const migration = await readFile(new URL('../src/db/migrations/0007_beta_usage.sql', import.meta.url), 'utf8');
  const statements = migration.split('--> statement-breakpoint').map(value => value.trim()).filter(Boolean);
  await database.transaction(statements.map(statement => database.query(statement, [])));
  console.log('Free beta schema installed atomically. Existing recipes and pantry data were unchanged.');
}
