// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Builder, generate_handler};
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use std::sync::Arc;

mod llm;
mod database;

// Database state
pub struct DatabaseState {
    pub pool: Arc<Pool<Postgres>>,
}

// LLM model listing command
#[tauri::command]
async fn list_llm_models() -> Result<Vec<String>, String> {
    llm::list_models().await
}

// LLM inference command
#[tauri::command]
async fn run_llm_inference(model: String, prompt: String) -> Result<String, String> {
    llm::run_inference(model, prompt).await
}

// LLM upload command
#[tauri::command]
async fn upload_llm_model(file_path: String) -> Result<String, String> {
    llm::upload_model(file_path).await
}

// Database connection command
#[tauri::command]
async fn get_cases(state: tauri::State<'_, DatabaseState>) -> Result<Vec<serde_json::Value>, String> {
    database::get_cases(&state.pool).await
}

#[tauri::command]
async fn create_case(
    state: tauri::State<'_, DatabaseState>,
    title: String,
    description: String,
) -> Result<serde_json::Value, String> {
    database::create_case(&state.pool, title, description).await
}

#[tokio::main]
async fn main() {
    // Initialize database connection
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5433/prosecutor_db".to_string());
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let db_state = DatabaseState {
        pool: Arc::new(pool),
    };

    Builder::default()
        .manage(db_state)
        .invoke_handler(generate_handler![
            list_llm_models,
            run_llm_inference,
            upload_llm_model,
            get_cases,
            create_case
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
