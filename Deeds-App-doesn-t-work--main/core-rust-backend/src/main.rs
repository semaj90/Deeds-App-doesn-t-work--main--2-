use axum::{
    extract::Extension,
    http::StatusCode,
    middleware as axum_middleware,
    response::Json,
    routing::{delete, get, post, put},
    Router,
};
use sqlx::{PgPool, Pool, Postgres};
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
use handlers::{auth as auth_handlers, cases, evidence, health};
// use llm::LLMService;  // Commented out for now
// use file_processor::FileProcessor;  // Commented out for now
// use qdrant::QdrantService;  // Commented out for now

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Postgres>,
    pub config: Config,
    // pub llm_service: LLMService,  // Commented out for now
    // pub file_processor: FileProcessor,  // Commented out for now
    // pub qdrant_service: QdrantService,  // Commented out for now
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::init();

    // Load configuration
    let config = Config::from_env()?;
    
    tracing::info!("🦀 Starting Prosecutor Backend Server");
    tracing::info!("📊 Connecting to database: {}", config.database_url_safe());    // Connect to database
    let db_pool = database::create_pool(&config.database_url).await?;
    
    // Run migrations
    tracing::info!("🔄 Running database migrations...");
    database::run_migrations(&db_pool).await?;    
    // Initialize LLM service (commented out for now)
    // tracing::info!("🤖 Initializing Local LLM service...");
    // let model_path = std::env::var("LOCAL_LLM_MODEL_PATH").ok();
    // let enable_ai = std::env::var("ENABLE_AI_TAGGING").unwrap_or_default() == "true";
    // let llm_service = LLMService::new(model_path, enable_ai).await?;
    
    // Initialize file processor (commented out for now)
    // tracing::info!("📁 Initializing file processor...");
    // let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
    // let enable_ocr = std::env::var("ENABLE_OCR").unwrap_or_default() == "true";
    // let enable_text_extraction = std::env::var("ENABLE_TEXT_EXTRACTION").unwrap_or_default() == "true";
    // let max_file_size = std::env::var("MAX_FILE_SIZE")
    //     .unwrap_or_else(|_| "52428800".to_string())
    //     .parse::<usize>()
    //     .unwrap_or(52428800);
    
    // let file_processor = FileProcessor::new(upload_dir, enable_ocr, enable_text_extraction, max_file_size);
    
    // Initialize Qdrant service (commented out for now)
    // tracing::info!("🔍 Initializing Qdrant vector search service...");
    // let qdrant_url = std::env::var("QDRANT_URL").unwrap_or_else(|_| "http://localhost:6333".to_string());
    // let qdrant_service = QdrantService::new(&qdrant_url, llm_service.clone()).await?;
      let state = AppState {
        db: db_pool,
        config: config.clone(),
    };

    // Build our application with routes
    let app = create_router(state);

    // Run the server
    let addr = SocketAddr::from(([127, 0, 0, 1], config.port));
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
