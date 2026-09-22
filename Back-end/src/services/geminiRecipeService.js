import { ENV } from "../config/env.js";

const GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";

const normalizeModelName = (modelName) => {
  const cleanedModelName =
    String(modelName || "").trim();

  return (
    cleanedModelName
      .replace(/^models\//, "")
      .trim() || "gemini-3.5-flash-lite"
  );
};

const cleanText = (value, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim() || fallback;
};

const cleanNumber = (
  value,
  fallback,
  minimum = 0,
  maximum = 10000
) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(minimum, Math.round(numericValue))
  );
};

const removeJsonCodeBlock = (value) => {
  return String(value || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
};

const extractGeminiText = (data) => {
  const parts =
    data?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => part?.text || "")
    .join("")
    .trim();
};

const parseGeminiJson = (
  text,
  errorMessage = "Gemini returned invalid JSON."
) => {
  const cleanedText =
    removeJsonCodeBlock(text);

  try {
    return JSON.parse(cleanedText);
  } catch {
    const firstBrace =
      cleanedText.indexOf("{");

    const lastBrace =
      cleanedText.lastIndexOf("}");

    if (
      firstBrace === -1 ||
      lastBrace === -1 ||
      lastBrace <= firstBrace
    ) {
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(
        cleanedText.slice(
          firstBrace,
          lastBrace + 1
        )
      );
    } catch {
      throw new Error(errorMessage);
    }
  }
};

const createIngredientImageUrl = (
  imageSearchName
) => {
  if (!imageSearchName) {
    return null;
  }

  return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(
    imageSearchName.trim()
  )}-Small.png`;
};

const cleanLabels = (labels) => {
  if (!Array.isArray(labels)) {
    return [];
  }

  return labels
    .map((label) => cleanText(label))
    .filter(Boolean)
    .slice(0, 8);
};

const cleanTips = (tips) => {
  if (!Array.isArray(tips)) {
    return [];
  }

  return tips
    .map((tip) => cleanText(tip))
    .filter(Boolean)
    .slice(0, 8);
};

const cleanInstructions = (
  instructions
) => {
  if (!Array.isArray(instructions)) {
    return [];
  }

  return instructions
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          step: index + 1,
          instruction: item.trim(),
        };
      }

      return {
        step: cleanNumber(
          item?.step,
          index + 1,
          1,
          100
        ),
        instruction: cleanText(
          item?.instruction
        ),
      };
    })
    .filter(
      (item) => item.instruction
    )
    .map((item, index) => ({
      ...item,
      step: index + 1,
    }));
};

const cleanIngredients = (
  ingredients,
  recipeId
) => {
  if (!Array.isArray(ingredients)) {
    return [];
  }

  return ingredients
    .map((ingredient, index) => {
      const name = cleanText(
        ingredient?.name
      );

      if (!name) {
        return null;
      }

      const amount = cleanText(
        ingredient?.amount ||
          ingredient?.measure
      );

      const imageSearchName = cleanText(
        ingredient?.imageSearchName,
        name
      );

      return {
        id: `${recipeId}-ingredient-${
          index + 1
        }`,
        name,
        amount,
        measure: amount,
        preparation: cleanText(
          ingredient?.preparation
        ),
        label:
          cleanText(ingredient?.label) ||
          [amount, name]
            .filter(Boolean)
            .join(" "),
        imageSearchName,
        imageUrl: createIngredientImageUrl(
          imageSearchName
        ),
      };
    })
    .filter(Boolean);
};

const createGeminiError = (
  response,
  errorData
) => {
  const apiMessage =
    errorData?.error?.message ||
    `Gemini request failed with status ${response.status}.`;

  const error = new Error(apiMessage);

  error.status = response.status;

  return error;
};

const getGeminiEndpoint = () => {
  const model = normalizeModelName(
    ENV.GEMINI_MODEL
  );

  return (
    `${GEMINI_API_BASE_URL}/models/` +
    `${encodeURIComponent(model)}` +
    `:generateContent?key=` +
    `${encodeURIComponent(
      ENV.GEMINI_API_KEY
    )}`
  );
};

const askGeminiForJson = async (
  prompt,
  temperature = 0.7
) => {
  if (!ENV.GEMINI_API_KEY) {
    const error = new Error(
      "The GEMINI_API_KEY environment variable is missing."
    );

    error.status = 503;

    throw error;
  }

  const response = await fetch(
    getGeminiEndpoint(),
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],

        generationConfig: {
          temperature,
          topP: 0.9,
          responseMimeType:
            "application/json",
        },
      }),
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw createGeminiError(
      response,
      data
    );
  }

  const text = extractGeminiText(data);

  if (!text) {
    const blockReason =
      data?.promptFeedback?.blockReason;

    if (blockReason) {
      throw new Error(
        `Gemini blocked the request: ${blockReason}.`
      );
    }

    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return text;
};

const createRecipePrompt = ({
  dishName,
  ingredients,
  cuisine,
  dietaryPreference,
  excludedIngredients,
  maximumCookingTime,
  servings,
}) => {
  const requestedDish =
    dishName ||
    "No specific dish requested. Create the best suitable dish from the provided ingredients.";

  const availableIngredients =
    ingredients.length > 0
      ? ingredients.join(", ")
      : "No required ingredients were provided. Choose appropriate ingredients for the requested dish.";

  const excluded =
    excludedIngredients.length > 0
      ? excludedIngredients.join(", ")
      : "None";

  return `
