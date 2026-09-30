import { COUNTRIES } from "../data/countries.js";
import { CURATED_RECIPES } from "../data/curatedRecipes.js";

export { COUNTRIES, CURATED_RECIPES };
export const FEATURED_COUNTRIES = ["vietnam", "italy", "japan", "india", "morocco", "mexico"];
export const normalizeSearch = (value = "") => String(value)
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const searchCountries = (query = "") => {
  const term = normalizeSearch(query);
  return COUNTRIES.filter((country) => normalizeSearch(
    `${country.name} ${country.area} ${country.dish}`
  ).includes(term));
};

export const searchRecipes = (recipes, query = "") => {
  const term = normalizeSearch(query);
  return recipes.filter((recipe) => normalizeSearch([
    recipe.title, recipe.country, recipe.cuisine, recipe.category,
    ...(recipe.ingredients || []).map((ingredient) => ingredient.name || ingredient),
  ].join(" ")).includes(term));
};

export const getCuratedRecipe = (id) => CURATED_RECIPES.find((recipe) => recipe.id === String(id)) || null;

// Area adjectives aren't unique: never mix the two Congos, Dominicas, or Channel Islands.
export const belongsToCountry = (meal, country) => {
  if (meal?.strCountry) return normalizeSearch(meal.strCountry) === normalizeSearch(country.name);
  if (COUNTRIES.filter((item) => item.area === country.area).length > 1) return false;
  return [country.area, country.name].some((name) => normalizeSearch(name) === normalizeSearch(meal?.strArea));
};

export const isCompleteMeal = (meal) => Boolean(meal?.idMeal && meal?.strMeal?.trim()
  && meal?.strInstructions?.trim() && meal?.strIngredient1?.trim());

export const favoritePayload = (recipe, userId) => ({
  userId,
  recipeId: String(recipe.id),
  title: recipe.title,
  image: recipe.image || null,
  cookTime: recipe.cookTime || null,
  servings: recipe.servings == null ? null : String(recipe.servings),
  ingredients: recipe.ingredients || [],
  instructions: recipe.instructions || [],
  personalNote: recipe.recipeNote || "",
});

// The bundled catalog is the primary source and works without a network.
// Additional country recipes are resolved on demand; last successes are kept for this session.
export const createRecipeCatalog = ({ searchMeals, filterByArea, getMeal, transformMeal }) => {
  const countryCache = new Map();
  const recipeCache = new Map();
  const pending = new Map();
  const storeCountry = (id, recipes) => {
    if (countryCache.size >= 40 && !countryCache.has(id)) countryCache.delete(countryCache.keys().next().value);
    countryCache.set(id, recipes);
    for (const recipe of recipes) {
      if (recipeCache.size >= 240 && !recipeCache.has(recipe.id)) recipeCache.delete(recipeCache.keys().next().value);
      recipeCache.set(recipe.id, recipe);
    }
  };

  const loadCountry = async (country, refresh) => {
    const previous = countryCache.get(country.id);
    if (previous && !refresh) return { recipes: previous, source: "mealdb" };
    try {
      const candidateMatches = await searchMeals(normalizeSearch(country.dish));
      let fullMeals = candidateMatches.filter((meal) => belongsToCountry(meal, country) && isCompleteMeal(meal));
      if (!fullMeals.length) {
        // Ambiguous labels cannot safely use the area-only endpoint.
        const ambiguous = COUNTRIES.filter((item) => item.area === country.area).length > 1;
        if (!ambiguous) {
          const summaries = await filterByArea(country.area);
          const results = await Promise.allSettled(summaries.slice(0, 6).map((meal) => getMeal(meal.idMeal)));
          fullMeals = results.filter((result) => result.status === "fulfilled")
            .map((result) => result.value)
            .filter((meal) => belongsToCountry(meal, country) && isCompleteMeal(meal));
          if (!fullMeals.length && results.some((result) => result.status === "rejected")) {
            throw new Error("Some recipes could not be loaded. Please try again.");
          }
        }
      }
      const unique = [...new Map(fullMeals.map((meal) => [String(meal.idMeal), meal])).values()];
      const recipes = unique.slice(0, 6).map((meal) => ({
        ...transformMeal(meal), id: String(meal.idMeal), countryId: country.id, country: country.name,
      }));
      if (recipes.length) storeCountry(country.id, recipes);
      return { recipes, source: recipes.length ? "mealdb" : "empty" };
    } catch (error) {
      if (previous) return { recipes: previous, source: "cache" };
      throw error;
    }
  };

  return {
    async getCollection(countryId = "all", { refresh = false } = {}) {
      if (countryId === "all") return { recipes: CURATED_RECIPES, source: "curated" };
      const country = COUNTRIES.find((item) => item.id === countryId);
      if (!country) throw new Error("Choose a country from the list.");
      const local = CURATED_RECIPES.filter((recipe) => recipe.countryId === countryId);
      if (local.length) return { recipes: local, source: "curated" };
      if (pending.has(countryId)) return pending.get(countryId);
      const request = loadCountry(country, refresh).finally(() => pending.delete(countryId));
      pending.set(countryId, request);
      return request;
    },
    async getRecipe(id) {
      const key = String(id);
      const local = getCuratedRecipe(key) || recipeCache.get(key);
      if (local) return local;
      // Unknown catalog IDs must never be sent to the external lookup endpoint.
      if (!/^\d+$/.test(key)) return null;
      const meal = await getMeal(key);
      return isCompleteMeal(meal) ? transformMeal(meal) : null;
    },
  };
};
