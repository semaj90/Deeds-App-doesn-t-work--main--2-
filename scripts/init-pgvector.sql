-- Initialize pgvector extension and vector search optimizations
-- This script runs automatically when PostgreSQL starts

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector operator classes for optimal indexing
CREATE OPERATOR CLASS IF NOT EXISTS vector_cosine_ops
    DEFAULT FOR TYPE vector USING hnsw AS
    OPERATOR 1 <=> (vector, vector) FOR ORDER BY float_ops,
    FUNCTION 1 vector_cosine_distance(vector, vector);

-- Optimize PostgreSQL for vector operations
ALTER SYSTEM SET shared_preload_libraries = 'vector';
ALTER SYSTEM SET max_connections = '100';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '512MB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Vector-specific optimizations
ALTER SYSTEM SET hnsw.ef_construction = '64';
ALTER SYSTEM SET hnsw.max_connections = '16';

-- Apply configuration
SELECT pg_reload_conf();

-- Create search statistics table for performance monitoring
CREATE TABLE IF NOT EXISTS vector_search_stats (
    id SERIAL PRIMARY KEY,
    query_type VARCHAR(50) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    results_count INTEGER NOT NULL,
    query_vector_dims INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create function to log search performance
CREATE OR REPLACE FUNCTION log_vector_search(
    p_query_type VARCHAR(50),
    p_execution_time_ms INTEGER,
    p_results_count INTEGER,
    p_vector_dims INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO vector_search_stats (query_type, execution_time_ms, results_count, query_vector_dims)
    VALUES (p_query_type, p_execution_time_ms, p_results_count, p_vector_dims);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE prosecutor_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create indexes for better performance (these will be created by migrations too)
-- But having them here ensures they exist immediately

COMMENT ON EXTENSION vector IS 'Vector similarity search for AI embeddings';
COMMENT ON TABLE vector_search_stats IS 'Performance monitoring for vector search operations';
