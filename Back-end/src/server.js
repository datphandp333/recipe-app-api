import express from "express";
import cors from "cors";
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoritesTable } from "./db/schema.js";
import { and, eq } from "drizzle-orm";
import job from "./config/cron.js";

const app = express();
const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === "production") {
  job.start();
}

app.use(
  cors({
    origin: ["http://localhost:8081", "http://127.0.0.1:8081"],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true });
});

app.post("/api/favorites", async (req, res) => {
  try {
    const { userId, recipeId, title, image, cookTime, servings } = req.body;

    console.log("POST /api/favorites body:", req.body);

    if (!userId || !recipeId || !title) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const newFavorite = await db
      .insert(favoritesTable)
      .values({
        userId,
        recipeId: Number(recipeId),
        title,
        image,
        cookTime,
        servings: servings ? String(servings) : null,
      })
      .returning();

    return res.status(201).json({
      success: true,
      favorite: newFavorite[0],
    });
  } catch (error) {
    console.log("Error adding favorite:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
      detail: String(error),
    });
  }
});

app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const userFavorites = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));

    return res.status(200).json(userFavorites);
  } catch (error) {
    console.log("Error fetching favorites:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
      detail: String(error),
    });
  }
});

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;

    await db
      .delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, userId),
          eq(favoritesTable.recipeId, parseInt(recipeId, 10))
        )
      );

    return res.status(200).json({
      success: true,
      message: "Favorite deleted successfully",
    });
  } catch (error) {
    console.log("Error deleting favorite:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
      detail: String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});