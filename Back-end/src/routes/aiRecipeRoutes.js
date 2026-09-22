import express from "express";

import { ENV } from "../config/env.js";
import {
  chatWithRecipeChef,
  createSecondServingSuggestion,
  generateRecipeWithGemini,
} from "../services/geminiRecipeService.js";

const router = express.Router();

const cleanText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const cleanStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
};

const cleanChatMessages = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((message) => {
      const content = cleanText(
        message?.content
      );

      if (!content) {
        return null;
      }

      return {
        role:
          message?.role === "assistant"
            ? "assistant"
            : "user",

        content: content.slice(0, 2000),
      };
    })
    .filter(Boolean)
    .slice(-16);
};

const cleanRecipeEntries = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return cleanText(item);
      }

      if (!item || typeof item !== "object") {
        return "";
      }

      const amount = cleanText(
        item.amount || item.measure
      );

      const name = cleanText(
        item.name || item.label
      );

      const preparation = cleanText(
        item.preparation
      );

      return [amount, name, preparation]
        .filter(Boolean)
        .join(" ");
    })
    .filter(Boolean)
    .slice(0, 30)
    .map((item) => item.slice(0, 250));
};

const cleanInstructionEntries = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return cleanText(item);
      }

      if (!item || typeof item !== "object") {
        return "";
      }

      return cleanText(
        item.instruction || item.text
      );
    })
    .filter(Boolean)
    .slice(0, 20)
    .map((item) => item.slice(0, 700));
};

const cleanFavoriteRecipe = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const title = cleanText(value.title);

  const ingredients = cleanRecipeEntries(
    value.ingredients
  );

  const instructions = cleanInstructionEntries(
    value.instructions
  );

  const personalNote = cleanText(
    value.personalNote
  ).slice(0, 1200);

  const cookTime = cleanText(
    value.cookTime || value.totalTime
  ).slice(0, 100);

  const servings = cleanText(
    value.servings
  ).slice(0, 30);

  if (
    !title &&
    ingredients.length === 0 &&
    instructions.length === 0
  ) {
    return null;
  }

  return {
    title: title.slice(0, 160),
    ingredients,
    instructions,
    personalNote,
    cookTime,
    servings,
  };
};