You are a professional recipe developer and food-safety assistant.

Create one practical recipe using the user's preferences.

Requested dish:
${requestedDish}

Available or preferred ingredients:
${availableIngredients}

Cuisine:
${cuisine || "Any cuisine"}

Dietary preference:
${dietaryPreference || "No special preference"}

Ingredients that must not appear:
${excluded}

Maximum total cooking time:
${maximumCookingTime} minutes

Number of servings:
${servings}

Rules:
1. Never include an excluded ingredient.
2. Keep totalTime at or below ${maximumCookingTime} minutes.
3. Give exact quantities for ${servings} servings.
4. Include safe internal cooking temperatures when appropriate.
5. Keep instructions beginner-friendly.
6. Return JSON only.
7. Every ingredient needs a short, common imageSearchName.

Return exactly this JSON shape:

{
  "title": "Recipe title",
  "description": "Short description",
  "cuisine": "Cuisine name",
  "difficulty": "Beginner",
  "prepTime": 10,
  "cookTime": 20,
  "totalTime": 30,
  "servings": ${servings},
  "caloriesPerServing": 400,
  "dietaryLabels": ["High Protein"],
  "ingredients": [
    {
      "name": "chicken breast",
      "amount": "1 pound",
      "preparation": "cut into bite-sized pieces",
      "label": "1 pound chicken breast",
      "imageSearchName": "Chicken Breast"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "instruction": "Complete instruction."
    }
  ],
  "tips": ["Helpful tip."],
  "imagePrompt": "Professional food photography of the finished dish"
}
`.trim();
};

const normalizeRecipe = (
  recipe,
  request
) => {
  const recipeId = `ai-${Date.now()}`;

  const prepTime = cleanNumber(
    recipe?.prepTime,
    10,
    0,
    240
  );

  const cookTime = cleanNumber(
    recipe?.cookTime,
    20,
    0,
    240
  );

  const requestedMaximumTime =
    cleanNumber(
      request.maximumCookingTime,
      240,
      5,
      240
    );

  const totalTime = Math.min(
    cleanNumber(
      recipe?.totalTime,
      prepTime + cookTime,
      0,
      480
    ),
    requestedMaximumTime
  );

  return {
    id: recipeId,

    title: cleanText(
      recipe?.title,
      request.dishName ||
        "AI Generated Recipe"
    ),

    description: cleanText(
      recipe?.description,
      "A personalized recipe generated from your preferences."
    ),

    cuisine: cleanText(
      recipe?.cuisine,
      request.cuisine ||
        "International"
    ),

    difficulty: cleanText(
      recipe?.difficulty,
      "Beginner"
    ),

    prepTime,
    cookTime,
    totalTime,

    servings: cleanNumber(
      recipe?.servings,
      request.servings || 4,
      1,
      20
    ),

    caloriesPerServing:
      cleanNumber(
        recipe?.caloriesPerServing,
        0,
        0,
        5000
      ),

    dietaryLabels: cleanLabels(
      recipe?.dietaryLabels
    ),

    ingredients: cleanIngredients(
      recipe?.ingredients,
      recipeId
    ),

    instructions: cleanInstructions(
      recipe?.instructions
    ),

    tips: cleanTips(recipe?.tips),

    imagePrompt: cleanText(
      recipe?.imagePrompt,
      `Professional food photography of ${
        recipe?.title ||
        request.dishName ||
        "the finished recipe"
      }.`
    ),

    requestedDish:
      request.dishName || null,

    generatedBy: "Google Gemini",

    isAiGenerated: true,
  };
};

const validateRecipe = (recipe) => {
  if (recipe.ingredients.length === 0) {
    throw new Error(
      "Gemini returned a recipe without ingredients."
    );
  }

  if (recipe.instructions.length === 0) {
    throw new Error(
      "Gemini returned a recipe without cooking instructions."
    );
  }

  return recipe;
};

const cleanChatMessages = (messages) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((message) => {
      const role =
        message?.role === "assistant"
          ? "assistant"
          : "user";

      const content = cleanText(
        message?.content
      ).slice(0, 2000);

      if (!content) {
        return null;
      }

      return {
        role,
        content,
      };
    })
    .filter(Boolean)
    .slice(-16);
};

const createChefChatPrompt = (
  messages
) => {
  const conversation = messages
    .map(
      (message) =>
        `${
          message.role === "assistant"
            ? "Chef"
            : "User"
        }: ${message.content}`
    )
    .join("\n");

  return `
