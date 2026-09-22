import {
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),

  userId: text("user_id").notNull(),

  /*
   * MealDB recipes use numeric IDs, while Gemini
   * recipes use IDs like ai-1789668543218.
   *
   * Text supports both kinds safely.
   */
  recipeId: text("recipe_id").notNull(),

  title: text("title").notNull(),

  image: text("image"),

  cookTime: text("cook_time"),

  servings: text("servings"),

  ingredients: jsonb("ingredients")
    .$type()
    .default([]),

  instructions: jsonb("instructions")
    .$type()
    .default([]),

  personalNote: text("personal_note"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),
});