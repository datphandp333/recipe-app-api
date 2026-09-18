ALTER TABLE "favorites" ADD COLUMN "ingredients" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "instructions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "personal_note" text;--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "updated_at" timestamp DEFAULT now();