You are "Recipe Chef", a warm, practical cooking assistant inside a recipe app.

Your job:
- Answer cooking questions clearly and briefly.
- Help users choose dishes, substitute ingredients, adjust flavors, and solve cooking problems.
- Ask one helpful follow-up question if required information is missing.
- Give food-safety guidance when it is relevant.
- Never claim an allergy-safe recipe is guaranteed. Encourage users with severe allergies to verify ingredients.

Recipe behavior:
- Only include suggestedRecipe when the user asks for a complete recipe OR gives enough information to create one.
- Otherwise, suggestedRecipe must be null.
- When you include a recipe, make it complete and beginner friendly.

Conversation:
${conversation}

Return JSON only, exactly in this format:

{
  "reply": "Your helpful response to the user.",
  "suggestedRecipe": null
}

If a complete recipe is appropriate, use this shape instead:

{
  "reply": "Short message introducing the recipe.",
  "suggestedRecipe": {
    "title": "Recipe title",
    "description": "Short description",
    "cuisine": "Cuisine name",
    "difficulty": "Beginner",
    "prepTime": 10,
    "cookTime": 20,
    "totalTime": 30,
    "servings": 4,
    "caloriesPerServing": 400,
    "dietaryLabels": ["Vegetarian"],
    "ingredients": [
      {
        "name": "ingredient name",
        "amount": "1 cup",
        "preparation": "optional preparation",
        "label": "1 cup ingredient name",
        "imageSearchName": "Common Ingredient Name"
      }
    ],
    "instructions": [
      {
        "step": 1,
        "instruction": "Clear beginner-friendly instruction."
      }
    ],
    "tips": ["Useful tip."],
    "imagePrompt": "Professional food photography of the finished dish"
  }
}
`.trim();
};

const cleanSecondServingList = (
  values,
  maximumItems = 20
) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => {
      if (typeof value === "string") {
        return cleanText(value).slice(0, 160);
      }

      if (value && typeof value === "object") {
        return cleanText(
          value.label ||
            value.name ||
            value.ingredient ||
            value.instruction
        ).slice(0, 160);
      }

      return "";
    })
    .filter(Boolean)
    .slice(0, maximumItems);
};

const cleanSecondServingFavorite = (
  favoriteRecipe
) => {
  const source =
    favoriteRecipe &&
    typeof favoriteRecipe === "object"
      ? favoriteRecipe
      : {};

  const title = cleanText(
    source.title,
    "Saved recipe"
  ).slice(0, 160);

  return {
    title,

    ingredients: cleanSecondServingList(
      source.ingredients,
      30
    ),

    instructions: cleanSecondServingList(
      source.instructions,
      20
    ),

    personalNote: cleanText(
      source.personalNote
    ).slice(0, 1000),

    cookTime: cleanText(
      source.cookTime
    ).slice(0, 80),

    servings: cleanText(
      String(source.servings || "")
    ).slice(0, 30),
  };
};

const createSecondServingPrompt = ({
  favoriteRecipe,
  leftovers,
  useSoonIngredients,
  tasteNote,
  servings,
}) => {
  const sourceIngredients =
    favoriteRecipe.ingredients.length > 0
      ? favoriteRecipe.ingredients.join(", ")
      : "No ingredient list was saved.";

  const sourceInstructions =
    favoriteRecipe.instructions.length > 0
      ? favoriteRecipe.instructions.join(" ")
      : "No original instructions were saved.";

  const leftoverList =
    leftovers.length > 0
      ? leftovers.join(", ")
      : "No specific leftovers were entered.";

  const useSoonList =
    useSoonIngredients.length > 0
      ? useSoonIngredients.join(", ")
      : "No use-soon ingredients were entered.";

  return `
