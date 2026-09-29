import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { PgDialect } from "drizzle-orm/pg-core";
import { createMealPlanRouter } from "./mealPlanRoutes.js";
import { pantryTable, cookingPreferencesTable } from "../db/schema.js";

test("meal plan drafts, explicit save, stale pantry, and account isolation", async () => {
  let pantry = [{ id: 1, name: "Rice", unit: "g", quantity: "500", expiresOn: null }];
  const records = [];
  const preferences = new Map();
  const db = {};
  for (const operation of ["select", "insert", "update"]) {
    db[operation] = table => {
      let values, parameters = [], selectedTable = table;
      const result = () => {
        if (selectedTable === cookingPreferencesTable) {
          if (operation === "insert") { preferences.set(values.userId, values); return [values]; }
          return preferences.has(parameters[0]) ? [preferences.get(parameters[0])] : [];
        }
        if (operation === "insert") {
          const row = { id: records.length + 1, ...values, savedAt: null };
          records.push(row); return [row];
        }
        if (selectedTable === pantryTable) return pantry;
        const found = records.filter(row => parameters.includes(row.userId) && (typeof parameters[0] !== "number" || parameters[0] === row.id));
        if (operation === "update") found.forEach(row => Object.assign(row, values));
        return found;
      };
      return {
        from(value) { selectedTable = value; return this; },
        where(value) { parameters = new PgDialect().sqlToQuery(value).params; return this; },
        orderBy() { return this; }, limit() { return this; },
        values(value) { values = value; return this; },
        onConflictDoUpdate() { return this; },
        set(value) { values = value; return this; }, returning() { return this; },
        then(resolve, reject) { return Promise.resolve().then(result).then(resolve, reject); },
      };
    };
  }
  const app = express();
  let generationFailure;
  app.use(express.json());
  app.use((req, res, next) => { req.pantryUserId = req.headers["x-test-user"] || "user-a"; next(); });
  app.use(createMealPlanRouter({ db, generate: async (stock, options) => {
    if (generationFailure) throw generationFailure;
    return { ...options, meals: [], groceryList: [] };
  } }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const startDate = new Date().toISOString().slice(0, 10);
  const request = (path, body, user = "user-a", method) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method: method || (body ? "POST" : "GET"), headers: { "Content-Type": "application/json", "x-test-user": user },
    body: body ? JSON.stringify(body) : undefined,
  });
  try {
    const draft = await request("/drafts", { startDate, servings: 2, maximumCookingTime: 30, userId: "user-b" });
    assert.equal(draft.status, 201);
    assert.equal(records[0].userId, "user-a");
    assert.equal(records[0].savedAt, null);
    assert.equal((await request("/1/save", { startDate }, "user-b")).status, 404);
    pantry = [{ ...pantry[0], quantity: "250" }];
    assert.equal((await request("/1/save", { startDate })).status, 409);
    pantry = [{ ...pantry[0], quantity: "500" }];
    assert.equal((await request("/1/save", { startDate })).status, 200);
    const savedAt = records[0].savedAt;
    assert.ok(savedAt);
    assert.equal((await request("/1/save", { startDate })).status, 200);
    assert.equal(records[0].savedAt, savedAt);
    assert.equal(pantry[0].quantity, "500");
    assert.equal((await request("/invalid/save", { startDate })).status, 400);
    assert.deepEqual((await (await request("/", null, "user-b")).json()).plans, []);
    const prefs = { householdSize: 4, spiceLevel: "mild", dislikedIngredients: ["Mushrooms"], notes: "One-pot meals" };
    assert.equal((await request("/preferences", { ...prefs, userId: "user-b" }, "user-a", "PUT")).status, 200);
    assert.equal((await (await request("/preferences")).json()).preferences.householdSize, 4);
    assert.equal((await (await request("/preferences", null, "user-b")).json()).preferences.householdSize, 2);
    assert.equal((await request("/preferences", { ...prefs, householdSize: 0 }, "user-a", "PUT")).status, 400);
    const personalized = await (await request("/drafts", { startDate, maximumCookingTime: 30 })).json();
    assert.equal(personalized.plan.plan.servings, 4);
    assert.equal(personalized.plan.plan.preferences.spiceLevel, "mild");
    await request("/preferences", { ...prefs, spiceLevel: "hot" }, "user-a", "PUT");
    assert.equal((await request(`/${personalized.plan.id}/save`, { startDate })).status, 409);
    generationFailure = Object.assign(new Error("Provider unavailable"), { status: 503, code: "GEMINI_UPSTREAM_ERROR" });
    const unavailable = await request("/drafts", { startDate });
    assert.equal(unavailable.status, 503);
    assert.match((await unavailable.json()).message, /temporarily unavailable/);
    generationFailure = Object.assign(new Error("Missing key"), { status: 503, code: "GEMINI_NOT_CONFIGURED" });
    const unconfigured = await request("/drafts", { startDate });
    assert.equal(unconfigured.status, 503);
    assert.match((await unconfigured.json()).message, /not configured/);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
