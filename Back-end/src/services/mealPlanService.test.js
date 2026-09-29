import test from "node:test";
import assert from "node:assert/strict";
import { buildMealPlan, generateMealPlan, pantryFingerprint, validatePlanOptions } from "./mealPlanService.js";

const options = { servings: 2, maximumCookingTime: 30, startDate: "2026-09-28" };
const chicken = { id: 1, name: "Chicken", quantity: "500", unit: "g", expiresOn: "2026-09-30" };
const ingredient = (name = "Chicken", quantity = 300, unit = "g") => ({ name, quantity, unit });
const rawPlan = (ingredients = [[ingredient()], [ingredient()], [ingredient()]]) => ({
  meals: ingredients.map((items, index) => ({ title: `Dinner ${index + 1}`, reason: "Uses pantry ingredients.",
    servings: 2, totalTime: 25, ingredients: items, instructions: ["Prepare and cook the ingredients."] })),
});

test("500 g of stock is shared across three dinners, with 400 g on the grocery list", () => {
  const plan = buildMealPlan(rawPlan(), [chicken], options);
  assert.deepEqual(plan.meals.map(meal => meal.ingredients[0].pantryUsed), [300, 200, 0]);
  assert.deepEqual(plan.groceryList, [{ name: "chicken", unit: "g", quantity: 400 }]);
  assert.equal(chicken.quantity, "500"); // Planning cannot mutate pantry inventory.
});

test("converts kg to g and merges case/whitespace differences", () => {
  const plan = buildMealPlan(rawPlan([[ingredient(" CHICKEN ", 0.3, "kg")], [ingredient()], [ingredient()]]), [chicken], options);
  assert.equal(plan.groceryList[0].quantity, 400);
});

test("consumes the earliest-expiring batch first and excludes stock on later dates", () => {
  const stock = [chicken, { ...chicken, id: 2, quantity: 100, expiresOn: "2026-09-28" }];
  const plan = buildMealPlan(rawPlan(), stock, options);
  assert.deepEqual(plan.meals[0].ingredients[0].allocations.map(item => item.pantryItemId), [2, 1]);
  assert.equal(plan.groceryList[0].quantity, 300);
  const expiresToday = buildMealPlan(rawPlan(), [{ ...chicken, expiresOn: "2026-09-28" }], options);
  assert.equal(expiresToday.groceryList[0].quantity, 600);
});

test("does not guess mass-to-volume conversions or ingredient synonyms", () => {
  const plan = buildMealPlan(rawPlan([[ingredient()], [ingredient("Chicken", 1, "cups")], [ingredient("Chicken breast", 100)]]), [chicken], options);
  assert.deepEqual(plan.groceryList, [{ name: "chicken", unit: "tsp", quantity: 48 }, { name: "chicken breast", unit: "g", quantity: 100 }]);
});

test("accounts for duplicate ingredient lines without reusing inventory", () => {
  const plan = buildMealPlan(rawPlan([[ingredient(), ingredient()], [ingredient()], [ingredient()]]), [chicken], options);
  assert.equal(plan.groceryList[0].quantity, 700);
});

test("rejects expired-only pantry, bad recipe data, and ignored expiry priority", () => {
  assert.throws(() => buildMealPlan(rawPlan(), [{ ...chicken, expiresOn: "2026-09-27" }], options));
  const invalid = rawPlan(); invalid.meals[1].totalTime = 60;
  assert.throws(() => buildMealPlan(invalid, [chicken], options));
  for (const quantity of [-1, 0, null, "300", 1.00001, Infinity]) {
    assert.throws(() => buildMealPlan(rawPlan([[ingredient("Chicken", quantity)], [ingredient()], [ingredient()]]), [chicken], options));
  }
  assert.throws(() => buildMealPlan(rawPlan(), [chicken, { id: 2, name: "Spinach", quantity: 1, unit: "cups", expiresOn: "2026-09-28" }], options));
});

test("validates user options and calendar dates", () => {
  assert.deepEqual(validatePlanOptions(options, new Date("2026-09-28")), options);
  for (const changes of [{ servings: 0 }, { servings: 2.5 }, { maximumCookingTime: 2 }, { startDate: "2026-02-30" }, { startDate: "2026-10-15" }]) {
    assert.throws(() => validatePlanOptions({ ...options, ...changes }, new Date("2026-09-28")));
  }
});

test("fingerprint ignores row order but detects pantry edits", () => {
  const rice = { ...chicken, id: 2, name: "Rice" };
  assert.equal(pantryFingerprint([chicken, rice]), pantryFingerprint([rice, chicken]));
  assert.notEqual(pantryFingerprint([chicken]), pantryFingerprint([{ ...chicken, quantity: 600 }]));
});

test("retries an invalid model response once and validates the result", async () => {
  let calls = 0;
  const plan = await generateMealPlan([chicken], options, async () => ++calls === 1 ? "not JSON" : JSON.stringify(rawPlan()));
  assert.equal(calls, 2);
  assert.equal(plan.groceryList[0].quantity, 400);
  await assert.rejects(generateMealPlan([], options, () => assert.fail("Must not call AI with empty pantry")));
});

test("requests structured output and retries truncation without accepting partial recipes", async () => {
  let calls = 0;
  const plan = await generateMealPlan([chicken], options, async (prompt, temperature, signal, config) => {
    assert.equal(config.responseSchema.properties.meals.type, "ARRAY");
    assert.equal(config.responseSchema.properties.meals.items.type, "OBJECT");
    assert.equal(config.responseSchema.properties.meals.maxItems, undefined);
    assert.equal(config.maxOutputTokens, 8192);
    if (++calls === 1) throw Object.assign(new Error("Response cut short"), { code: "GEMINI_TRUNCATED", status: 502 });
    return `Here is the plan:\n${JSON.stringify(rawPlan())}`;
  });
  assert.equal(calls, 2);
  assert.equal(plan.meals.length, 3);
});
