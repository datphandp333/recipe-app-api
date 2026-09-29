CREATE TABLE "meal_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" jsonb NOT NULL,
	"pantry_fingerprint" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"saved_at" timestamp
);
