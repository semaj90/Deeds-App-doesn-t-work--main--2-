use anyhow::Result;
use sqlx::{PgPool, Pool, Postgres};
use std::sync::Arc;

// Database connection wrapper for PostgreSQL
pub type DbConnection = Arc<PgPool>;

// PostgreSQL functions using SQLx
pub async fn create_connection(database_url: &str) -> Result<DbConnection> {
    tracing::info!("Connecting to PostgreSQL database...");
    
    let pool = PgPool::connect(database_url).await?;
    
    tracing::info!("✅ PostgreSQL connection pool established");
    Ok(Arc::new(pool))
}

pub async fn test_connection(db: &DbConnection) -> Result<()> {
    sqlx::query("SELECT 1").fetch_one(db.as_ref()).await?;
    tracing::info!("✅ PostgreSQL connection test successful");
    Ok(())
}

pub async fn init_schema(db: &DbConnection) -> Result<()> {
    tracing::info!("Initializing PostgreSQL schema...");
    
    // Enable pgvector extension if not already enabled
    sqlx::query("CREATE EXTENSION IF NOT EXISTS vector")
        .execute(db.as_ref())
        .await
        .ok(); // Don't fail if extension already exists or can't be created
    
    // Create basic tables for case management
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS cases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) NOT NULL DEFAULT 'open',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID NOT NULL
        )"
    )
    .execute(db.as_ref())
    .await?;

    // Create users table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )"
    )
    .execute(db.as_ref())
    .await?;

    // Create evidence table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS evidence (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
            filename VARCHAR(255) NOT NULL,
            file_path TEXT NOT NULL,
            file_type VARCHAR(100) NOT NULL,
            file_size BIGINT NOT NULL,
            hash_sha256 VARCHAR(64) NOT NULL,
            metadata JSONB DEFAULT '{}',
            anchor_points JSONB DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )"
    )
    .execute(db.as_ref())
    .await?;

    // Create embeddings table with pgvector support
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content_id VARCHAR(255) NOT NULL,
            content_type VARCHAR(100) NOT NULL,
            content_text TEXT NOT NULL,
            embedding_vector vector(1536), -- OpenAI embedding dimension
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(content_id, content_type)
        )"
    )
    .execute(db.as_ref())
    .await?;

    // Create indexes for faster searches
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_embeddings_content_type 
         ON embeddings(content_type)"
    )
    .execute(db.as_ref())
    .await?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_embeddings_content_id 
         ON embeddings(content_id)"
    )
    .execute(db.as_ref())
    .await?;

    // Create vector similarity search index
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
         ON embeddings USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100)"
    )
    .execute(db.as_ref())
    .await
    .ok(); // Don't fail if index can't be created (might not have pgvector)

    tracing::info!("✅ PostgreSQL schema initialized");
    Ok(())
}
