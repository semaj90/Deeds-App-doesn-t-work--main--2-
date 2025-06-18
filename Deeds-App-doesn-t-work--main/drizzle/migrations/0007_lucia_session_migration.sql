-- Migration to convert from Auth.js session table to Lucia session table format

-- First, rename columns in the session table
ALTER TABLE "session" RENAME COLUMN "sessionToken" TO "id";
ALTER TABLE "session" RENAME COLUMN "expires" TO "expiresAt";

-- Update primary key if needed (shouldn't be needed as primary key column is just renamed)

-- This migration adapts the session table from Auth.js format to Lucia format
-- Auth.js: sessionToken (PK), userId, expires
-- Lucia: id (PK), userId, expiresAt

-- Lucia session migration: convert Auth.js session table to Lucia-compatible format

-- 1. Add new columns to session table
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "id" text PRIMARY KEY NOT NULL;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "expiresAt" timestamp NOT NULL;

-- 2. Drop old Auth.js columns if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='session' AND column_name='sessionToken') THEN
        ALTER TABLE "session" DROP COLUMN "sessionToken";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='session' AND column_name='expires') THEN
        ALTER TABLE "session" DROP COLUMN "expires";
    END IF;
END
$$;

-- 3. Add profile column to users table if not exists
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile" jsonb;

-- Create tables if not exist
CREATE TABLE IF NOT EXISTS account (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);

CREATE TABLE IF NOT EXISTS session (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"hashed_password" text,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Add foreign key constraints
DO $$
BEGIN
	ALTER TABLE "account" ADD CONSTRAINT "account_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END
$$;

DO $$
BEGIN
	ALTER TABLE "session" ADD CONSTRAINT "session_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END
$$;

-- No standalone transaction statements to remove. All BEGINs are inside DO $$ ... $$ blocks.
