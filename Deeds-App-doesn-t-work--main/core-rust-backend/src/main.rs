use axum::{
    extract::Extension,
    http::StatusCode,
    middleware as axum_middleware,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber;

mod auth_simple;
mod config;
mod database;
mod handlers;
mod middleware;
mod models;
mod utils;
// mod auth;  // Commented out due to jsonwebtoken dependency
// mod llm;  // Commented out for now due to compilation issues
// mod file_processor;  // Commented out for now
// mod qdrant;  // Commented out for now

use config::Config;
use handlers::{auth as auth_handlers, cases, evidence, embeddings, health};
// use llm::LLMService;  // Commented out for now
// use file_processor::FileProcessor;  // Commented out for now
// use qdrant::QdrantService;  // Commented out for now

// Import the AppState from lib.rs
use prosecutor_core::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::init();
    
    tracing::info!("🦀 Starting Prosecutor Backend Server");
    
    // Initialize application state (includes database setup)
    let state = AppState::new().await?;
    tracing::info!("✅ Application state initialized");

    // Build our application with routes
    let app = create_router(state);

    // Run the server on port 3001 (different from SvelteKit dev server)
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    tracing::info!("🚀 Server listening on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn create_router(state: AppState) -> Router {
    Router::new()
        // Health check
        .route("/health", get(health::health_check))
        
        // Authentication routes
        .route("/api/auth/register", post(auth_handlers::register))
        .route("/api/auth/login", post(auth_handlers::login))
        .route("/api/auth/me", get(auth_handlers::me))
        
        // Protected routes (require authentication)
        .route("/api/cases", get(cases::list_cases).post(cases::create_case))
        .route("/api/cases/:id", get(cases::get_case).put(cases::update_case).delete(cases::delete_case))
        
        .route("/api/evidence", post(evidence::upload_evidence))
        .route("/api/evidence/:id", get(evidence::get_evidence).delete(evidence::delete_evidence))
        
        // Content embeddings routes
        .route("/api/embeddings", post(embeddings::create_embedding))
        .route("/api/embeddings/:content_id/:content_type", get(embeddings::get_embedding))
        .route("/api/embeddings/:content_id", get(embeddings::get_content_embeddings))
        .route("/api/embeddings/search", post(embeddings::search_embeddings))
        
        // Apply authentication middleware to protected routes
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::auth_middleware,
        ))
        
        // CORS layer
        .layer(CorsLayer::permissive())
        
        // State layer
        .layer(Extension(state))
}

pub fn create_test_router(state: AppState) -> Router {
    create_router(state)
}
