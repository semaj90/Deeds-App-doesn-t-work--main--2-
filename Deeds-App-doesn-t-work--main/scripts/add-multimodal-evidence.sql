-- Migration: Add Multimodal Evidence Analysis Tables
-- Run this after updating your schema.ts file

-- Evidence Files Table
CREATE TABLE IF NOT EXISTS evidence_files (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    processing_status TEXT DEFAULT 'uploaded',
    analysis_results TEXT, -- JSON
    metadata TEXT, -- JSON
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Evidence Anchor Points Table
CREATE TABLE IF NOT EXISTS evidence_anchor_points (
    id TEXT PRIMARY KEY,
    evidence_id TEXT NOT NULL REFERENCES evidence_files(id) ON DELETE CASCADE,
    anchor_type TEXT NOT NULL, -- 'object', 'text', 'timeline', 'contradiction'
    coordinates TEXT, -- JSON: {x, y, width, height, timestamp}
    label TEXT,
    content TEXT,
    confidence REAL,
    summary TEXT,
    added_to_case_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Case Evidence Summaries Table
CREATE TABLE IF NOT EXISTS case_evidence_summaries (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    evidence_id TEXT REFERENCES evidence_files(id) ON DELETE SET NULL,
    anchor_id TEXT REFERENCES evidence_anchor_points(id) ON DELETE SET NULL,
    summary TEXT NOT NULL,
    source_type TEXT, -- 'multimodal_analysis', 'manual', 'ai_generated', 'ocr', 'object_detection'
    embedding TEXT, -- Vector embedding for similarity search
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Evidence Processing Queue (for background jobs)
CREATE TABLE IF NOT EXISTS evidence_processing_queue (
    id TEXT PRIMARY KEY,
    evidence_id TEXT NOT NULL REFERENCES evidence_files(id) ON DELETE CASCADE,
    processing_type TEXT NOT NULL, -- 'enhancement', 'ocr', 'object_detection', 'timeline_analysis'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
    parameters TEXT, -- JSON processing parameters
    results TEXT, -- JSON processing results
    error_message TEXT,
    started_at INTEGER,
    completed_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_files_case_id ON evidence_files(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_user_id ON evidence_files(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_files_type ON evidence_files(file_type);
CREATE INDEX IF NOT EXISTS idx_evidence_files_status ON evidence_files(processing_status);

CREATE INDEX IF NOT EXISTS idx_anchor_points_evidence_id ON evidence_anchor_points(evidence_id);
CREATE INDEX IF NOT EXISTS idx_anchor_points_type ON evidence_anchor_points(anchor_type);

CREATE INDEX IF NOT EXISTS idx_summaries_case_id ON case_evidence_summaries(case_id);
CREATE INDEX IF NOT EXISTS idx_summaries_evidence_id ON case_evidence_summaries(evidence_id);
CREATE INDEX IF NOT EXISTS idx_summaries_source_type ON case_evidence_summaries(source_type);

CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON evidence_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_priority ON evidence_processing_queue(priority);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_evidence_files_timestamp 
    AFTER UPDATE ON evidence_files
    BEGIN
        UPDATE evidence_files SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
    END;

-- Sample data for testing
INSERT OR IGNORE INTO evidence_files (
    id, case_id, user_id, file_name, file_type, file_path, file_size, processing_status, metadata
) VALUES (
    'sample_evidence_1',
    (SELECT id FROM cases LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'sample_security_footage.mp4',
    'video/mp4',
    '/uploads/evidence/sample_security_footage.mp4',
    52428800,
    'pending',
    '{"original_name": "security_footage_main_entrance.mp4", "duration": 120, "resolution": "1920x1080"}'
);

-- Print completion message
SELECT 'Multimodal evidence analysis tables created successfully!' as message;
