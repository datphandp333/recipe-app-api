import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

// Explicit opt-in: only temporary tables and a pg_temp function are used.
test("database completion is idempotent, account scoped, and rolls back partial deductions", { skip: process.env.RUN_DATABASE_TESTS !== "1" }, async () => {
  const sql = neon(process.env.DATABASE_URL);
  const migration = await readFile(new URL("../db/migrations/0005_meal_completion.sql", import.meta.url), "utf8");
  const fn = migration.split("--> statement-breakpoint")[1]
    .replace("CREATE FUNCTION complete_pantry_meal", "CREATE FUNCTION pg_temp.complete_pantry_meal")
    .replace("LANGUAGE plpgsql AS", "LANGUAGE plpgsql SET search_path = pg_temp AS");
  const fixture = JSON.stringify({ meals: [1, 2, 3].map(day => ({ day, ingredients: [
    { name: "Chicken", allocations: [{ pantryItemId: 1, quantity: 300, unit: "g" }] },
    { name: "Rice", allocations: [{ pantryItemId: 2, quantity: 100, unit: "g" }] },
    { name: "Other account", allocations: [{ pantryItemId: 3, quantity: 1, unit: "g" }] },
  ] })) });
  const result = await sql.transaction([
    sql.query("CREATE TEMP TABLE meal_plans (id integer, user_id text, plan jsonb, saved_at timestamp, cooked_meals jsonb DEFAULT '{}'::jsonb) ON COMMIT DROP"),
    sql.query("CREATE TEMP TABLE pantry (id integer, user_id text, name text, quantity numeric(12,3), unit text) ON COMMIT DROP"),
    sql.query(fn),
    sql.query("INSERT INTO meal_plans VALUES (1, 'test-a', $1::jsonb, now(), '{}'::jsonb)", [fixture]),
    sql.query("INSERT INTO pantry VALUES (1, 'test-a', 'Chicken', 500, 'g'), (2, 'test-a', 'Rice', 100, 'g'), (3, 'test-b', 'Other account', 100, 'g')"),
    sql.query(`DO $$ BEGIN
      BEGIN
        PERFORM pg_temp.complete_pantry_meal('test-b', 1, 1, '[]', '');
        RAISE EXCEPTION 'Ownership check failed' USING ERRCODE='23514';
      EXCEPTION WHEN no_data_found THEN NULL; END;
      BEGIN
        PERFORM pg_temp.complete_pantry_meal('test-a', 1, 1, '[{"pantryItemId":1,"name":"Chicken","unit":"g","quantity":300},{"pantryItemId":2,"name":"Rice","unit":"g","quantity":200}]', '');
        RAISE EXCEPTION 'Stock check failed' USING ERRCODE='23514';
      EXCEPTION WHEN raise_exception THEN NULL; END;
      IF (SELECT quantity FROM pantry WHERE id=1) <> 500 THEN RAISE EXCEPTION 'Partial deduction survived'; END IF;
      BEGIN
        PERFORM pg_temp.complete_pantry_meal('test-a', 1, 1, '[{"pantryItemId":3,"name":"Other account","unit":"g","quantity":1}]', '');
        RAISE EXCEPTION 'Pantry ownership check failed' USING ERRCODE='23514';
      EXCEPTION WHEN raise_exception THEN NULL; END;
      PERFORM pg_temp.complete_pantry_meal('test-a', 1, 1, '[{"pantryItemId":1,"name":"Chicken","unit":"g","quantity":300},{"pantryItemId":2,"name":"Rice","unit":"g","quantity":100}]', 'Make again');
      PERFORM pg_temp.complete_pantry_meal('test-a', 1, 1, '[{"pantryItemId":1,"name":"Chicken","unit":"g","quantity":300}]', 'Retry');
      IF (SELECT quantity FROM pantry WHERE id=1) <> 200 THEN RAISE EXCEPTION 'Double deduction'; END IF;
      IF EXISTS (SELECT 1 FROM pantry WHERE id=2) THEN RAISE EXCEPTION 'Empty item not removed'; END IF;
      IF (SELECT cooked_meals->'1'->>'feedback' FROM meal_plans WHERE id=1) <> 'Make again' THEN RAISE EXCEPTION 'Receipt overwritten'; END IF;
      PERFORM pg_temp.complete_pantry_meal('test-a', 1, 2, '[{"pantryItemId":2,"name":"Rice","unit":"g","quantity":0}]', '');
    END $$`),
    sql.query("SELECT quantity FROM pantry WHERE id=1"),
    sql.query("DROP FUNCTION pg_temp.complete_pantry_meal(text, integer, integer, jsonb, text)"),
  ]);
  assert.equal(Number(result[result.length - 2][0].quantity), 200);
});
