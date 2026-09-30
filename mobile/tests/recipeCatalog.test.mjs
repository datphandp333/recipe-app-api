import test from "node:test";
import assert from "node:assert/strict";
import {
  COUNTRIES, CURATED_RECIPES, createRecipeCatalog, belongsToCountry,
  searchCountries, searchRecipes, favoritePayload,
} from "../services/recipeCatalog.js";

const country = (id) => COUNTRIES.find((item) => item.id === id);
const meal = (id, area = "Mexican", overrides = {}) => ({
  idMeal: String(id), strArea: area, strMeal: "Enchiladas",
  strInstructions: "Bake until ready.", strIngredient1: "Tortillas", ...overrides,
});
const transformMeal = (value) => ({ id: value.idMeal, title: value.strMeal });
const service = (overrides = {}) => createRecipeCatalog({
  searchMeals: async () => [], filterByArea: async () => [], getMeal: async () => null,
  transformMeal, ...overrides,
});

test("all 195 country identities are unique, including ambiguous MealDB labels", () => {
  assert.equal(COUNTRIES.length, 195);
  assert.equal(new Set(COUNTRIES.map((item) => item.id)).size, 195);
  for (const [id, area] of [["dominica", "Dominican"], ["guernsey", "Channel Islander"], ["dr-congo", "Congolese"]]) {
    assert.equal(belongsToCountry(meal(1, area), country(id)), false);
    assert.equal(belongsToCountry(meal(1, area, { strCountry: country(id).name }), country(id)), true);
  }
  assert.equal(belongsToCountry(meal(1, "India"), country("india")), true);
  assert.equal(belongsToCountry(meal(1, "Indian"), country("india")), true);
  assert.equal(belongsToCountry(meal(1, "Mexican", { strCountry: "Spain" }), country("mexico")), false);
});

test("bundled collection and recipe details work without making provider requests", async () => {
  const never = () => { throw new Error("Should not contact MealDB"); };
  const catalog = service({ searchMeals: never, filterByArea: never, getMeal: never });
  assert.equal((await catalog.getCollection()).recipes.length, 8);
  assert.equal((await catalog.getCollection("vietnam")).source, "curated");
  for (const recipe of CURATED_RECIPES) {
    assert.equal((await catalog.getRecipe(recipe.id)).id, recipe.id);
    assert.ok(recipe.ingredients.length && recipe.instructions.length);
    assert.ok(country(recipe.countryId));
    assert.equal(recipe.timeIsEstimate, true);
  }
  assert.equal(await catalog.getRecipe("curated-does-not-exist"), null);
});

test("search finds accented dishes, country names, and actual ingredients", () => {
  assert.ok(searchCountries("pho").some((item) => item.id === "vietnam"));
  assert.ok(searchCountries("COTE").length === 0); // API label remains Ivory Coast.
  assert.ok(searchRecipes(CURATED_RECIPES, "aubergine").length >= 2);
  assert.ok(searchRecipes(CURATED_RECIPES, "Brazil").some((item) => item.countryId === "brazil"));
});

test("fallback filters wrong countries, incomplete recipes and duplicates", async () => {
  const catalog = service({ searchMeals: async () => [meal(1), meal(1), meal(2, "Spanish"), meal(3, "Mexican", { strInstructions: "" })] });
  const result = await catalog.getCollection("mexico");
  assert.equal(result.source, "mealdb");
  assert.deepEqual(result.recipes.map((item) => item.id), ["1"]);
  assert.equal(result.recipes[0].country, "Mexico");
  assert.equal((await catalog.getRecipe("1")).title, "Enchiladas");
});

test("area fallback hydrates complete details and tolerates partial failure", async () => {
  const catalog = service({
    filterByArea: async () => [{ idMeal: "1" }, { idMeal: "2" }, { idMeal: "3" }],
    getMeal: async (id) => { if (id === "2") throw new Error("offline"); return meal(id, id === "3" ? "Spanish" : "Mexican"); },
  });
  assert.deepEqual((await catalog.getCollection("mexico")).recipes.map((item) => item.id), ["1"]);
});

test("cached results survive a refresh outage, without mixing countries", async () => {
  let offline = false;
  const catalog = service({ searchMeals: async () => { if (offline) throw new Error("offline"); return [meal(1)]; } });
  await catalog.getCollection("mexico");
  offline = true;
  assert.equal((await catalog.getCollection("mexico", { refresh: true })).source, "cache");
  await assert.rejects(catalog.getCollection("canada"), /offline/);
});

test("empty results remain empty and ambiguous countries never use area fallback", async () => {
  let calls = 0;
  const catalog = service({ filterByArea: async () => { calls++; return []; } });
  assert.equal((await catalog.getCollection("dominica")).source, "empty");
  assert.equal(calls, 0);
  assert.equal((await catalog.getCollection("mexico")).recipes.length, 0);
  assert.equal(calls, 1);
  await assert.rejects(catalog.getCollection("not-a-country"));
});

test("concurrent country requests share one provider request", async () => {
  let calls = 0;
  let release;
  const catalog = service({ searchMeals: () => { calls++; return new Promise((resolve) => { release = resolve; }); } });
  const first = catalog.getCollection("mexico");
  const second = catalog.getCollection("mexico");
  release([meal(1)]);
  assert.deepEqual(await first, await second);
  assert.equal(calls, 1);
});

test("cookbook payload preserves catalog IDs and full recipe content", () => {
  const recipe = CURATED_RECIPES[0];
  const payload = favoritePayload(recipe, "user-123");
  assert.equal(payload.recipeId, "curated-beef-pho");
  assert.equal(payload.userId, "user-123");
  assert.deepEqual(payload.ingredients, recipe.ingredients);
  assert.deepEqual(payload.instructions, recipe.instructions);
  assert.equal(payload.servings, "4");
});
