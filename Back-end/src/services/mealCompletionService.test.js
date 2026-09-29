import test from "node:test";
import assert from "node:assert/strict";
import { completionPreview, validateCompletion } from "./mealCompletionService.js";

const meal = { ingredients: [{ name: "Chicken", allocations: [{ pantryItemId: 1, quantity: 300, unit: "g" }] }] };
test("preview converts allocated base units to actual pantry units and caps at current stock", () => {
  const pantry = [{ id: 1, name: "Chicken", quantity: "0.5", unit: "kg" }];
  assert.equal(completionPreview(meal, pantry)[0].quantity, 0.3);
  assert.equal(completionPreview(meal, [{ ...pantry[0], quantity: "0.2" }])[0].quantity, 0.2);
  const duplicate = { ingredients: [...meal.ingredients, ...meal.ingredients] };
  assert.equal(completionPreview(duplicate, pantry)[0].quantity, 0.5);
});
test("missing, renamed or incompatible pantry items default to zero", () => {
  for (const pantry of [[], [{ id: 1, name: "Rice", quantity: 500, unit: "g" }], [{ id: 1, name: "Chicken", quantity: 2, unit: "cups" }]]) {
    assert.equal(completionPreview(meal, pantry)[0].quantity, 0);
    assert.equal(completionPreview(meal, pantry)[0].missing, true);
  }
});
test("completion validates actual quantities and feedback", () => {
  const item = { pantryItemId: 1, name: "Chicken", quantity: 0.25, unit: "kg" };
  assert.deepEqual(validateCompletion({ consumed: [item], feedback: " Make again " }), { consumed: [item], feedback: "Make again" });
  assert.equal(validateCompletion({ consumed: [{ ...item, quantity: 0 }] }).consumed[0].quantity, 0);
  for (const quantity of [-1, "2", NaN, Infinity, 0.0001]) assert.throws(() => validateCompletion({ consumed: [{ ...item, quantity }] }));
  assert.throws(() => validateCompletion({ consumed: [item, item] }));
  assert.throws(() => validateCompletion({ consumed: [item], feedback: "x".repeat(501) }));
});
