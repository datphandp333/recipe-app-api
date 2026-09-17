import { ENV } from "../config/env.js";

const GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";

const normalizeModelName = (modelName) => {
  const cleanedModelName =
    String(modelName || "").trim();

  if (!cleanedModelName) {
    return "gemini-3.5-flash-lite";
  }

  return cleanedModelName.replace(
    /^models\//,
    ""
  );
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

const parseGeminiJson = (text) => {
  const cleanedText =
    removeJsonCodeBlock(text);

  try {
    return JSON.parse(cleanedText);
  } catch {
    /*
     * If Gemini adds text before or after the JSON,
     * attempt to extract the main JSON object.
     */
    const firstBrace =
      cleanedText.indexOf("{");

    const lastBrace =
      cleanedText.lastIndexOf("}");

    if (
      firstBrace === -1 ||
      lastBrace === -1 ||
      lastBrace <= firstBrace
    ) {
      throw new Error(
        "Gemini did not return a valid recipe object."
      );
    }

    const jsonText = cleanedText.slice(
      firstBrace,
      lastBrace + 1
    );

    try {
      return JSON.parse(jsonText);
    } catch {
      throw new Error(
        "Gemini returned recipe data that could not be read."
      );
    }
  }
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
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(minimum, Math.round(number))
  );
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
        step:
          cleanNumber(
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

const cleanTips = (tips) => {
  if (!Array.isArray(tips)) {
    return [];
  }

  return tips
    .map((tip) => cleanText(tip))
    .filter(Boolean)
    .slice(0, 8);
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

      /*
       * imageSearchName should be a short,
       * common ingredient name.
       *
       * Examples:
       *
       * "dried pho rice noodles"
       * becomes "Rice Noodles"
       *
       * "thinly sliced beef sirloin"
       * becomes "Beef"
       *
       * "low-sodium beef broth"
       * becomes "Beef Stock"
       */
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
        imageUrl:
          createIngredientImageUrl(
            imageSearchName
          ),
      };
    })
    .filter(Boolean);
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

USER REQUEST

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

IMPORTANT RULES

1. If a requested dish is provided, create that specific dish.
2. If the requested dish conflicts with a dietary restriction or excluded ingredient, adapt the dish safely.
3. Use the provided ingredients when they reasonably belong in the requested dish.
4. You may add common ingredients needed to complete the recipe.
5. Never include any excluded ingredient.
6. Keep totalTime at or below ${maximumCookingTime} minutes.
7. Give exact ingredient quantities for ${servings} servings.
8. Include safe internal cooking temperatures when meat, poultry, seafood, or eggs are used.
9. Keep every instruction clear enough for a beginner.
10. Return JSON only. Do not include Markdown or explanations outside the JSON.
11. Every ingredient must contain imageSearchName.
12. imageSearchName must be a short, common, singular ingredient name that an ingredient image database is likely to recognize.
13. Remove descriptive words from imageSearchName.

IMAGE SEARCH NAME EXAMPLES

- "dried pho rice noodles" -> "Rice Noodles"
- "thinly sliced beef sirloin" -> "Beef"
- "fresh bean sprouts" -> "Bean Sprouts"
- "low sodium beef broth" -> "Beef Stock"
- "fresh cilantro leaves" -> "Cilantro"
- "extra virgin olive oil" -> "Olive Oil"
- "boneless skinless chicken breast" -> "Chicken Breast"

Return exactly this JSON structure:

{
  "title": "Recipe title",
  "description": "A short and appealing description",
  "cuisine": "Cuisine name",
  "difficulty": "Beginner, Intermediate, or Advanced",
  "prepTime": 10,
  "cookTime": 20,
  "totalTime": 30,
  "servings": ${servings},
  "caloriesPerServing": 400,
  "dietaryLabels": [
    "High Protein"
  ],
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
      "instruction": "Complete instruction for this step."
    }
  ],
  "tips": [
    "Helpful preparation or food-safety tip."
  ],
  "imagePrompt": "A detailed professional food photography description of the finished dish"
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

  const calculatedTotalTime =
    prepTime + cookTime;

  const requestedMaximumTime =
    cleanNumber(
      request.maximumCookingTime,
      45,
      5,
      240
    );

  const totalTime = Math.min(
    cleanNumber(
      recipe?.totalTime,
      calculatedTotalTime,
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
      request.servings,
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
    instructions:
      cleanInstructions(
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
    if (!ENV.GEMINI_API_KEY) {
      const error = new Error(
        "The GEMINI_API_KEY environment variable is missing."
      );

      error.status = 503;

      throw error;
    }

    const request = {
      dishName: cleanText(dishName),
      ingredients:
        Array.isArray(ingredients)
          ? ingredients
          : [],
      cuisine: cleanText(cuisine),
      dietaryPreference: cleanText(
        dietaryPreference
      ),
      excludedIngredients:
        Array.isArray(
          excludedIngredients
        )
          ? excludedIngredients
          : [],
      maximumCookingTime:
        cleanNumber(
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

    const model = normalizeModelName(
      ENV.GEMINI_MODEL
    );

    const endpoint =
      `${GEMINI_API_BASE_URL}/models/` +
      `${encodeURIComponent(model)}` +
      `:generateContent?key=` +
      `${encodeURIComponent(
        ENV.GEMINI_API_KEY
      )}`;

    const prompt =
      createRecipePrompt(request);

    const response = await fetch(endpoint, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
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
          temperature: 0.7,
          topP: 0.9,
          responseMimeType:
            "application/json",
        },
      }),
    });

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw createGeminiError(
        response,
        data
      );
    }

    const text =
      extractGeminiText(data);

    if (!text) {
      const blockReason =
        data?.promptFeedback?.blockReason;

      if (blockReason) {
        throw new Error(
          `Gemini blocked the request: ${blockReason}.`
        );
      }

      throw new Error(
        "Gemini returned an empty recipe response."
      );
    }

    const parsedRecipe =
      parseGeminiJson(text);

    const normalizedRecipe =
      normalizeRecipe(
        parsedRecipe,
        request
      );

    if (
      normalizedRecipe.ingredients
        .length === 0
    ) {
      throw new Error(
        "Gemini returned a recipe without ingredients."
      );
    }

    if (
      normalizedRecipe.instructions
        .length === 0
    ) {
      throw new Error(
        "Gemini returned a recipe without cooking instructions."
      );
    }

    return normalizedRecipe;
  };