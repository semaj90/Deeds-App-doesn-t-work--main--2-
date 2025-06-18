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
	`related_evidence` text NOT NULL,
	`related_criminals` text NOT NULL,
	`metadata` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`case_number` text,
	`title` text NOT NULL,
	`description` text,
	`incident_date` integer,
	`location` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`category` text,
	`danger_score` integer DEFAULT 0 NOT NULL,
	`estimated_value` real,
	`jurisdiction` text,
	`lead_prosecutor` text,
	`assigned_team` text NOT NULL,
	`ai_summary` text,
	`ai_tags` text NOT NULL,
	`metadata` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`closed_at` integer,
	FOREIGN KEY (`lead_prosecutor`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `criminals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`middle_name` text,
	`aliases` text NOT NULL,
	`date_of_birth` integer,
	`address` text,
	`phone` text,
	`email` text,
	`height` integer,
	`weight` integer,
	`eye_color` text,
	`hair_color` text,
	`distinguishing_marks` text,
	`photo_url` text,
	`threat_level` text DEFAULT 'low' NOT NULL,
	`priors` text NOT NULL,
	`convictions` text NOT NULL,
	`notes` text,
	`ai_summary` text,
	`ai_tags` text NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`case_id` text,
	`criminal_id` integer,
	`title` text NOT NULL,
	`description` text,
	`file_url` text,
	`file_type` text,
	`file_size` integer,
	`uploaded_by` text,
	`uploaded_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`criminal_id`) REFERENCES `criminals`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `statutes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`full_text` text,
	`category` text,
	`severity` text,
	`min_penalty` text,
	`max_penalty` text,
	`jurisdiction` text,
	`effective_date` integer,
	`ai_summary` text,
	`tags` text NOT NULL,
	`related_statutes` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `statutes_code_unique` ON `statutes` (`code`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer,
	`hashed_password` text,
	`role` text DEFAULT 'prosecutor' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`first_name` text,
	`last_name` text,
	`name` text,
	`title` text,
	`department` text,
	`phone` text,
	`office_address` text,
	`avatar` text,
	`bio` text,
	`specializations` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);