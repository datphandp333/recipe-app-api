import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { PgDialect } from "drizzle-orm/pg-core";
import { createPantryRouter } from "./pantryRoutes.js";

test("pantry API validates sessions, input and ownership for CRUD", async () => {
  let saved, filter, rows = [{ id: 7, name: "Spinach" }];
  const query = {
    from() { return this; },
    where(value) { filter = new PgDialect().sqlToQuery(value); return this; },
    orderBy() { return Promise.resolve(rows); },
    values(value) { saved = value; return this; },
    set(value) { saved = value; return this; },
    returning() { return Promise.resolve(rows); },
  };
  const db = { select: () => query, insert: () => query, update: () => query, delete: () => query };
  const app = express();
  app.use(express.json());
  app.use("/api/pantry", createPantryRouter({ db, env: { CLERK_SECRET_KEY: "test" }, verifySession: async token => {
    if (token !== "valid") throw new Error("Invalid session");
    return { sub: "user-a", sid: "session-a" };
  } }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/pantry`;
  const request = (method, path = "", body, token = "valid") => fetch(url + path, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  try {
    assert.equal((await request("GET", "", null, "")).status, 401);
    assert.equal((await request("GET", "", null, "invalid")).status, 401);
    assert.equal((await request("GET")).status, 200);
    assert.deepEqual(filter.params, ["user-a"]);
    const item = { name: "Spinach", quantity: 2, unit: "cups", userId: "user-b" };
    assert.equal((await request("POST", "", item)).status, 201);
    assert.equal(saved.userId, "user-a");
    assert.equal((await request("POST", "", { ...item, quantity: -1 })).status, 400);
    assert.equal((await request("PUT", "/7", item)).status, 200);
    assert.deepEqual(filter.params, [7, "user-a"]);
    assert.equal(saved.userId, undefined);
    assert.equal((await request("DELETE", "/7")).status, 204);
    assert.deepEqual(filter.params, [7, "user-a"]);
    rows = [];
    assert.equal((await request("PUT", "/8", item)).status, 404);
    assert.equal((await request("DELETE", "/8")).status, 404);
    assert.equal((await request("DELETE", "/invalid")).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
