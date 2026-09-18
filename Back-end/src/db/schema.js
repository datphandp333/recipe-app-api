import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),

  userId: text("user_id").notNull(),

  recipeId: integer("recipe_id").notNull(),

  title: text("title").notNull(),

  image: text("image"),

  cookTime: text("cook_time"),

  servings: text("servings"),

  // A personal snapshot of the recipe at the time it is saved.
  ingredients: jsonb("ingredients").$type().default([]),

  instructions: jsonb("instructions").$type().default([]),

  // Optional user note, for example:
  // "Add extra chili flakes and use less sugar."
  personalNote: text("personal_note"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),
});