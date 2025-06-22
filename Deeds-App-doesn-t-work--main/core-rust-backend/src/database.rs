use anyhow::Result;

// PostgreSQL support (using sqlx)
#[cfg(feature = "postgres")]
use sqlx::{migrate::MigrateDatabase, PgPool, Postgres};

// SQLite support (using rusqlite for better Windows compatibility)
use rusqlite::{Connection, Result as SqliteResult};
use std::path::Path;

// PostgreSQL functions
#[cfg(feature = "postgres")]
pub async fn create_pg_pool(database_url: &str) -> Result<PgPool> {
    // Ensure the database exists
    if !Postgres::database_exists(database_url).await.unwrap_or(false) {
        tracing::info!("📝 PostgreSQL database does not exist, creating...");
        Postgres::create_database(database_url).await?;
    }

    // Create connection pool
    let pool = PgPool::connect(database_url).await?;
    
    tracing::info!("✅ PostgreSQL connection established");
    Ok(pool)
}

#[cfg(feature = "postgres")]
pub async fn test_pg_connection(pool: &PgPool) -> Result<()> {
    sqlx::query("SELECT 1")
        .execute(pool)
        .await?;
    Ok(())
}

// SQLite functions (using rusqlite for Windows compatibility)
pub fn create_sqlite_connection(database_path: &str) -> SqliteResult<Connection> {
    // Create directory if it doesn't exist
    if let Some(parent) = Path::new(database_path).parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)
                .map_err(|e| rusqlite::Error::SqliteFailure(
                    rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CANTOPEN),
                    Some(format!("Failed to create directory: {}", e))
                ))?;
        }
    }

    let conn = Connection::open(database_path)?;
    
    // Enable foreign key support
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    
    tracing::info!("✅ SQLite connection established at: {}", database_path);
    Ok(conn)
}

pub fn test_sqlite_connection(conn: &Connection) -> SqliteResult<()> {
    conn.execute("SELECT 1", [])?;
    Ok(())
}

// Initialize SQLite database with basic schema
pub fn init_sqlite_schema(conn: &Connection) -> SqliteResult<()> {
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

    tracing::info!("✅ SQLite schema initialized");
    Ok(())
}

// Initialize SQLite database file and schema
pub fn init_sqlite(database_path: &str) -> Result<()> {
    // Remove "sqlite://" prefix if present
    let path = database_path.strip_prefix("sqlite://").unwrap_or(database_path);
    
    // Create directory if it doesn't exist
    if let Some(parent) = Path::new(path).parent() {
        std::fs::create_dir_all(parent)?;
    }
    
    // Open connection and initialize schema
    let conn = Connection::open(path)?;
    init_sqlite_schema(&conn)?;
    
    tracing::info!("✅ SQLite database initialized at: {}", path);
    Ok(())
}
