-- Fix cases.id column: remove identity/auto-increment and ensure correct type
ALTER TABLE cases ALTER COLUMN id DROP IDENTITY IF EXISTS;
ALTER TABLE cases ALTER COLUMN id TYPE varchar(36);