You are "Recipe Chef", a practical leftover-rescue assistant in a recipe app.

Create one new meal called a "Second Serving." It should transform a saved dish and the user's leftovers into a fresh, appealing meal. Do not simply tell the user to reheat the original recipe.

Saved favorite recipe:
Title: ${favoriteRecipe.title}
Original ingredients: ${sourceIngredients}
Original instructions: ${sourceInstructions}
Original cook time: ${
    favoriteRecipe.cookTime || "Not provided"
  }
Original servings: ${
    favoriteRecipe.servings || "Not provided"
  }
User's saved taste note: ${
    favoriteRecipe.personalNote || "No personal note"
  }

Leftovers available now:
${leftoverList}

Ingredients that should be used soon:
${useSoonList}

Extra taste request:
${tasteNote || "No extra request"}

Requested servings:
${servings}

Rules:
1. Make a genuinely different second meal, such as a bowl, wrap, fried rice, soup, salad, skillet, quesadilla, or bake when suitable.
2. Prioritize leftovers and use-soon ingredients before adding optional pantry items.
3. Respect the saved taste note and the extra taste request.
4. Keep the recipe realistic, beginner-friendly, and practical for ${servings} servings.
5. Use only common optional pantry staples such as oil, salt, pepper, garlic, onions, water, broth, or basic seasonings when needed.
6. Include safe reheating guidance when using cooked leftovers. State that leftovers should be reheated until steaming hot, and meat should reach 165°F (74°C) when applicable.
7. Do not claim food is safe if its storage history is unknown.
8. Return JSON only.
9. Every recipe ingredient requires a short, common imageSearchName.

Return exactly this JSON shape:

