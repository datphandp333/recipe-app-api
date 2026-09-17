import { Platform } from "react-native";

const MEAL_DB_BASE_URL =
  "https://www.themealdb.com/api/json/v1/1";

const BACKEND_URL = Platform.select({
  android: "http://10.0.2.2:5001",
  ios: "http://localhost:5001",
  web: "http://localhost:5001",
  default: "http://localhost:5001",
});

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.developerMessage ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
};

const createIngredientImageUrl = (
  ingredientName
) => {
  if (!ingredientName) {
    return null;
  }

  return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(
    ingredientName.trim()
  )}-Small.png`;
};

const extractIngredients = (meal) => {
  const ingredients = [];

  for (let index = 1; index <= 20; index += 1) {
    const name =
      meal?.[`strIngredient${index}`]?.trim();

    const measure =
      meal?.[`strMeasure${index}`]?.trim();

    if (!name) {
      continue;
    }

    ingredients.push({
      id: `${meal.idMeal}-ingredient-${index}`,
      name,
      amount: measure || "",
      measure: measure || "",
      preparation: "",
      label: [measure, name]
        .filter(Boolean)
        .join(" "),
      imageUrl: createIngredientImageUrl(name),
    });
  }

  return ingredients;
};

const extractInstructions = (
  instructions = ""
) => {
  if (!instructions.trim()) {
    return [];
  }

  const lineSteps = instructions
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean);

  if (lineSteps.length > 1) {
    return lineSteps.map(
      (instruction, index) => ({
        step: index + 1,
        instruction: instruction.replace(
          /^(step\s*)?\d+[.)\s-]*/i,
          ""
        ),
      })
    );
  }

  return instructions
    .split(/(?<=[.!?])\s+/)
    .map((step) => step.trim())
    .filter(Boolean)
    .map((instruction, index) => ({
      step: index + 1,
      instruction,
    }));
};

const transformMealData = (meal) => {
  if (!meal) {
    return null;
  }

  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb,
    category: meal.strCategory || "Recipe",
    area:
      meal.strArea || "International",
    cuisine:
      meal.strArea || "International",
    description:
      meal.strTags ||
      `${meal.strArea || "International"} ${
        meal.strCategory || "recipe"
      }`,
    cookTime: "30 min",
    servings: "4",
    source: meal.strSource || null,
    youtube: meal.strYoutube || null,
    ingredients: extractIngredients(meal),
    instructions: extractInstructions(
      meal.strInstructions || ""
    ),
    rawInstructions:
      meal.strInstructions || "",
    isAiGenerated: false,
    generatedBy: "TheMealDB",
  };
};

const getCategories = async () => {
  const data = await fetchJson(
    `${MEAL_DB_BASE_URL}/categories.php`
  );

  return data?.categories || [];
};

const getRandomMeal = async () => {
  const data = await fetchJson(
    `${MEAL_DB_BASE_URL}/random.php`
  );

  return data?.meals?.[0] || null;
};

const getRandomMeals = async (count = 10) => {
  const safeCount = Math.min(
    Math.max(Number(count) || 1, 1),
    20
  );

  const requests = Array.from(
    {
      length: safeCount,
    },
    () => getRandomMeal()
  );

  const meals = await Promise.all(requests);

  const uniqueMeals = new Map();

  meals
    .filter(Boolean)
    .forEach((meal) => {
      uniqueMeals.set(meal.idMeal, meal);
    });

  return Array.from(uniqueMeals.values());
};

const getMealById = async (mealId) => {
  if (!mealId) {
    throw new Error("A meal ID is required.");
  }

  const data = await fetchJson(
    `${MEAL_DB_BASE_URL}/lookup.php?i=${encodeURIComponent(
      mealId
    )}`
  );

  return data?.meals?.[0] || null;
};

const searchMealsByName = async (
  searchTerm
) => {
  const trimmedSearchTerm =
    searchTerm?.trim();

  if (!trimmedSearchTerm) {
    return [];
  }

  const data = await fetchJson(
    `${MEAL_DB_BASE_URL}/search.php?s=${encodeURIComponent(
      trimmedSearchTerm
    )}`
  );

  return data?.meals || [];
};

const filterByCategory = async (
  category
) => {
  if (!category) {
    return [];
  }

  const data = await fetchJson(
    `${MEAL_DB_BASE_URL}/filter.php?c=${encodeURIComponent(
      category
    )}`
  );

  return data?.meals || [];
};

const filterByIngredient = async (
  ingredient
) => {
  const trimmedIngredient =
    ingredient?.trim();

  if (!trimmedIngredient) {
    return [];
  }

  const data = await fetchJson(
    `${MEAL_DB_BASE_URL}/filter.php?i=${encodeURIComponent(
      trimmedIngredient
    )}`
  );

  return data?.meals || [];
};

const checkBackendHealth = async () => {
  return fetchJson(
    `${BACKEND_URL}/api/health`
  );
};

const checkAiHealth = async () => {
  return fetchJson(
    `${BACKEND_URL}/api/ai/recipes/health`
  );
};

const generateAiRecipe = async ({
  dishName = "",
  ingredients = [],
  cuisine = "",
  dietaryPreference = "",
  excludedIngredients = [],
  maximumCookingTime = 45,
  servings = 4,
}) => {
  const cleanedDishName =
    dishName?.trim() || "";

  const cleanedIngredients = Array.isArray(
    ingredients
  )
    ? ingredients
        .map((ingredient) =>
          String(ingredient).trim()
        )
        .filter(Boolean)
    : [];

  const cleanedExcludedIngredients =
    Array.isArray(excludedIngredients)
      ? excludedIngredients
          .map((ingredient) =>
            String(ingredient).trim()
          )
          .filter(Boolean)
      : [];

  /*
   * The user can generate a recipe by entering:
   *
   * 1. A specific dish name
   * 2. A list of ingredients
   * 3. Both a dish name and ingredients
   */
  if (
    !cleanedDishName &&
    cleanedIngredients.length === 0
  ) {
    throw new Error(
      "Enter a dish name or at least one ingredient."
    );
  }

  const data = await fetchJson(
    `${BACKEND_URL}/api/ai/recipes/generate`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        dishName: cleanedDishName,
        ingredients: cleanedIngredients,
        cuisine: cuisine?.trim() || "",
        dietaryPreference:
          dietaryPreference?.trim() || "",
        excludedIngredients:
          cleanedExcludedIngredients,
        maximumCookingTime:
          Number(maximumCookingTime) || 45,
        servings: Number(servings) || 4,
      }),
    }
  );

  if (!data?.recipe) {
    throw new Error(
      "The server did not return a generated recipe."
    );
  }

  return data.recipe;
};

export const MealAPI = {
  getCategories,
  getRandomMeal,
  getRandomMeals,
  getMealById,
  searchMealsByName,
  filterByCategory,
  filterByIngredient,
  transformMealData,
  checkBackendHealth,
  checkAiHealth,
  generateAiRecipe,
};

export {
  BACKEND_URL,
  checkAiHealth,
  checkBackendHealth,
  createIngredientImageUrl,
  filterByCategory,
  filterByIngredient,
  generateAiRecipe,
  getCategories,
  getMealById,
  getRandomMeal,
  getRandomMeals,
  searchMealsByName,
  transformMealData,
};