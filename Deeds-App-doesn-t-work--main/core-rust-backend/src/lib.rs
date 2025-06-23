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

use database::DbConnection;

/// Application state that can be shared across different deployment targets
#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub db: DbConnection,
}

impl AppState {
    pub async fn new() -> anyhow::Result<Self> {
        let config = Config::from_env()?;
        
        let db = database::create_connection(&config.database_url)?;
        
        // Initialize schema
        database::init_schema(&db)?;
        
        // Test connection
        database::test_connection(&db)?;
        
        Ok(Self {
            config,
            db,
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
