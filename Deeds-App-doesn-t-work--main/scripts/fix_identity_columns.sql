-- Fix identity column types for all relevant tables in your database
-- Run this SQL in your Postgres client (e.g., psql, DBeaver, TablePlus, etc.)

-- For case_evidence
ALTER TABLE "case_evidence" ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
ALTER TABLE "case_evidence" ALTER COLUMN "id" TYPE integer USING id::integer;
ALTER TABLE "case_evidence" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;

-- For crimes
ALTER TABLE "crimes" ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
ALTER TABLE "crimes" ALTER COLUMN "id" TYPE integer USING id::integer;
ALTER TABLE "crimes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;

-- For tags
ALTER TABLE "tags" ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
ALTER TABLE "tags" ALTER COLUMN "id" TYPE integer USING id::integer;
ALTER TABLE "tags" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;

-- For evidence
ALTER TABLE "evidence" ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
ALTER TABLE "evidence" ALTER COLUMN "id" TYPE integer USING id::integer;
ALTER TABLE "evidence" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;

-- For statutes
ALTER TABLE "statutes" ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
ALTER TABLE "statutes" ALTER COLUMN "id" TYPE integer USING id::integer;
ALTER TABLE "statutes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;

-- For content_embeddings
ALTER TABLE "content_embeddings" ALTER COLUMN "id" DROP IDENTITY IF EXISTS;
ALTER TABLE "content_embeddings" ALTER COLUMN "id" TYPE integer USING id::integer;
ALTER TABLE "content_embeddings" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY;
