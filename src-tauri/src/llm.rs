use tauri::command;
use std::fs;
use std::path::PathBuf;

#[command]
pub fn list_llm_models() -> Vec<String> {
    let mut models = vec![];
    let base = PathBuf::from("llm-models");
    if let Ok(entries) = fs::read_dir(base) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                models.push(entry.file_name().to_string_lossy().to_string());
            }
        }
    }
    models
}

#[command]
pub fn run_llm_inference(model: String, prompt: String) -> String {
    // Stub: Replace with actual inference logic
    format!("Model: {}, Prompt: {}", model, prompt)
}
