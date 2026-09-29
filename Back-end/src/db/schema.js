import {
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
  numeric,
  date,
} from "drizzle-orm/pg-core";

export const pantryTable = pgTable("pantry", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  expiresOn: date("expires_on"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cookingPreferencesTable = pgTable("cooking_preferences", {
  userId: text("user_id").primaryKey(),
  preferences: jsonb("preferences").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mealPlansTable = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  plan: jsonb("plan").notNull(),
  pantryFingerprint: text("pantry_fingerprint").notNull(),
  cookedMeals: jsonb("cooked_meals").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  savedAt: timestamp("saved_at"),
});

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
