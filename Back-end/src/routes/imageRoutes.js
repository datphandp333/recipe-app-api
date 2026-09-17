import express from "express";

import { ENV } from "../config/env.js";
import {
  isPexelsConfigured,
  searchDishPhoto,
  searchIngredientPhoto,
  searchIngredientPhotos,
} from "../services/pexelsImageService.js";

const router = express.Router();

const cleanText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const createDeveloperError = (error) => {
  if (ENV.NODE_ENV === "production") {
    return {};
  }

  return {
    developerMessage:
      error?.message ||
      "Unknown image service error.",
  };
};

/*
 * GET /api/images/health
 */
router.get("/health", (request, response) => {
  return response.status(200).json({
    success: true,
    service: "Food Image Search",
    provider: "Pexels",
    configured:
      isPexelsConfigured(),
    message:
      "Food image search route is available.",
  });
});

/*
 * POST /api/images/dish
 *
 * Body:
 * {
 *   "dishName": "Vietnamese beef pho",
 *   "cuisine": "Vietnamese"
 * }
 */
router.post(
  "/dish",
  async (request, response) => {
    try {
      const dishName = cleanText(
        request.body?.dishName
      );

      const cuisine = cleanText(
        request.body?.cuisine
      );

      if (!dishName) {
        return response.status(400).json({
          success: false,
          message:
            "A dish name is required.",
        });
      }

      if (dishName.length > 120) {
        return response.status(400).json({
          success: false,
          message:
            "The dish name must be 120 characters or fewer.",
        });
      }

      if (!isPexelsConfigured()) {
        return response.status(503).json({
          success: false,
          message:
            "The Pexels image service is not configured.",
        });
      }

      const photo =
        await searchDishPhoto({
          dishName,
          cuisine,
        });

      if (!photo) {
        return response.status(404).json({
          success: false,
          message:
            "No photo was found for this dish.",
          photo: null,
        });
      }

      return response.status(200).json({
        success: true,
        message:
          "Dish photo found.",
        photo,
      });
    } catch (error) {
      console.error(
        "Dish photo search failed:",
        error
      );

      const status =
        error?.status === 429
          ? 429
          : 500;

      return response.status(status).json({
        success: false,
        message:
          status === 429
            ? "The image search limit has been reached. Please try again later."
            : "The dish photo could not be loaded.",
        ...createDeveloperError(error),
      });
    }
  }
);

/*
 * POST /api/images/ingredient
 *
 * Body:
 * {
 *   "ingredientName": "cilantro"
 * }
 */
router.post(
  "/ingredient",
  async (request, response) => {
    try {
      const ingredientName =
        cleanText(
          request.body?.ingredientName
        );

      if (!ingredientName) {
        return response.status(400).json({
          success: false,
          message:
            "An ingredient name is required.",
        });
      }

      if (ingredientName.length > 100) {
        return response.status(400).json({
          success: false,
          message:
            "The ingredient name must be 100 characters or fewer.",
        });
      }

      if (!isPexelsConfigured()) {
        return response.status(503).json({
          success: false,
          message:
            "The Pexels image service is not configured.",
        });
      }

      const photo =
        await searchIngredientPhoto(
          ingredientName
        );

      if (!photo) {
        return response.status(404).json({
          success: false,
          message:
            "No photo was found for this ingredient.",
          photo: null,
        });
      }

      return response.status(200).json({
        success: true,
        message:
          "Ingredient photo found.",
        photo,
      });
    } catch (error) {
      console.error(
        "Ingredient photo search failed:",
        error
      );

      const status =
        error?.status === 429
          ? 429
          : 500;

      return response.status(status).json({
        success: false,
        message:
          status === 429
            ? "The image search limit has been reached. Please try again later."
            : "The ingredient photo could not be loaded.",
        ...createDeveloperError(error),
      });
    }
  }
);

/*
 * POST /api/images/ingredients
 *
 * Body:
 * {
 *   "ingredients": [
 *     {
 *       "id": "ingredient-1",
 *       "name": "fresh cilantro",
 *       "imageSearchName": "cilantro"
 *     }
 *   ]
 * }
 */
router.post(
  "/ingredients",
  async (request, response) => {
    try {
      const ingredients =
        request.body?.ingredients;

      if (
        !Array.isArray(ingredients) ||
        ingredients.length === 0
      ) {
        return response.status(400).json({
          success: false,
          message:
            "At least one ingredient is required.",
        });
      }

      if (ingredients.length > 20) {
        return response.status(400).json({
          success: false,
          message:
            "A maximum of 20 ingredients can be searched at one time.",
        });
      }

      const cleanedIngredients =
        ingredients
          .map((ingredient, index) => {
            const name = cleanText(
              ingredient?.name
            );

            const imageSearchName =
              cleanText(
                ingredient?.imageSearchName
              );

            if (
              !name &&
              !imageSearchName
            ) {
              return null;
            }

            return {
              id:
                cleanText(
                  ingredient?.id
                ) ||
                `ingredient-${index + 1}`,
              name:
                name ||
                imageSearchName,
              imageSearchName:
                imageSearchName ||
                name,
            };
          })
          .filter(Boolean);

      if (
        cleanedIngredients.length === 0
      ) {
        return response.status(400).json({
          success: false,
          message:
            "The ingredient list does not contain searchable names.",
        });
      }

      if (!isPexelsConfigured()) {
        return response.status(503).json({
          success: false,
          message:
            "The Pexels image service is not configured.",
        });
      }

      const results =
        await searchIngredientPhotos(
          cleanedIngredients,
          20
        );

      return response.status(200).json({
        success: true,
        message:
          "Ingredient photo search completed.",
        results,
      });
    } catch (error) {
      console.error(
        "Ingredient photo batch search failed:",
        error
      );

      const status =
        error?.status === 429
          ? 429
          : 500;

      return response.status(status).json({
        success: false,
        message:
          status === 429
            ? "The image search limit has been reached. Please try again later."
            : "The ingredient photos could not be loaded.",
        ...createDeveloperError(error),
      });
    }
  }
);

export default router;