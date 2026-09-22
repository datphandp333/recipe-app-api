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
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.get("/api/health", (request, response) => {
  return response.status(200).json({
    success: true,
    message: "Recipe API is running.",
    environment: ENV.NODE_ENV,
    aiConfigured: Boolean(ENV.GEMINI_API_KEY),
    imageSearchConfigured: Boolean(ENV.PEXELS_API_KEY),
  });
});

app.use("/api/ai/recipes", aiRecipeRoutes);
app.use("/api/images", imageRoutes);

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
    } = request.body || {};

    if (!userId || !recipeId || !title) {
      return response.status(400).json({
        success: false,
        message: "User ID, recipe ID, and title are required.",
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

app.get("/api/favorites/:userId", async (request, response) => {
  try {
    const { userId } = request.params;

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

app.put(
  "/api/favorites/:userId/:recipeId",
  async (request, response) => {
    try {
      const { userId, recipeId } = request.params;
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

app.delete(
  "/api/favorites/:userId/:recipeId",
  async (request, response) => {
    try {
      const { userId, recipeId } = request.params;

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

app.use((request, response) => {
  return response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
});

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

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Recipe API is running at http://localhost:${PORT}`);
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