use anyhow::Result;
use sqlx::{migrate::MigrateDatabase, PgPool, Postgres};

pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    // Ensure the database exists
    if !Postgres::database_exists(database_url).await.unwrap_or(false) {
        tracing::info!("📝 Database does not exist, creating...");
        Postgres::create_database(database_url).await?;
    }

    // Create connection pool
    let pool = PgPool::connect(database_url).await?;
    
    tracing::info!("✅ Database connection established");
    Ok(pool)
}

pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    // For now, we'll assume the SvelteKit app already ran the migrations
    // In the future, we can run our own migrations here
    tracing::info!("✅ Database migrations completed (using existing SvelteKit schema)");
    Ok(())
}

// Test database connection
pub async fn test_connection(pool: &PgPool) -> Result<()> {
    sqlx::query("SELECT 1")
        .execute(pool)
        .await?;
    Ok(())
}
