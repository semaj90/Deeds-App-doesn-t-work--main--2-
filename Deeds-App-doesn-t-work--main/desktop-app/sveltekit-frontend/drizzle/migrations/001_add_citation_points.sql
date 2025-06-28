-- Migration: Add Citation Points table for AI-powered legal citations
-- Date: 2025-06-25
-- Description: Creates the citation_points table to support intelligent legal citation management

CREATE TABLE IF NOT EXISTS citation_points (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    summary TEXT NOT NULL,
    source TEXT NOT NULL,
    source_id INTEGER,
    source_type TEXT,
    labels JSONB DEFAULT '[]'::jsonb,
    vector JSONB,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    linked_to INTEGER REFERENCES cases(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_citation_points_linked_to ON citation_points(linked_to);
CREATE INDEX IF NOT EXISTS idx_citation_points_source ON citation_points(source);
CREATE INDEX IF NOT EXISTS idx_citation_points_source_type ON citation_points(source_type);
CREATE INDEX IF NOT EXISTS idx_citation_points_created_by ON citation_points(created_by);
CREATE INDEX IF NOT EXISTS idx_citation_points_created_at ON citation_points(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citation_points_is_archived ON citation_points(is_archived);

-- GIN index for JSONB fields to support fast searches
CREATE INDEX IF NOT EXISTS idx_citation_points_labels_gin ON citation_points USING gin(labels);
CREATE INDEX IF NOT EXISTS idx_citation_points_metadata_gin ON citation_points USING gin(metadata);

-- Full-text search index for summary content
CREATE INDEX IF NOT EXISTS idx_citation_points_summary_fts ON citation_points USING gin(to_tsvector('english', summary));

-- Trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_citation_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_citation_points_updated_at
    BEFORE UPDATE ON citation_points
    FOR EACH ROW
    EXECUTE FUNCTION update_citation_points_updated_at();

-- Add some sample data for testing
INSERT INTO citation_points (summary, source, source_type, labels, confidence, metadata) VALUES
('Surveillance footage analysis reveals suspicious behavior patterns during critical time window', 'evidence/video_001', 'video', '["surveillance", "behavioral analysis", "timeline"]', 85, '{"ai_model": "legal-bert-v1", "processing_time_ms": 1250}'),
('Document analysis indicates discrepancies in stated timeline and witness accounts', 'evidence/document_001', 'document', '["documentation", "timeline", "witness testimony"]', 92, '{"ai_model": "legal-bert-v1", "processing_time_ms": 980}'),
('Audio recording contains clear evidence of premeditation and intent', 'evidence/audio_001', 'audio', '["recording", "intent", "premeditation"]', 88, '{"ai_model": "legal-bert-v1", "processing_time_ms": 1450}'),
('Photographic evidence shows clear identification markers and contextual details', 'evidence/image_001', 'image', '["photography", "identification", "physical evidence"]', 94, '{"ai_model": "legal-bert-v1", "processing_time_ms": 750}'),
('Forensic analysis provides definitive evidence linking suspect to crime scene', 'evidence/forensic_001', 'forensic', '["forensics", "DNA", "scientific analysis"]', 97, '{"ai_model": "legal-bert-v1", "processing_time_ms": 2100}')
ON CONFLICT (uuid) DO NOTHING;
