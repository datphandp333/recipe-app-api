import express from "express";
import cors from "cors";
import { and, eq } from "drizzle-orm";

import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoritesTable } from "./db/schema.js";
import job from "./config/cron.js";
import aiRecipeRoutes from "./routes/aiRecipeRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";

const app = express();
const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === "production") {
  job.start();
}

app.use(
  cors({
    origin: [
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      "http://localhost:19006",
      "http://127.0.0.1:19006",
    ],

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

const isValidArray = (value) => {
  return Array.isArray(value);
};

const getFavoriteById = async (userId, favoriteId) => {
  const favorites = await db
    .select()
    .from(favoritesTable)
    .where(
      and(
        eq(favoritesTable.id, favoriteId),
        eq(favoritesTable.userId, userId)
      )
    );

  return favorites[0] || null;
};

/*
 * Main backend health check.
 */
app.get("/api/health", (request, response) => {
  return response.status(200).json({
    success: true,
    message: "Recipe API is running.",
    environment: ENV.NODE_ENV,
    aiConfigured: Boolean(ENV.GEMINI_API_KEY),
    imageSearchConfigured: Boolean(ENV.PEXELS_API_KEY),
  });
});

/*
 * Gemini AI recipe routes.
 */
app.use("/api/ai/recipes", aiRecipeRoutes);

/*
 * Pexels image search routes.
 */
app.use("/api/images", imageRoutes);

/*
 * Add a recipe to favorites.
 *
 * ingredients, instructions, and personalNote are optional so that
 * previously saved recipes continue to work.
 */
app.post("/api/favorites", async (request, response) => {
  try {
    const {
      userId,
      recipeId,
      title,
      image,
      cookTime,
      servings,
      ingredients,
      instructions,
      personalNote,
    } = request.body;

    if (!userId || !recipeId || !title) {
      return response.status(400).json({
        success: false,
        message: "User ID, recipe ID and title are required.",
      });
    }

    const numericRecipeId = Number(recipeId);

    if (!Number.isFinite(numericRecipeId)) {
      return response.status(400).json({
        success: false,
        message: "Recipe ID must be a number.",
      });
    }

    if (
      ingredients !== undefined &&
      !isValidArray(ingredients)
    ) {
      return response.status(400).json({
        success: false,
        message: "Ingredients must be an array.",
      });
    }

    if (
      instructions !== undefined &&
      !isValidArray(instructions)
    ) {
      return response.status(400).json({
        success: false,
        message: "Instructions must be an array.",
      });
    }

    const existingFavorite = await db
      .select()
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, userId),
          eq(favoritesTable.recipeId, numericRecipeId)
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
        recipeId: numericRecipeId,
        title,
        image: image || null,
        cookTime: cookTime || null,
        servings:
          servings !== undefined && servings !== null
            ? String(servings)
            : null,
        ingredients: isValidArray(ingredients)
          ? ingredients
          : [],
        instructions: isValidArray(instructions)
          ? instructions
          : [],
        personalNote: personalNote?.trim() || null,
        updatedAt: new Date(),
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

/*
 * Get all favorites for one user.
 */
app.get("/api/favorites/:userId", async (request, response) => {
  try {
    const { userId } = request.params;

    if (!userId) {
      return response.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

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

/*
 * Get one saved favorite by its database record ID.
 */
app.get(
  "/api/favorites/:userId/record/:favoriteId",
  async (request, response) => {
    try {
      const { userId, favoriteId } = request.params;
      const numericFavoriteId = Number(favoriteId);

      if (!userId || !Number.isFinite(numericFavoriteId)) {
        return response.status(400).json({
          success: false,
          message: "A valid user ID and favorite ID are required.",
        });
      }

      const favorite = await getFavoriteById(
        userId,
        numericFavoriteId
      );

      if (!favorite) {
        return response.status(404).json({
          success: false,
          message: "Saved recipe not found.",
        });
      }

      return response.status(200).json({
        success: true,
        favorite,
      });
    } catch (error) {
      console.error("Error fetching saved favorite:", error);

      return response.status(500).json({
        success: false,
        message: "The saved recipe could not be loaded.",

        ...(ENV.NODE_ENV !== "production" && {
          developerMessage: error.message,
        }),
      });
    }
  }
);

/*
 * Update a saved favorite recipe.
 *
 * A user can customize title, ingredients, instructions,
 * cook time, servings, and a personal note.
 */
app.put(
  "/api/favorites/:userId/record/:favoriteId",
  async (request, response) => {
    try {
      const { userId, favoriteId } = request.params;
      const numericFavoriteId = Number(favoriteId);

      const {
        title,
        image,
        cookTime,
        servings,
        ingredients,
        instructions,
        personalNote,
      } = request.body;

      if (!userId || !Number.isFinite(numericFavoriteId)) {
        return response.status(400).json({
          success: false,
          message: "A valid user ID and favorite ID are required.",
        });
      }

      if (
        ingredients !== undefined &&
        !isValidArray(ingredients)
      ) {
        return response.status(400).json({
          success: false,
          message: "Ingredients must be an array.",
        });
      }

      if (
        instructions !== undefined &&
        !isValidArray(instructions)
      ) {
        return response.status(400).json({
          success: false,
          message: "Instructions must be an array.",
        });
      }

      const existingFavorite = await getFavoriteById(
        userId,
        numericFavoriteId
      );

      if (!existingFavorite) {
        return response.status(404).json({
          success: false,
          message: "Saved recipe not found.",
        });
      }

      const updateData = {
        updatedAt: new Date(),
      };

      if (typeof title === "string" && title.trim()) {
        updateData.title = title.trim();
      }

      if (image !== undefined) {
        updateData.image = image || null;
      }

      if (cookTime !== undefined) {
        updateData.cookTime = cookTime || null;
      }

      if (servings !== undefined && servings !== null) {
        updateData.servings = String(servings);
      }

      if (isValidArray(ingredients)) {
        updateData.ingredients = ingredients;
      }

      if (isValidArray(instructions)) {
        updateData.instructions = instructions;
      }

      if (personalNote !== undefined) {
        updateData.personalNote =
          typeof personalNote === "string" &&
          personalNote.trim()
            ? personalNote.trim()
            : null;
      }

      const updatedFavorite = await db
        .update(favoritesTable)
        .set(updateData)
        .where(
          and(
            eq(favoritesTable.id, numericFavoriteId),
            eq(favoritesTable.userId, userId)
          )
        )
        .returning();

      return response.status(200).json({
        success: true,
        message: "Saved recipe updated.",
        favorite: updatedFavorite[0],
      });
    } catch (error) {
      console.error("Error updating saved favorite:", error);

      return response.status(500).json({
        success: false,
        message: "The saved recipe could not be updated.",

        ...(ENV.NODE_ENV !== "production" && {
          developerMessage: error.message,
        }),
      });
    }
  }
);

/*
 * Delete a favorite by database record ID.
 * Used by the Favorites page.
 */
app.delete(
  "/api/favorites/:userId/record/:favoriteId",
  async (request, response) => {
    try {
      const { userId, favoriteId } = request.params;
      const numericFavoriteId = Number(favoriteId);

      if (!userId || !Number.isFinite(numericFavoriteId)) {
        return response.status(400).json({
          success: false,
          message: "A valid user ID and favorite ID are required.",
        });
      }

      const deletedFavorite = await db
        .delete(favoritesTable)
        .where(
          and(
            eq(favoritesTable.id, numericFavoriteId),
            eq(favoritesTable.userId, userId)
          )
        )
        .returning();

      if (deletedFavorite.length === 0) {
        return response.status(404).json({
          success: false,
          message: "Saved recipe not found.",
        });
      }

      return response.status(200).json({
        success: true,
        message: "Saved recipe deleted.",
      });
    } catch (error) {
      console.error("Error deleting saved favorite:", error);

      return response.status(500).json({
        success: false,
        message: "The saved recipe could not be deleted.",

        ...(ENV.NODE_ENV !== "production" && {
          developerMessage: error.message,
        }),
      });
    }
  }
);

/*
 * Remove a favorite by original recipe ID.
 * This keeps the existing recipe-detail Save button working.
 */
app.delete(
  "/api/favorites/:userId/:recipeId",
  async (request, response) => {
    try {
      const { userId, recipeId } = request.params;
      const numericRecipeId = Number(recipeId);

      if (!userId || !Number.isFinite(numericRecipeId)) {
        return response.status(400).json({
          success: false,
          message: "A valid user ID and recipe ID are required.",
        });
      }

      await db
        .delete(favoritesTable)
        .where(
          and(
            eq(favoritesTable.userId, userId),
            eq(favoritesTable.recipeId, numericRecipeId)
          )
        );

      return response.status(200).json({
        success: true,
        message: "Recipe removed from favorites.",
      });
    } catch (error) {
      console.error("Error deleting favorite:", error);

      return response.status(500).json({
        success: false,
        message: "The recipe could not be removed.",

        ...(ENV.NODE_ENV !== "production" && {
          developerMessage: error.message,
        }),
      });
    }
  }
);

/*
 * Handle unknown routes.
 */
app.use((request, response) => {
  return response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
});

/*
 * Handle unexpected server errors.
 */
app.use((error, request, response, next) => {
  console.error("Unhandled server error:", error);

  if (response.headersSent) {
    return next(error);
  }

  return response.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

/*
 * Start the API server.
 */
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Recipe API is running at http://localhost:${PORT}`
  );

  console.log("AI provider: Google Gemini");

  console.log(`AI model: ${ENV.GEMINI_MODEL}`);

  console.log(
    `AI recipe service configured: ${
      ENV.GEMINI_API_KEY ? "yes" : "no"
    }`
  );

  console.log(
    `Pexels image service configured: ${
      ENV.PEXELS_API_KEY ? "yes" : "no"
    }`
  );
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other backend process and restart this server.`
    );
    return;
  }

  console.error("Server failed to start:", error);
});

const shutdownServer = (signal) => {
  console.log(`Received ${signal}. Closing server...`);

  server.close(() => {
    console.log("Server closed successfully.");
    process.exit(0);
  });
};

process.on("SIGINT", () => {
  shutdownServer("SIGINT");
});

process.on("SIGTERM", () => {
  shutdownServer("SIGTERM");
});