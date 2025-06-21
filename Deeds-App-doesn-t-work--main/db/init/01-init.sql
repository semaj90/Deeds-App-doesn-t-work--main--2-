-- Database initialization script for Prosecutor Monorepo
-- This runs when the PostgreSQL container starts for the first time

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enable vector extension for embeddings (if available)
-- Note: You may need to install pgvector extension separately
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- Create database user roles
DO $$
BEGIN
    -- Create read-only role for reporting
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'prosecutor_readonly') THEN
        CREATE ROLE prosecutor_readonly;
    END IF;
    
    -- Create application role
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'prosecutor_app') THEN
        CREATE ROLE prosecutor_app WITH LOGIN PASSWORD 'app_password';
    END IF;
    
    -- Grant permissions
    GRANT CONNECT ON DATABASE prosecutor_app TO prosecutor_readonly;
    GRANT CONNECT ON DATABASE prosecutor_app TO prosecutor_app;
    
    -- Grant schema usage
    GRANT USAGE ON SCHEMA public TO prosecutor_readonly;
    GRANT USAGE ON SCHEMA public TO prosecutor_app;
    
    -- Grant table permissions (will apply to tables created later)
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO prosecutor_readonly;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO prosecutor_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO prosecutor_app;
END
$$;

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for common queries
-- Note: These will be applied after tables are created by Drizzle migrations

-- Performance optimizations
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries

-- Restart required for shared_preload_libraries changes
-- SELECT pg_reload_conf();
