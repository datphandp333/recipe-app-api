import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PREFERENCES, validatePreferences, isDisliked } from "./cookingPreferences.js";
import { generateMealPlan } from "./mealPlanService.js";

test("preferences normalize names and reject malformed data", () => {
  assert.deepEqual(validatePreferences({ ...DEFAULT_PREFERENCES, dislikedIngredients: [" Olives ", "olives"], notes: " Less salt " }),
    { ...DEFAULT_PREFERENCES, dislikedIngredients: ["olives"], notes: "Less salt" });
  for (const changes of [{ householdSize: 0 }, { householdSize: 2.5 }, { spiceLevel: "invalid" }, { notes: "x".repeat(501) }, { dislikedIngredients: [123] }]) {
    assert.throws(() => validatePreferences({ ...DEFAULT_PREFERENCES, ...changes }));
  }
});
test("dislike matching handles phrases and simple plurals without substring matches", () => {
  const preferences = { ...DEFAULT_PREFERENCES, dislikedIngredients: ["mushrooms", "olives"] };
  assert.equal(isDisliked("Sliced mushroom", preferences), true);
  assert.equal(isDisliked("Green olives", preferences), true);
  assert.equal(isDisliked("Olive oil", preferences), false);
  assert.equal(isDisliked("Extra-virgin olive oil", preferences), false);
  assert.equal(isDisliked("Black olives in olive oil", preferences), true);
  assert.equal(isDisliked("Olive oil", { ...preferences, dislikedIngredients: ["olive oil"] }), true);
  assert.equal(isDisliked("Green olives", { ...preferences, dislikedIngredients: ["olive oil"] }), false);
  assert.equal(isDisliked("Rice", preferences), false);
  assert.equal(isDisliked("Ham", { ...preferences, dislikedIngredients: ["yam"] }), false);
});
test("generation applies preferences, skips disliked priority stock, and repairs violations", async () => {
  const preferences = { ...DEFAULT_PREFERENCES, spiceLevel: "mild", dislikedIngredients: ["mushrooms"], notes: "One pot" };
  const options = { servings: 2, maximumCookingTime: 30, startDate: "2026-09-28", preferences };
  const pantry = [{ id: 1, name: "Mushrooms", quantity: 1, unit: "cups", expiresOn: "2026-09-28" },
    { id: 2, name: "Rice", quantity: 3, unit: "cups", expiresOn: null }];
  let calls = 0;
  const plan = await generateMealPlan(pantry, options, async prompt => {
    assert.match(prompt, /"spiceLevel":"mild"/);
    assert.match(prompt, /first pantry ingredient \("Rice"\)/);
    const bad = ++calls === 1;
    if (!bad) assert.match(prompt, /disliked ingredients: Mushroom/);
    return JSON.stringify({ meals: [1, 2, 3].map(day => ({ title: `Rice ${day}`, reason: "Uses pantry rice", servings: 2, totalTime: 20,
      ingredients: [{ name: "Rice", quantity: 1, unit: "cups" }, ...(bad ? [{ name: "Mushroom", quantity: 1, unit: "items" }] : [])], instructions: ["Cook rice."] })) });
  });
  assert.equal(calls, 2);
  assert.deepEqual(plan.preferences, preferences);
  await assert.rejects(generateMealPlan([pantry[0]], options, () => assert.fail("No usable stock: should not call Gemini")));
});
