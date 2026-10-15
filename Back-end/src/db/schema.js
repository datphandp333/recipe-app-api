import { sql } from "drizzle-orm";
import {
  pgTable,
  integer,
  primaryKey,
  check,
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

// Beta usage persists across installs and resets monthly, independently of billing.
export const membershipAccountsTable = pgTable('membership_accounts', {
  userId: text('user_id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const membershipUsageTable = pgTable('membership_usage', {
  userId: text('user_id').notNull().references(() => membershipAccountsTable.userId),
  period: text('period').notNull(),
  feature: text('feature').notNull(),
  used: integer('used').default(0).notNull(),
}, table => [primaryKey({ columns: [table.userId, table.period, table.feature] }),
  check('membership_usage_feature_check', sql`${table.feature} IN ('chat','recipes','scans','plans')`),
  check('membership_usage_used_check', sql`${table.used} >= 0`)]);
export const membershipRequestsTable = pgTable('membership_requests', {
  userId: text('user_id').notNull().references(() => membershipAccountsTable.userId),
  requestId: text('request_id').notNull(),
  fingerprint: text('fingerprint').notNull(),
  period: text('period').notNull(),
  features: jsonb('features').notNull(),
  state: text('state').notNull(),
  leaseUntil: timestamp('lease_until', { withTimezone: true }).notNull(),
  response: jsonb('response'),
  responseStatus: integer('response_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.userId, table.requestId] }),
  check('membership_requests_state_check', sql`${table.state} IN ('pending','completed','released')`)]);
