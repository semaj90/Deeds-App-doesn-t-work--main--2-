CREATE TABLE IF NOT EXISTS "canvas_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" uuid NOT NULL,
	"canvas_data" text NOT NULL,
	"image_preview" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "canvas_states" ADD CONSTRAINT "canvas_states_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add index for faster lookups by case_id
CREATE INDEX IF NOT EXISTS "canvas_states_case_id_idx" ON "canvas_states" ("case_id");

-- Add index for faster lookups by updated_at for recent canvas states
CREATE INDEX IF NOT EXISTS "canvas_states_updated_at_idx" ON "canvas_states" ("updated_at" DESC);
