CREATE TABLE "pantry" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"unit" text NOT NULL,
	"expires_on" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
