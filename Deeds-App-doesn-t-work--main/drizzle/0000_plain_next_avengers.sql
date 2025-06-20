CREATE TABLE `case_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`activity_type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`scheduled_for` integer,
	`completed_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`assigned_to` text,
	`related_evidence` text DEFAULT '[]' NOT NULL,
	`related_criminals` text DEFAULT '[]' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `case_events` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`event_type` text NOT NULL,
	`event_data` text NOT NULL,
	`previous_state` text,
	`new_state` text,
	`user_id` text,
	`session_id` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `case_law_links` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`statute_id` text,
	`law_paragraph_id` text,
	`link_type` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`statute_id`) REFERENCES `statutes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`law_paragraph_id`) REFERENCES `law_paragraphs`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `case_relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_case_id` text NOT NULL,
	`related_case_id` text NOT NULL,
	`relationship_type` text NOT NULL,
	`confidence` real DEFAULT 0 NOT NULL,
	`ai_analysis` text DEFAULT '{}' NOT NULL,
	`description` text,
	`discovered_by` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`parent_case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `case_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`case_type` text NOT NULL,
	`template` text NOT NULL,
	`fields` text DEFAULT '[]' NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `case_text_fragments` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`fragment_type` text NOT NULL,
	`content` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`source` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`embedding` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_by` text NOT NULL,
	`status` text,
	`data` text DEFAULT '{}' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`ai_summary` text,
	`ai_tags` text DEFAULT '[]' NOT NULL,
	`embedding` text,
	`danger_score` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `content_embeddings` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`content_type` text NOT NULL,
	`embedding` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crimes` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text,
	`criminal_id` text,
	`statute_id` text,
	`name` text NOT NULL,
	`description` text,
	`charge_level` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`incident_date` integer,
	`arrest_date` integer,
	`filing_date` integer,
	`notes` text,
	`ai_summary` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`criminal_id`) REFERENCES `criminals`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`statute_id`) REFERENCES `statutes`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `criminals` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`middle_name` text,
	`aliases` text DEFAULT '[]' NOT NULL,
	`date_of_birth` integer,
	`address` text,
	`phone` text,
	`photo_url` text,
	`threat_level` text DEFAULT 'low' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`priors` text DEFAULT '[]' NOT NULL,
	`convictions` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`ai_summary` text,
	`ai_tags` text DEFAULT '[]' NOT NULL,
	`ai_analysis` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`filename` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`uploaded_by` text,
	`embedding` text,
	`ai_summary` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `law_paragraphs` (
	`id` text PRIMARY KEY NOT NULL,
	`statute_id` text NOT NULL,
	`paragraph_number` text NOT NULL,
	`content` text NOT NULL,
	`ai_summary` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`linked_case_ids` text DEFAULT '[]' NOT NULL,
	`crime_suggestions` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`paragraph_text` text,
	`anchor_id` text,
	FOREIGN KEY (`statute_id`) REFERENCES `statutes`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nlp_analysis_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`content_hash` text NOT NULL,
	`content_type` text NOT NULL,
	`original_text` text NOT NULL,
	`analysis` text NOT NULL,
	`entities` text DEFAULT '[]' NOT NULL,
	`sentiment` real,
	`confidence` real,
	`suggestions` text DEFAULT '[]' NOT NULL,
	`related_cases` text DEFAULT '[]' NOT NULL,
	`related_statutes` text DEFAULT '[]' NOT NULL,
	`embedding` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nlp_analysis_cache_content_hash_unique` ON `nlp_analysis_cache` (`content_hash`);--> statement-breakpoint
CREATE TABLE `saved_statements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`category` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`case_types` text DEFAULT '[]' NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`created_by` text,
	`last_used` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `statutes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`meta` text DEFAULT '{}' NOT NULL,
	`ai_summary` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`preference_type` text NOT NULL,
	`preferences` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`hashed_password` text NOT NULL,
	`bio` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);