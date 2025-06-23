use anyhow::Result;
use rusqlite::{Connection, Result as SqliteResult};
use std::path::Path;
use std::sync::{Arc, Mutex};

// Database connection wrapper
pub type DbConnection = Arc<Mutex<Connection>>;

// SQLite functions using rusqlite
pub fn create_connection(database_url: &str) -> Result<DbConnection> {
    // Remove "sqlite://" prefix if present
    let path = database_url.strip_prefix("sqlite://").unwrap_or(database_url);
    
    // Create directory if it doesn't exist
    if let Some(parent) = Path::new(path).parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)?;
        }
    }

    let conn = Connection::open(path)?;
    
    // Enable foreign key support
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    
    tracing::info!("✅ SQLite connection established at: {}", path);
    Ok(Arc::new(Mutex::new(conn)))
}

pub fn test_connection(db: &DbConnection) -> Result<()> {
    let conn = db.lock().unwrap();
    conn.execute("SELECT 1", [])?;
    tracing::info!("✅ SQLite connection test successful");
    Ok(())
}

pub fn init_schema(db: &DbConnection) -> Result<()> {
    let conn = db.lock().unwrap();
    
    // Create basic tables for case management
    conn.execute(
        "CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create evidence table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            hash_sha256 TEXT NOT NULL,
            metadata TEXT DEFAULT '{}', -- JSON string
            anchor_points TEXT DEFAULT '[]', -- JSON string
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create embeddings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_id TEXT NOT NULL,
            content_type TEXT NOT NULL,
            content_text TEXT NOT NULL,
            embedding_vector TEXT NOT NULL, -- JSON string
            metadata TEXT DEFAULT '{}', -- JSON string
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(content_id, content_type)
        )",
        [],
    )?;

    // Create index on embeddings for faster searches
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_embeddings_content_type 
         ON embeddings(content_type)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_embeddings_content_id 
         ON embeddings(content_id)",
        [],
    )?;

    tracing::info!("✅ SQLite schema initialized");
    Ok(())
}
