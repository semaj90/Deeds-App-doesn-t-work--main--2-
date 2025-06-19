CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "case_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"scheduled_for" timestamp,
	"completed_at" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"assigned_to" uuid,
	"related_evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_criminals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_law_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"statute_id" uuid,
	"law_paragraph_id" uuid,
	"link_type" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"danger_score" integer DEFAULT 0 NOT NULL,
	"estimated_value" numeric(12, 2),
	"jurisdiction" varchar(100),
	"lead_prosecutor" uuid,
	"assigned_team" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_summary" text,
	"ai_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"name" varchar(255),
	"summary" text,
	"date_opened" timestamp,
	"verdict" varchar(100),
	"court_dates" text,
	"linked_criminals" text,
	"linked_crimes" text,
	"notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"embedding" jsonb NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crimes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"criminal_id" uuid,
	"statute_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"charge_level" varchar(50),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"incident_date" timestamp,
	"arrest_date" timestamp,
	"filing_date" timestamp,
	"notes" text,
	"ai_summary" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"ai_analysis" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255),
	"conviction_status" varchar(50),
	"sentence_length" varchar(100),
	"conviction_date" timestamp,
	"escape_attempts" integer DEFAULT 0,
	"gang_affiliations" text
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"criminal_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"file_url" text,
	"file_type" varchar(100),
	"file_size" integer,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"file_name" varchar(255),
	"summary" text,
	"ai_summary" text
);
--> statement-breakpoint
CREATE TABLE "law_paragraphs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statute_id" uuid NOT NULL,
	"paragraph_number" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"ai_summary" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"paragraph_text" text,
	"anchor_id" varchar(100),
	"linked_case_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"crime_suggestions" jsonb DEFAULT '[]'::jsonb NOT NULL
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
	"code" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"full_text" text,
	"category" varchar(100),
	"severity" varchar(20),
	"min_penalty" varchar(255),
	"max_penalty" varchar(255),
	"jurisdiction" varchar(100),
	"effective_date" timestamp,
	"ai_summary" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_statutes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255),
	"section_number" varchar(50),
	CONSTRAINT "statutes_code_unique" UNIQUE("code")
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
	"title" varchar(100),
	"department" varchar(200),
	"phone" varchar(20),
	"office_address" text,
	"avatar" text,
	"bio" text,
	"specializations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"username" varchar(100),
	"image" text,
	"avatar_url" text,
	"provider" varchar(50) DEFAULT 'credentials',
	"profile" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_activities" ADD CONSTRAINT "case_activities_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_activities" ADD CONSTRAINT "case_activities_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_activities" ADD CONSTRAINT "case_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_law_links" ADD CONSTRAINT "case_law_links_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_law_links" ADD CONSTRAINT "case_law_links_statute_id_statutes_id_fk" FOREIGN KEY ("statute_id") REFERENCES "public"."statutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_law_links" ADD CONSTRAINT "case_law_links_law_paragraph_id_law_paragraphs_id_fk" FOREIGN KEY ("law_paragraph_id") REFERENCES "public"."law_paragraphs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_lead_prosecutor_users_id_fk" FOREIGN KEY ("lead_prosecutor") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crimes" ADD CONSTRAINT "crimes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crimes" ADD CONSTRAINT "crimes_criminal_id_criminals_id_fk" FOREIGN KEY ("criminal_id") REFERENCES "public"."criminals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crimes" ADD CONSTRAINT "crimes_statute_id_statutes_id_fk" FOREIGN KEY ("statute_id") REFERENCES "public"."statutes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crimes" ADD CONSTRAINT "crimes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "criminals" ADD CONSTRAINT "criminals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_criminal_id_criminals_id_fk" FOREIGN KEY ("criminal_id") REFERENCES "public"."criminals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "law_paragraphs" ADD CONSTRAINT "law_paragraphs_statute_id_statutes_id_fk" FOREIGN KEY ("statute_id") REFERENCES "public"."statutes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;