{
  "reply": "A warm, short explanation of why this is a great Second Serving.",
  "useFirst": [
    "Ingredient or leftover to use soon"
  ],
  "suggestedRecipe": {
    "title": "New meal title",
    "description": "Short description",
    "cuisine": "Cuisine name",
    "difficulty": "Beginner",
    "prepTime": 10,
    "cookTime": 15,
    "totalTime": 25,
    "servings": ${servings},
    "caloriesPerServing": 400,
    "dietaryLabels": ["High Protein"],
    "ingredients": [
      {
        "name": "cooked chicken",
        "amount": "2 cups",
        "preparation": "shredded",
        "label": "2 cups cooked chicken, shredded",
        "imageSearchName": "Chicken"
      }
    ],
    "instructions": [
      {
        "step": 1,
        "instruction": "Clear beginner-friendly instruction."
      }
    ],
    "tips": [
      "Useful leftover or food-safety tip."
    ],
    "imagePrompt": "Professional food photography of the finished dish"
  }
}
`.trim();
};

export const generateRecipeWithGemini =
  async ({
    dishName = "",
    ingredients = [],
    cuisine = "",
    dietaryPreference = "",
    excludedIngredients = [],
    maximumCookingTime = 45,
    servings = 4,
  }) => {
    const request = {
      dishName: cleanText(dishName),

      ingredients: Array.isArray(ingredients)
        ? ingredients
            .map((item) =>
              cleanText(String(item))
            )
            .filter(Boolean)
        : [],

      cuisine: cleanText(cuisine),

      dietaryPreference: cleanText(
        dietaryPreference
      ),

      excludedIngredients: Array.isArray(
        excludedIngredients
      )
        ? excludedIngredients
            .map((item) =>
              cleanText(String(item))
            )
            .filter(Boolean)
        : [],

      maximumCookingTime: cleanNumber(
        maximumCookingTime,
        45,
        5,
        240
      ),

      servings: cleanNumber(
        servings,
        4,
        1,
        20
      ),
    };

    if (
      !request.dishName &&
      request.ingredients.length === 0
    ) {
      const error = new Error(
        "Enter a dish name or at least one ingredient."
      );

      error.status = 400;

      throw error;
    }

    const text = await askGeminiForJson(
      createRecipePrompt(request),
      0.7
    );

    const parsedRecipe = parseGeminiJson(
      text,
      "Gemini returned recipe data that could not be read."
    );

    return validateRecipe(
      normalizeRecipe(
        parsedRecipe,
        request
      )
    );
  };

export const chatWithRecipeChef = async ({
  messages = [],
}) => {
  const cleanedMessages =
    cleanChatMessages(messages);

  if (cleanedMessages.length === 0) {
    const error = new Error(
      "Send at least one message to Recipe Chef."
    );

    error.status = 400;

    throw error;
  }

  const text = await askGeminiForJson(
    createChefChatPrompt(
      cleanedMessages
    ),
    0.65
  );

  const parsedResponse = parseGeminiJson(
    text,
    "Gemini returned a chat response that could not be read."
  );

  const reply = cleanText(
    parsedResponse?.reply,
    "I’m sorry, I could not prepare a response. Please try again."
  );

  const rawRecipe =
    parsedResponse?.suggestedRecipe;

  if (
    !rawRecipe ||
    typeof rawRecipe !== "object"
  ) {
    return {
      reply,
      suggestedRecipe: null,
    };
  }

  try {
    const suggestedRecipe = validateRecipe(
      normalizeRecipe(rawRecipe, {
        dishName: cleanText(
          rawRecipe?.title
        ),
        cuisine: cleanText(
          rawRecipe?.cuisine
        ),
        maximumCookingTime: 240,
        servings: cleanNumber(
          rawRecipe?.servings,
          4,
          1,
          20
        ),
      })
    );

    return {
      reply,
      suggestedRecipe,
    };
  } catch {
    return {
      reply,
      suggestedRecipe: null,
    };
  }
};

export const createSecondServingSuggestion =
  async ({
    favoriteRecipe = null,
    leftovers = [],
    useSoonIngredients = [],
    tasteNote = "",
    servings = 2,
  }) => {
    const cleanedFavoriteRecipe =
      cleanSecondServingFavorite(
        favoriteRecipe
      );

    const cleanedLeftovers =
      cleanSecondServingList(leftovers);

    const cleanedUseSoonIngredients =
      cleanSecondServingList(
        useSoonIngredients
      );

    const cleanedTasteNote = cleanText(
      tasteNote
    ).slice(0, 1000);

    const safeServings = cleanNumber(
      servings,
      2,
      1,
      20
    );

    const hasRecipeDetails =
      cleanedFavoriteRecipe.ingredients.length >
        0 ||
      cleanedFavoriteRecipe.instructions.length >
        0;

    if (
      !hasRecipeDetails &&
      cleanedLeftovers.length === 0 &&
      cleanedUseSoonIngredients.length === 0
    ) {
      const error = new Error(
        "Add leftovers, use-soon ingredients, or a saved recipe before creating a Second Serving."
      );

      error.status = 400;

      throw error;
    }

    const text = await askGeminiForJson(
      createSecondServingPrompt({
        favoriteRecipe: cleanedFavoriteRecipe,
        leftovers: cleanedLeftovers,
        useSoonIngredients:
          cleanedUseSoonIngredients,
        tasteNote: cleanedTasteNote,
        servings: safeServings,
      }),
      0.55
    );

    const parsedResponse = parseGeminiJson(
      text,
      "Gemini returned a Second Serving response that could not be read."
    );

    const reply = cleanText(
      parsedResponse?.reply,
      "Here is a fresh way to turn what you have into another great meal."
    );

    const useFirst = cleanSecondServingList(
      parsedResponse?.useFirst,
      8
    );

    const rawRecipe =
      parsedResponse?.suggestedRecipe;

    if (
      !rawRecipe ||
      typeof rawRecipe !== "object"
    ) {
      throw new Error(
        "Gemini did not return a Second Serving recipe."
      );
    }

    const suggestedRecipe = validateRecipe(
      normalizeRecipe(rawRecipe, {
        dishName: cleanText(
          rawRecipe?.title,
          `Second Serving: ${cleanedFavoriteRecipe.title}`
        ),
        cuisine: cleanText(
          rawRecipe?.cuisine,
          "Leftover Rescue"
        ),
        maximumCookingTime: 240,
        servings: safeServings,
      })
    );

    return {
      reply,
      useFirst,
      suggestedRecipe,
    };
  };