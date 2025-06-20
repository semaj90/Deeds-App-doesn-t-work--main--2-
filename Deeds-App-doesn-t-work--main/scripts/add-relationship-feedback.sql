-- Migration to add case relationship feedback table
-- Run this after updating your schema.ts file

-- Create case_relationship_feedback table
CREATE TABLE IF NOT EXISTS case_relationship_feedback (
    id TEXT PRIMARY KEY,
    parent_case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    related_case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL CHECK (feedback IN ('positive', 'negative', 'neutral')),
    confidence REAL DEFAULT 0.0 NOT NULL,
    user_score INTEGER NOT NULL CHECK (user_score IN (-1, 0, 1)),
    feedback_type TEXT NOT NULL DEFAULT 'explicit',
    context TEXT DEFAULT '{}' NOT NULL,
    session_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_case_feedback_parent ON case_relationship_feedback(parent_case_id);
CREATE INDEX IF NOT EXISTS idx_case_feedback_related ON case_relationship_feedback(related_case_id);
CREATE INDEX IF NOT EXISTS idx_case_feedback_user ON case_relationship_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_case_feedback_score ON case_relationship_feedback(user_score);

-- Create compound index for common queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_case_feedback_unique 
ON case_relationship_feedback(parent_case_id, related_case_id, user_id);

-- Add embedding columns to existing tables if not present
ALTER TABLE cases ADD COLUMN embedding TEXT;
ALTER TABLE evidence ADD COLUMN embedding TEXT;
ALTER TABLE law_paragraphs ADD COLUMN embedding TEXT;
