CREATE TABLE "ai_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"analysis_type" varchar(50) NOT NULL,
	"results" jsonb NOT NULL,
	"confidence" numeric(5, 4),
	"model_version" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_criminals" (
	"case_id" uuid,
	"criminal_id" uuid,
	"role" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "case_criminals_case_id_criminal_id_pk" PRIMARY KEY("case_id","criminal_id")
);
--> statement-breakpoint
CREATE TABLE "case_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_date" timestamp,
	"location" text,
	"participants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_evidence_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"summary" text NOT NULL,
	"evidence_count" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"generated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "case_relationship_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid,
	"user_id" uuid,
	"is_accurate" boolean NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_case_id" uuid,
	"child_case_id" uuid,
	"relationship_type" varchar(50) NOT NULL,
	"description" text,
	"confidence" numeric(5, 4),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template" jsonb NOT NULL,
	"category" varchar(100),
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_text_fragments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"content" text NOT NULL,
	"start_index" integer,
	"end_index" integer,
	"type" varchar(50),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_classification" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_number" varchar(50),
	"title" varchar(255) NOT NULL,
	"description" text,
	"incident_date" timestamp,
	"location" text,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"category" varchar(50),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_summary" text,
	"ai_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assigned_to" uuid,
	"created_by" uuid,
	"last_modified_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"embedding" jsonb NOT NULL,
	"text" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crimes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"severity" varchar(50),
	"description" text,
	"statute_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"common_elements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"typical_penalties" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "criminals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"date_of_birth" timestamp,
	"address" text,
	"phone" varchar(20),
	"email" varchar(255),
	"height" integer,
	"weight" integer,
	"eye_color" varchar(20),
	"hair_color" varchar(20),
	"distinguishing_marks" text,
	"photo_url" text,
	"threat_level" varchar(20) DEFAULT 'low' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"priors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"convictions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"ai_summary" text,
	"ai_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"conviction_status" varchar(50),
	"sentence_length" varchar(100),
	"conviction_date" timestamp,
	"escape_attempts" integer DEFAULT 0,
	"gang_affiliations" text,
	"ai_analysis" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"evidence_number" varchar(50),
	"type" varchar(50) NOT NULL,
	"description" text,
	"location" text,
	"date_collected" timestamp,
	"collected_by" varchar(255),
	"chain_of_custody" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"file_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_analysis" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_anchor_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_file_id" uuid,
	"page_number" integer,
	"x_coordinate" numeric(10, 6),
	"y_coordinate" numeric(10, 6),
	"width" numeric(10, 6),
	"height" numeric(10, 6),
	"annotation" text,
	"type" varchar(50),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_id" uuid,
	"filename" varchar(255) NOT NULL,
	"filesize" integer,
	"mimetype" varchar(100),
	"file_hash" varchar(64),
	"storage_path" text,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"category" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"embedding" jsonb,
	"confidence_score" numeric(5, 4),
	"source_count" integer DEFAULT 1 NOT NULL,
	"verification_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"contributor_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "law_paragraphs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statute_id" uuid,
	"paragraph_number" varchar(10),
	"content" text NOT NULL,
	"subsection" varchar(10),
	"category" varchar(100),
	"embedding" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nlp_analysis_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input_hash" varchar(64) NOT NULL,
	"analysis_type" varchar(50) NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "nlp_analysis_cache_input_hash_unique" UNIQUE("input_hash")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"case_id" uuid,
	"content" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_by" uuid,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_item_source_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saved_item_id" uuid NOT NULL,
	"chunk_text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"embedding" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"relevance_score" numeric(5, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_id" uuid,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"personal_notes" text,
	"embedding" jsonb,
	"priority" integer DEFAULT 1 NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50),
	"color" varchar(7) DEFAULT '#3B82F6',
	"description" text,
	"usage_count" integer DEFAULT 0,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "search_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"statute_number" varchar(50),
	"jurisdiction" varchar(100),
	"chapter" varchar(50),
	"section" varchar(50),
	"text" text NOT NULL,
	"penalties" text,
	"category" varchar(100),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_updated" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"response" text NOT NULL,
	"rating" integer,
	"feedback" text,
	"improved_response" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"was_fixed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_search_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferred_sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"excluded_sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_time_range" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"custom_prompts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"search_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"frequent_terms" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"saved_queries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"hashed_password" text,
	"role" varchar(50) DEFAULT 'prosecutor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"name" text,
	"username" varchar(100),
	"title" varchar(100),
	"department" varchar(200),
	"phone" varchar(20),
	"office_address" text,
	"avatar" text,
	"image" text,
	"bio" text,
	"specializations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "case_criminals" ADD CONSTRAINT "case_criminals_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_criminals" ADD CONSTRAINT "case_criminals_criminal_id_criminals_id_fk" FOREIGN KEY ("criminal_id") REFERENCES "public"."criminals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_evidence_summaries" ADD CONSTRAINT "case_evidence_summaries_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_evidence_summaries" ADD CONSTRAINT "case_evidence_summaries_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_relationship_feedback" ADD CONSTRAINT "case_relationship_feedback_relationship_id_case_relationships_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."case_relationships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_relationship_feedback" ADD CONSTRAINT "case_relationship_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_relationships" ADD CONSTRAINT "case_relationships_parent_case_id_cases_id_fk" FOREIGN KEY ("parent_case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_relationships" ADD CONSTRAINT "case_relationships_child_case_id_cases_id_fk" FOREIGN KEY ("child_case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_relationships" ADD CONSTRAINT "case_relationships_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_templates" ADD CONSTRAINT "case_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_text_fragments" ADD CONSTRAINT "case_text_fragments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_last_modified_by_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "criminals" ADD CONSTRAINT "criminals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_anchor_points" ADD CONSTRAINT "evidence_anchor_points_evidence_file_id_evidence_files_id_fk" FOREIGN KEY ("evidence_file_id") REFERENCES "public"."evidence_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_anchor_points" ADD CONSTRAINT "evidence_anchor_points_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "law_paragraphs" ADD CONSTRAINT "law_paragraphs_statute_id_statutes_id_fk" FOREIGN KEY ("statute_id") REFERENCES "public"."statutes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_item_source_chunks" ADD CONSTRAINT "saved_item_source_chunks_saved_item_id_saved_items_id_fk" FOREIGN KEY ("saved_item_id") REFERENCES "public"."saved_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_statements" ADD CONSTRAINT "saved_statements_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_statements" ADD CONSTRAINT "saved_statements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_tags" ADD CONSTRAINT "search_tags_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_search_preferences" ADD CONSTRAINT "user_search_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;