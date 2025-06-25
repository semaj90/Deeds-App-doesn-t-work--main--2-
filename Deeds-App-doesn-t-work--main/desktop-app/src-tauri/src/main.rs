// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use prosecutor_core::{AppState, models::*};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{Manager, State};
use tokio::sync::Mutex;
use tauri::api::file::copy_file;
use tauri::api::dialog::FileDialogBuilder;
use std::path::PathBuf;

// Tauri application state
struct TauriAppState {
    core: Arc<Mutex<AppState>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AppInfo {
    version: String,
    name: String,
}

// Tauri commands - these can be called from the frontend
#[tauri::command]
async fn get_app_info() -> Result<AppInfo, String> {
    Ok(AppInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        name: env!("CARGO_PKG_NAME").to_string(),
    })
}

#[tauri::command]
async fn get_cases(state: State<'_, TauriAppState>) -> Result<Vec<Case>, String> {
    let core = state.core.lock().await;
    // TODO: Implement case fetching through the core backend
    // For now, return empty vector
    Ok(vec![])
}

#[tauri::command]
async fn create_case(
    title: String,
    description: String,
    state: State<'_, TauriAppState>,
) -> Result<Case, String> {
    let core = state.core.lock().await;
    // TODO: Implement case creation through the core backend
    // For now, return a dummy case
    Ok(Case {
        id: uuid::Uuid::new_v4(),
        title,
        description: Some(description),
        status: "open".to_string(),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        created_by: uuid::Uuid::new_v4(), // Dummy user ID
    })
}

#[tauri::command]
async fn download_llm_model(model_name: String) -> Result<String, String> {
    // TODO: Implement LLM model downloading
    // This would download the model file to app data directory
    Ok(format!("Model {} download started", model_name))
}

#[tauri::command]
async fn upload_llm_model() -> Result<String, String> {
    // Open a file picker dialog for the user to select a model file
    let selected = FileDialogBuilder::new()
        .set_title("Select LLM Model File")
        .pick_file();

    if let Some(path) = selected {
        // Define the destination directory (e.g., llm-models/ in app data dir)
        let app_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
            .ok_or("Could not get app data directory")?;
        let dest_dir = app_dir.join("llm-models");
        std::fs::create_dir_all(&dest_dir).map_err(|e| format!("Failed to create model dir: {}", e))?;
        let dest_path = dest_dir.join(path.file_name().unwrap());
        copy_file(&path, &dest_path, None).map_err(|e| format!("Failed to copy file: {}", e))?;
        Ok(format!("Model uploaded to {}", dest_path.display()))
    } else {
        Err("No file selected".to_string())
    }
}

mod llm;
mod database;
mod commands;

#[tokio::main]
async fn main() {
    tracing_subscriber::init();

    // Initialize the core backend
    let core_state = AppState::new()
        .await
        .expect("Failed to initialize core backend");

    let tauri_state = TauriAppState {
        core: Arc::new(Mutex::new(core_state)),
    };

    let pool = sqlx::SqlitePool::connect("sqlite::memory:")
        .await
        .expect("Failed to create database pool");

    tauri::Builder::default()
        .manage(tauri_state)
        .manage(DatabaseState { pool: Arc::new(pool) })
        .invoke_handler(tauri::generate_handler![
            list_llm_models,
            run_llm_inference,
            upload_llm_model,
            get_cases,
            create_case,
            commands::save_case,
            commands::summarize_case,
            commands::tag_with_qdrant,
            commands::cache_recent_case,
            commands::process_evidence,
            commands::llm_inference,
            commands::ai_search_query,
            commands::upload_evidence_file,
            commands::analyze_evidence,
            commands::get_ai_suggestions,
            commands::save_settings,
            commands::load_settings,
        ])
        .setup(|app| {
            // You can perform additional setup here
            println!("🖥️  Prosecutor Desktop App started!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
