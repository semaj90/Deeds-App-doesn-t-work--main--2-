// Core Prosecutor Backend Library
// This library provides the core functionality for the prosecutor case management system
// and can be used by web (Vercel), desktop (Tauri), and mobile (Flutter) applications.

pub mod auth_simple;
pub mod config;
pub mod database;
pub mod handlers;
pub mod middleware;
pub mod models;
pub mod utils;

// AI modules (commented out for now due to Windows build issues)
// pub mod llm;
// pub mod file_processor;
// pub mod qdrant;

// Re-export commonly used types
pub use auth_simple::*;
pub use config::Config;
pub use database::*;
pub use models::*;

#[cfg(feature = "postgres")]
use sqlx::{Pool, Postgres};

/// Application state that can be shared across different deployment targets
#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    #[cfg(feature = "postgres")]
    pub pg_pool: Option<Pool<Postgres>>,
    // SQLite connection path (using rusqlite, not sqlx)
    pub sqlite_path: Option<String>,
}

impl AppState {
    pub async fn new() -> anyhow::Result<Self> {
        let config = Config::from_env()?;
        
        #[cfg(feature = "postgres")]
        let pg_pool = if config.database_url.starts_with("postgres") {
            Some(database::create_pg_pool(&config.database_url).await?)
        } else {
            None
        };
        
        let sqlite_path = if !config.database_url.starts_with("postgres") {
            // Initialize SQLite database
            database::init_sqlite(&config.database_url)?;
            Some(config.database_url.clone())
        } else {
            None
        };
        
        Ok(Self {
            config,
            #[cfg(feature = "postgres")]
            pg_pool,
            sqlite_path,
        })
    }
}

// FFI exports for Flutter (when flutter-ffi feature is enabled)
#[cfg(feature = "flutter-ffi")]
pub mod ffi {
    use flutter_rust_bridge::frb;
    
    #[frb(sync)]
    pub fn hello_from_rust() -> String {
        "Hello from Rust core!".to_string()
    }
    
    // Add more FFI functions as needed
    #[frb(sync)]
    pub fn get_app_version() -> String {
        env!("CARGO_PKG_VERSION").to_string()
    }
}

// For Tauri integration
#[cfg(feature = "web-server")]
pub use handlers::*;
