import express from "express";
import { and, eq } from "drizzle-orm";
import { favoritesTable } from "../db/schema.js";
import { sessionAuth } from "../middleware/sessionAuth.js";

export function createFavoritesRouter({ db, env = process.env, verifySession } = {}) {
const router = express.Router();
const ENV = { NODE_ENV: env.NODE_ENV };
router.use(sessionAuth({ env, verifySession }));
router.param("userId", (request, response, next, userId) => {
  if (userId !== request.userId) return response.status(403).json({ message: "You can only access your own favorites." });
  next();
});
router.post("", async (request, response) => {
  try {
    const {
      recipeId,
      title,
      image,
      cookTime,
      servings,
      ingredients,
      instructions,
      personalNote,
    } = request.body || {};

    const userId = request.userId;
    if (!recipeId || !title) {
      return response.status(400).json({
        success: false,
        message: "Recipe ID and title are required.",
      });
    }

    const safeRecipeId = String(recipeId);

    const existingFavorite = await db
      .select()
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, userId),
          eq(favoritesTable.recipeId, safeRecipeId)
        )
      );

    if (existingFavorite.length > 0) {
      return response.status(200).json({
        success: true,
        message: "Recipe is already in favorites.",
        favorite: existingFavorite[0],
      });
    }

    const newFavorite = await db
      .insert(favoritesTable)
      .values({
        userId,
        recipeId: safeRecipeId,
        title,
        image: image || null,
        cookTime: cookTime || null,
        servings:
          servings !== undefined && servings !== null
            ? String(servings)
            : null,
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        instructions: Array.isArray(instructions) ? instructions : [],
        personalNote: personalNote || null,
      })
      .returning();

    return response.status(201).json({
      success: true,
      message: "Recipe added to favorites.",
      favorite: newFavorite[0],
    });
  } catch (error) {
    console.error("Error adding favorite:", error);

    return response.status(500).json({
      success: false,
      message: "The recipe could not be added to favorites.",
      ...(ENV.NODE_ENV !== "production" && {
        developerMessage: error.message,
      }),
    });
  }
});

router.get("/:userId", async (request, response) => {
  try {
    const userId = request.userId;

    const userFavorites = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));

    return response.status(200).json(userFavorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);

    return response.status(500).json({
      success: false,
      message: "Favorites could not be loaded.",
      ...(ENV.NODE_ENV !== "production" && {
        developerMessage: error.message,
      }),
    });
  }
});

router.put(
  "/:userId/:recipeId",
  async (request, response) => {
    try {
      const { recipeId } = request.params;
      const userId = request.userId;
      const {
        title,
        image,
        cookTime,
        servings,
        ingredients,
        instructions,
        personalNote,
      } = request.body || {};

      const updates = {
        updatedAt: new Date(),
      };

      if (typeof title === "string" && title.trim()) {
        updates.title = title.trim();
      }

      if (image !== undefined) {
        updates.image = image || null;
      }

      if (cookTime !== undefined) {
        updates.cookTime = cookTime || null;
      }

      if (servings !== undefined && servings !== null) {
        updates.servings = String(servings);
      }

      if (Array.isArray(ingredients)) {
        updates.ingredients = ingredients;
      }

      if (Array.isArray(instructions)) {
        updates.instructions = instructions;
      }

      if (personalNote !== undefined) {
        updates.personalNote = personalNote || null;
      }

      const updatedFavorite = await db
        .update(favoritesTable)
        .set(updates)
        .where(
          and(
            eq(favoritesTable.userId, userId),
            eq(favoritesTable.recipeId, String(recipeId))
          )
        )
        .returning();

      if (updatedFavorite.length === 0) {
        return response.status(404).json({
          success: false,
          message: "Favorite recipe not found.",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Favorite recipe updated.",
        favorite: updatedFavorite[0],
      });
    } catch (error) {
      console.error("Error updating favorite:", error);

      return response.status(500).json({
        success: false,
        message: "The favorite recipe could not be updated.",
        ...(ENV.NODE_ENV !== "production" && {
          developerMessage: error.message,
        }),
      });
    }
  }
);

router.delete(
  "/:userId/:recipeId",
  async (request, response) => {
    try {
      const { recipeId } = request.params;
      const userId = request.userId;

      const deletedFavorite = await db
        .delete(favoritesTable)
        .where(
          and(
            eq(favoritesTable.userId, userId),
            eq(favoritesTable.recipeId, String(recipeId))
          )
        )
        .returning();

      if (deletedFavorite.length === 0) {
        return response.status(404).json({
          success: false,
          message: "Favorite recipe not found.",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Recipe removed from favorites.",
      });
    } catch (error) {
      console.error("Error deleting favorite:", error);

      return response.status(500).json({
        success: false,
        message: "The recipe could not be removed from favorites.",
        ...(ENV.NODE_ENV !== "production" && {
          developerMessage: error.message,
        }),
      });
    }
  }
);

return router;
}
