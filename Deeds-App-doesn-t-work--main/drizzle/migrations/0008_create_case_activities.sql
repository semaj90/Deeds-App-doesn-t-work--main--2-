-- Create case_activities table
CREATE TABLE IF NOT EXISTS "case_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "case_id" uuid NOT NULL REFERENCES "cases"("id") ON DELETE CASCADE,
  "activity_type" varchar(50) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text,
  "scheduled_for" timestamp,
  "completed_at" timestamp,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "priority" varchar(20) DEFAULT 'medium' NOT NULL,
  "assigned_to" uuid REFERENCES "users"("id"),
  "related_evidence" jsonb DEFAULT '[]' NOT NULL,
  "related_criminals" jsonb DEFAULT '[]' NOT NULL,
  "metadata" jsonb DEFAULT '{}' NOT NULL,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
