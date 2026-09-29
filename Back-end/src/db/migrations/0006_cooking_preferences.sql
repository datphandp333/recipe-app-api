CREATE TABLE "cooking_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"preferences" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
