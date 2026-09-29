import test from "node:test";
import assert from "node:assert/strict";
import { validatePantryItem } from "./pantryValidation.js";

const item = { name: " Spinach ", quantity: "1.25", unit: "kg", expiresOn: "2028-02-29" };
test("accepts fractional quantities and a real leap date", () => {
  assert.deepEqual(validatePantryItem(item), { ...item, name: "Spinach" });
});
test("allows an unknown expiry date", () => {
  assert.equal(validatePantryItem({ ...item, expiresOn: "" }).expiresOn, null);
});
test("rejects impossible dates and malformed values", () => {
  for (const expiresOn of ["2026-02-29", "2026-04-31", "tomorrow", "2026-13-01", {}, false, 0]) {
    assert.throws(() => validatePantryItem({ ...item, expiresOn }));
  }
});
test("rejects zero, negative, nonnumeric, oversized and overly precise quantities", () => {
  for (const quantity of [0, -1, "", "a", true, null, 1e10, 0.0001, 1.00001]) {
    assert.throws(() => validatePantryItem({ ...item, quantity }));
  }
});
test("rejects missing names and unsupported units", () => {
  for (const name of [" ", "a".repeat(101), 123]) assert.throws(() => validatePantryItem({ ...item, name }));
  assert.throws(() => validatePantryItem({ ...item, unit: "unknown" }));
  assert.throws(() => validatePantryItem(null));
});
