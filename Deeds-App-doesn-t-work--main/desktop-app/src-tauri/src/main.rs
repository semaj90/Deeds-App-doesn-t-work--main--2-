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

    tauri::Builder::default()
        .manage(tauri_state)
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            get_cases,
            create_case,
            download_llm_model
        ])
        .setup(|app| {
            // You can perform additional setup here
            println!("🖥️  Prosecutor Desktop App started!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