const createSafeNumber = (
  value,
  fallback,
  minimum,
  maximum
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

const getErrorStatus = (error) => {
  const message =
    error?.message?.toLowerCase() || "";

  const status =
    error?.status ||
    error?.statusCode ||
    error?.response?.status;

  if (status === 400) {
    return 400;
  }

  if (
    status === 401 ||
    status === 403 ||
    message.includes("api key") ||
    message.includes("permission denied")
  ) {
    return 503;
  }

  if (
    status === 429 ||
    message.includes("too many requests") ||
    message.includes("high demand") ||
    message.includes("quota") ||
    message.includes("rate limit")
  ) {
    return 429;
  }

  return 500;
};

const getPublicErrorMessage = (
  status
) => {
  if (status === 400) {
    return "Please check your request and try again.";
  }

  if (status === 429) {
    return "Recipe Chef is busy right now. Please wait a moment and try again.";
  }

  if (status === 503) {
    return "The AI recipe service is not configured correctly.";
  }

  return "The AI recipe service is temporarily unavailable.";
};

/*
 * GET /api/ai/recipes/health
 */
router.get("/health", (request, response) => {
  return response.status(200).json({
    success: true,
    service: "AI Recipe Chef",
    provider: "Google Gemini",
    model: ENV.GEMINI_MODEL,
    configured: Boolean(ENV.GEMINI_API_KEY),
    message:
      "Gemini AI recipe and chat routes are available.",
  });
});

/*
 * POST /api/ai/recipes/generate
 *
 * Keeps the original recipe-builder flow.
 */
router.post(
  "/generate",
  async (request, response) => {
    try {
      const {
        dishName,
        ingredients,
        cuisine,
        dietaryPreference,
        excludedIngredients,
        maximumCookingTime,
        servings,
      } = request.body || {};

      const cleanedDishName =
        cleanText(dishName);

      const cleanedIngredients =
        cleanStringArray(ingredients);

      const cleanedCuisine =
        cleanText(cuisine);

      const cleanedDietaryPreference =
        cleanText(dietaryPreference);

      const cleanedExcludedIngredients =
        cleanStringArray(
          excludedIngredients
        );

      const safeMaximumCookingTime =
        createSafeNumber(
          maximumCookingTime,
          45,
          5,
          240
        );

      const safeServings =
        createSafeNumber(
          servings,
          4,
          1,
          20
        );

      if (
        !cleanedDishName &&
        cleanedIngredients.length === 0
      ) {
        return response.status(400).json({
          success: false,
          message:
            "Enter a dish name or at least one ingredient.",
        });
      }

      if (cleanedDishName.length > 120) {
        return response.status(400).json({
          success: false,
          message:
            "The dish name must be 120 characters or fewer.",
        });
      }

      if (cleanedIngredients.length > 30) {
        return response.status(400).json({
          success: false,
          message:
            "A maximum of 30 ingredients is allowed.",
        });
      }

      if (
        cleanedExcludedIngredients.length >
        20
      ) {
        return response.status(400).json({
          success: false,
          message:
            "A maximum of 20 excluded ingredients is allowed.",
        });
      }

      const recipe =
        await generateRecipeWithGemini({
          dishName: cleanedDishName,
          ingredients: cleanedIngredients,
          cuisine: cleanedCuisine,
          dietaryPreference:
            cleanedDietaryPreference,
          excludedIngredients:
            cleanedExcludedIngredients,
          maximumCookingTime:
            safeMaximumCookingTime,
          servings: safeServings,
        });

      return response.status(200).json({
        success: true,
        message:
          "Recipe generated successfully.",
        recipe,
      });
    } catch (error) {
      console.error(
        "Gemini recipe generation error:",
        error
      );

      const status = getErrorStatus(error);

      return response.status(status).json({
        success: false,
        message:
          getPublicErrorMessage(status),

        ...(ENV.NODE_ENV !==
          "production" && {
          developerMessage:
            error?.message ||
            "Unknown Gemini service error.",
        }),
      });
    }
  }
);

/*
 * POST /api/ai/recipes/chat
 *
 * The mobile app sends a short conversation:
 *
 * {
 *   "messages": [
 *     { "role": "user", "content": "I have chicken and rice." }
 *   ]
 * }
 */
router.post(
  "/chat",
  async (request, response) => {
    try {
      const messages = cleanChatMessages(
        request.body?.messages
      );

      if (messages.length === 0) {
        return response.status(400).json({
          success: false,
          message:
            "Send a message to Recipe Chef.",
        });
      }

      const result =
        await chatWithRecipeChef({
          messages,
        });

      return response.status(200).json({
        success: true,
        message:
          "Recipe Chef replied successfully.",
        reply: result.reply,
        suggestedRecipe:
          result.suggestedRecipe,
      });
    } catch (error) {
      console.error(
        "Gemini Recipe Chef chat error:",
        error
      );

      const status = getErrorStatus(error);

      return response.status(status).json({
        success: false,
        message:
          getPublicErrorMessage(status),

        ...(ENV.NODE_ENV !==
          "production" && {
          developerMessage:
            error?.message ||
            "Unknown Gemini service error.",
        }),
      });
    }
  }
);

/*
 * POST /api/ai/recipes/second-serving
 *
 * Turns leftovers and soon-to-expire ingredients
 * into a different next meal.
 */
router.post(
  "/second-serving",
  async (request, response) => {
    try {
      const favoriteRecipe =
        cleanFavoriteRecipe(
          request.body?.favoriteRecipe
        );

      const leftovers = cleanStringArray(
        request.body?.leftovers
      )
        .slice(0, 20)
        .map((item) => item.slice(0, 160));

      const useSoonIngredients =
        cleanStringArray(
          request.body?.useSoonIngredients
        )
          .slice(0, 20)
          .map((item) => item.slice(0, 160));

      const tasteNote = cleanText(
        request.body?.tasteNote
      ).slice(0, 1200);

      const servings = createSafeNumber(
        request.body?.servings ||
          favoriteRecipe?.servings,
        2,
        1,
        20
      );

      if (
        !favoriteRecipe &&
        leftovers.length === 0 &&
        useSoonIngredients.length === 0
      ) {
        return response.status(400).json({
          success: false,
          message:
            "Add a saved recipe, leftovers, or ingredients to use soon.",
        });
      }

      const result =
        await createSecondServingSuggestion({
          favoriteRecipe,
          leftovers,
          useSoonIngredients,
          tasteNote,
          servings,
        });

      return response.status(200).json({
        success: true,
        message:
          "Your Second Serving idea is ready.",
        reply: result.reply,
        useFirst: result.useFirst,
        suggestedRecipe:
          result.suggestedRecipe,
      });
    } catch (error) {
      console.error(
        "Second Serving generation error:",
        error
      );

      const status = getErrorStatus(error);

      return response.status(status).json({
        success: false,
        message:
          getPublicErrorMessage(status),

        ...(ENV.NODE_ENV !==
          "production" && {
          developerMessage:
            error?.message ||
            "Unknown Gemini service error.",
        }),
      });
    }
  }
);

export default router;