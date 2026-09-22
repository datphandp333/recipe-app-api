import { Platform } from "react-native";

const MEAL_DB_BASE_URL =
  "https://www.themealdb.com/api/json/v1/1";

const removeTrailingSlash = (value = "") =>
  String(value).replace(/\/+$/, "");

const configuredApiUrl = removeTrailingSlash(
  process.env.EXPO_PUBLIC_API_URL || ""
);

const configuredBackendUrl = configuredApiUrl.replace(
  /\/api$/,
  ""
);

const nativeBackendUrl =
  configuredBackendUrl ||
  Platform.select({
    android: "http://10.0.2.2:5001",
    ios: "http://192.168.1.112:5001",
    default: "http://localhost:5001",
  });

const BACKEND_URL =
  Platform.OS === "web"
    ? "http://localhost:5001"
    : nativeBackendUrl;

const fetchJson = async (
  url,
  options = {}
) => {
  const response = await fetch(url, options);

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.developerMessage ||
        `Request failed with status ${response.status}.`
    );

    error.status = response.status;
    error.data = data;

    throw error;
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
  )}-small.png`;
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
      imageSearchName: name,
      imageUrl: createIngredientImageUrl(name),
      imageProvider: "TheMealDB",
      imageAttribution: null,
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

  const sourceSteps =
    lineSteps.length > 1
      ? lineSteps
      : instructions
          .split(/(?<=[.!?])\s+/)
          .map((step) => step.trim())
          .filter(Boolean);

  return sourceSteps.map(
    (instruction, index) => ({
      step: index + 1,
      instruction: instruction.replace(
        /^(step\s*)?\d+[.)\s-]*/i,
        ""
      ),
    })
  );
};

const transformMealData = (meal) => {
  if (!meal) {
    return null;
  }

  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb,
    dishPhoto: meal.strMealThumb
      ? {
          imageUrl: meal.strMealThumb,
          provider: "TheMealDB",
        }
      : null,
    category: meal.strCategory || "Recipe",
    area: meal.strArea || "International",
    cuisine: meal.strArea || "International",
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
    rawInstructions: meal.strInstructions || "",
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

  const meals = await Promise.all(
    Array.from(
      { length: safeCount },
      () => getRandomMeal()
    )
  );

  const uniqueMeals = new Map();

  meals.filter(Boolean).forEach((meal) => {
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

const searchMealsByName = async (searchTerm) => {
  const cleanedSearchTerm =
    searchTerm?.trim();

  if (!cleanedSearchTerm) {
    return [];
  }

  const data = await fetchJson(
    `${MEAL_DB_BASE_URL}/search.php?s=${encodeURIComponent(
      cleanedSearchTerm
    )}`
  );

  return data?.meals || [];
};

const filterByCategory = async (category) => {
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

const filterByIngredient = async (ingredient) => {
  const cleanedIngredient =
    ingredient?.trim();

  if (!cleanedIngredient) {
    return [];
  }

  const data = await fetchJson(
    `${MEAL_DB_BASE_URL}/filter.php?i=${encodeURIComponent(
      cleanedIngredient
    )}`
  );

  return data?.meals || [];
};

const checkBackendHealth = async () => {
  return fetchJson(`${BACKEND_URL}/api/health`);
};

const checkAiHealth = async () => {
  return fetchJson(
    `${BACKEND_URL}/api/ai/recipes/health`
  );
};

const checkImageHealth = async () => {
  return fetchJson(
    `${BACKEND_URL}/api/images/health`
  );
};

const searchDishPhoto = async ({
  dishName,
  cuisine = "",
}) => {
  const cleanedDishName =
    dishName?.trim();

  if (!cleanedDishName) {
    return null;
  }

  try {
    const data = await fetchJson(
      `${BACKEND_URL}/api/images/dish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dishName: cleanedDishName,
          cuisine: cuisine?.trim() || "",
        }),
      }
    );

    return data?.photo || null;
  } catch (error) {
    console.warn(
      "Dish photo search failed:",
      error.message
    );

    return null;
  }
};

const searchIngredientPhoto = async (
  ingredientName
) => {
  const cleanedIngredientName =
    ingredientName?.trim();

  if (!cleanedIngredientName) {
    return null;
  }

  try {
    const data = await fetchJson(
      `${BACKEND_URL}/api/images/ingredient`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredientName: cleanedIngredientName,
        }),
      }
    );

    return data?.photo || null;
  } catch (error) {
    console.warn(
      `Ingredient photo search failed for ${cleanedIngredientName}:`,
      error.message
    );

    return null;
  }
};

const searchIngredientPhotos = async (
  ingredients
) => {
  if (
    !Array.isArray(ingredients) ||
    ingredients.length === 0
  ) {
    return [];
  }

  const cleanedIngredients = ingredients
    .map((ingredient, index) => {
      const name = ingredient?.name?.trim();
      const imageSearchName =
        ingredient?.imageSearchName?.trim();

      if (!name && !imageSearchName) {
        return null;
      }

      return {
        id:
          ingredient?.id ||
          `ingredient-${index + 1}`,
        name: name || imageSearchName,
        imageSearchName:
          imageSearchName || name,
      };
    })
    .filter(Boolean);

  if (cleanedIngredients.length === 0) {
    return [];
  }

  try {
    const data = await fetchJson(
      `${BACKEND_URL}/api/images/ingredients`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients: cleanedIngredients,
        }),
      }
    );

    return data?.results || [];
  } catch (error) {
    console.warn(
      "Ingredient batch photo search failed:",
      error.message
    );

    return [];
  }
};

const addDishPhotoToRecipe = async (recipe) => {
  if (!recipe) {
    return null;
  }

  const dishPhoto = await searchDishPhoto({
    dishName: recipe.title,
    cuisine: recipe.cuisine,
  });

  return {
    ...recipe,
    dishPhoto,
    image:
      dishPhoto?.imageUrl ||
      recipe.image ||
      null,
    imageAttribution: dishPhoto
      ? {
          provider: dishPhoto.provider,
          photographer:
            dishPhoto.photographer,
          photographerUrl:
            dishPhoto.photographerUrl,
          photoUrl: dishPhoto.pexelsUrl,
        }
      : null,
  };
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

  return addDishPhotoToRecipe(data.recipe);
};

const chatWithRecipeChef = async (messages) => {
  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    throw new Error(
      "Send a message to Recipe Chef."
    );
  }

  const data = await fetchJson(
    `${BACKEND_URL}/api/ai/recipes/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages
          .map((message) => ({
            role:
              message?.role === "assistant"
                ? "assistant"
                : "user",
            content:
              String(
                message?.content || ""
              ).trim(),
          }))
          .filter((message) => message.content)
          .slice(-16),
      }),
    }
  );

  return {
    reply:
      data?.reply ||
      "I’m sorry, I could not prepare a response.",
    suggestedRecipe:
      data?.suggestedRecipe
        ? await addDishPhotoToRecipe(
            data.suggestedRecipe
          )
        : null,
  };
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
  checkImageHealth,
  generateAiRecipe,
  chatWithRecipeChef,
  searchDishPhoto,
  searchIngredientPhoto,
  searchIngredientPhotos,
};

export {
  BACKEND_URL,
  checkAiHealth,
  checkBackendHealth,
  checkImageHealth,
  chatWithRecipeChef,
  createIngredientImageUrl,
  filterByCategory,
  filterByIngredient,
  generateAiRecipe,
  getCategories,
  getMealById,
  getRandomMeal,
  getRandomMeals,
  searchDishPhoto,
  searchIngredientPhoto,
  searchIngredientPhotos,
  searchMealsByName,
  transformMealData,
};