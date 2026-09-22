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

const isFinalRecipeRequest = (
  messages
) => {
  const latestUserMessage = [
    ...messages,
  ]
    .reverse()
    .find(
      (message) => message.role === "user"
    );

  if (!latestUserMessage) {
    return false;
  }

  const userText =
    latestUserMessage.content.toLowerCase();

  const explicitFinalRecipePattern =
    /\b(make|create|show|give|write|generate)\b[\s\S]{0,60}\b(final|complete|full)\s+\b(recipe|dish)\b/i;

  const readyToCookPattern =
    /\b(i am ready to cook|i'm ready to cook|i am ready for the recipe|i'm ready for the recipe|give me the ingredients and instructions|send me the ingredients and instructions)\b/i;

  if (
    explicitFinalRecipePattern.test(userText) ||
    readyToCookPattern.test(userText)
  ) {
    return true;
  }

  const latestUserIndex =
    messages.lastIndexOf(latestUserMessage);

  const previousMessage =
    messages[latestUserIndex - 1];

  const isSimpleConfirmation =
    /^(yes|yes please|please|sure|go ahead|do it|sounds good|let's do it)[!. ]*$/i.test(
      latestUserMessage.content
    );

  const chefAskedForFinalRecipe =
    previousMessage?.role === "assistant" &&
    /\b(final|complete|full)\s+recipe\b/i.test(
      previousMessage.content
    );

  return Boolean(
    isSimpleConfirmation &&
      chefAskedForFinalRecipe
  );
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

You must behave like a real conversational cooking assistant.

Your job:
- Answer the user's cooking questions naturally and clearly.
- Help users choose dishes, substitute ingredients, adjust flavors, scale servings, and solve cooking problems.
- Remember information the user already provided earlier in this conversation.
- Ask one helpful follow-up question when more information would improve the dish.
- Give food-safety guidance when relevant.
- Never claim an allergy-safe recipe is guaranteed.

IMPORTANT CONVERSATION RULE:
Do NOT create a complete recipe merely because the user listed ingredients or asked what they can make.

Continue the conversation until the user clearly asks to create the final recipe.

Only include suggestedRecipe when the latest user message explicitly asks for a final recipe, for example:
- "Make the final recipe"
- "Show me the final recipe"
- "Give me the complete recipe"
- "I am ready to cook"
- "Create the recipe now"
- "Write the recipe"
- "Give me the ingredients and instructions"

If the user has shared enough information but has not asked for the final recipe:
- Give a helpful answer or dish suggestion.
- Ask one useful question if needed.
- Otherwise ask: "Would you like me to create the final recipe now?"
- Set suggestedRecipe to null.

For normal questions such as:
- "Can I use shrimp instead?"
- "How can I make it spicy?"
- "Can I make it dairy-free?"
- "What can I substitute for eggs?"

Answer naturally and set suggestedRecipe to null.

Conversation:
${conversation}

Return JSON only, exactly in this format while continuing the conversation:

{
  "reply": "Your helpful, conversational response to the user.",
  "suggestedRecipe": null
}

Return JSON only in this format when the user explicitly requests the final recipe:

{
  "reply": "Here is your final personalized recipe. You can save it to My Cookbook if you like it.",
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
    "dietaryLabels": ["High Protein"],
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

  const shouldCreateFinalRecipe =
    isFinalRecipeRequest(cleanedMessages);

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

  /*
   * This check is intentional: even if Gemini
   * accidentally returns a recipe too early,
   * the API will not send it to the mobile app.
   */
  const rawRecipe =
    shouldCreateFinalRecipe
      ? parsedResponse?.suggestedRecipe
      : null;

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