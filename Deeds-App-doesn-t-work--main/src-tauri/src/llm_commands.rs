// Tauri Commands for Local LLM Integration and File Management
// IMPORTANT: This system ONLY handles user-provided GGUF models
// NO automatic downloads, bundled models, or model provision occurs

use tauri::{command, AppHandle, Manager};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tokio::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMConfig {
    pub model_path: String,
    pub model_name: String,
    pub is_active: bool,
    pub model_size: u64,
    pub upload_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMRequest {
    pub prompt: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub context: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLMResponse {
    pub response: String,
    pub tokens_used: u32,
    pub processing_time_ms: u64,
}

// Get the models directory path
fn get_models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    let models_dir = app_data_dir.join("models");
    
    // Create directory if it doesn't exist
    if !models_dir.exists() {
        fs::create_dir_all(&models_dir)
            .map_err(|e| format!("Failed to create models directory: {}", e))?;
    }
    
    Ok(models_dir)
}

#[command]
pub async fn list_local_models(app_handle: AppHandle) -> Result<Vec<LLMConfig>, String> {
    let models_dir = get_models_dir(&app_handle)?;
    let mut models = Vec::new();
    
    if models_dir.exists() {
        let entries = fs::read_dir(models_dir)
            .map_err(|e| format!("Failed to read models directory: {}", e))?;
        
        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();
            
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("gguf") {
                let metadata = fs::metadata(&path)
                    .map_err(|e| format!("Failed to get file metadata: {}", e))?;
                
                let model_name = path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();
                
                models.push(LLMConfig {
                    model_path: path.to_string_lossy().to_string(),
                    model_name,
                    is_active: false, // TODO: Check if this is the active model
                    model_size: metadata.len(),
                    upload_date: metadata.created()
                        .map(|t| format!("{:?}", t))
                        .unwrap_or_else(|_| "Unknown".to_string()),
                });
            }
        }
    }
    
    Ok(models)
}

#[command]
pub async fn upload_llm_model(
    app_handle: AppHandle,
    file_path: String,
    model_name: String,
) -> Result<String, String> {
    let models_dir = get_models_dir(&app_handle)?;
    let source_path = PathBuf::from(file_path);
    
    if !source_path.exists() {
        return Err("Source file does not exist".to_string());
    }
      // Validate file extension
    if source_path.extension().and_then(|s| s.to_str()) != Some("gguf") {
        return Err("Only .gguf model files are supported. Please provide your own GGUF model. No automatic downloads or model provision occurs.".to_string());
    }
    
    // Security check: ensure this is not a URL or remote path
    let path_str = source_path.to_string_lossy();
    if path_str.contains("://") || path_str.starts_with("http") {
        return Err("Remote URLs are not allowed. Only local user-provided files are supported.".to_string());
    }
    
    // Validate file size (optional - warn if very large)
    let metadata = fs::metadata(&source_path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    
    let file_size_gb = metadata.len() as f64 / (1024.0 * 1024.0 * 1024.0);
    if file_size_gb > 10.0 {
        println!("Warning: Large model file ({:.1} GB). This may take time to load and use significant memory.", file_size_gb);
    }
    
    let destination_path = models_dir.join(&model_name);
    
    // Copy the file to the models directory
    fs::copy(&source_path, &destination_path)
        .map_err(|e| format!("Failed to copy model file: {}", e))?;
    
    Ok(format!("Model '{}' uploaded successfully ({:.1} GB)", model_name, file_size_gb))
}

#[command]
pub async fn delete_llm_model(
    app_handle: AppHandle,
    model_name: String,
) -> Result<String, String> {
    let models_dir = get_models_dir(&app_handle)?;
    let model_path = models_dir.join(&model_name);
    
    if !model_path.exists() {
        return Err("Model file does not exist".to_string());
    }
    
    fs::remove_file(&model_path)
        .map_err(|e| format!("Failed to delete model file: {}", e))?;
    
    Ok(format!("Model '{}' deleted successfully", model_name))
}

#[command]
pub async fn generate_with_local_llm(
    app_handle: AppHandle,
    request: LLMRequest,
    model_name: Option<String>,
) -> Result<LLMResponse, String> {
    let models_dir = get_models_dir(&app_handle)?;
    
    // Get the model to use (user-specified or from config)
    let model_to_use = match model_name {
        Some(name) => name,
        None => {
            // Try to get active model from config
            let config = get_llm_config(app_handle.clone()).await?;
            config.get("active_model")
                .and_then(|v| v.as_str())
                .unwrap_or("") // No default model - user must provide
                .to_string()
        }
    };
      if model_to_use.is_empty() {
        return Err("No model specified. Please upload your own GGUF model and set it as active. This application does not provide or download models automatically.".to_string());
    }
    
    let model_path = models_dir.join(&model_to_use);
      if !model_path.exists() {
        return Err(format!("Model '{}' not found. Please upload your GGUF model first. No automatic downloads occur.", model_to_use));
    }
    
    let start_time = std::time::Instant::now();
    
    // For this example, we'll call the Python NLP service
    // In a full implementation, you might integrate llama.cpp directly via Rust bindings
    let client = reqwest::Client::new();
    let python_service_url = "http://localhost:8001";
    
    // First, tell the Python service to load this model
    let load_response = client
        .post(&format!("{}/models/load", python_service_url))
        .json(&serde_json::json!({
            "model_path": model_path.to_string_lossy()
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to communicate with NLP service: {}", e))?;
    
    if !load_response.status().is_success() {
        return Err("Failed to load model in NLP service".to_string());
    }
    
    // Now generate with the loaded model
    let generate_response = client
        .post(&format!("{}/generate", python_service_url))
        .json(&serde_json::json!({
            "prompt": request.prompt,
            "max_tokens": request.max_tokens.unwrap_or(512),
            "temperature": request.temperature.unwrap_or(0.7),
            "context": request.context
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to generate text: {}", e))?;
    
    if !generate_response.status().is_success() {
        return Err("Text generation failed".to_string());
    }
    
    let response_data: serde_json::Value = generate_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    let processing_time = start_time.elapsed().as_millis() as u64;
    
    Ok(LLMResponse {
        response: response_data["response"].as_str().unwrap_or("").to_string(),
        tokens_used: response_data["tokens_used"].as_u64().unwrap_or(0) as u32,
        processing_time_ms: processing_time,
    })
}

#[command]
pub async fn get_llm_config(app_handle: AppHandle) -> Result<serde_json::Value, String> {
    let models_dir = get_models_dir(&app_handle)?;
    
    // Read configuration file if it exists
    let config_path = models_dir.join("config.json");
    
    if config_path.exists() {
        let config_content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        
        let config: serde_json::Value = serde_json::from_str(&config_content)
            .map_err(|e| format!("Failed to parse config: {}", e))?;
        
        Ok(config)
    } else {
        // Return default configuration
        Ok(serde_json::json!({
            "active_model": null,
            "default_temperature": 0.7,
            "default_max_tokens": 512,
            "models_directory": models_dir.to_string_lossy(),
            "auto_load_model": false
        }))
    }
}

#[command]
pub async fn update_llm_config(
    app_handle: AppHandle,
    config: serde_json::Value,
) -> Result<String, String> {
    let models_dir = get_models_dir(&app_handle)?;
    let config_path = models_dir.join("config.json");
    
    let config_string = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(&config_path, config_string)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok("Configuration updated successfully".to_string())
}

#[command]
pub async fn check_llm_service_status() -> Result<serde_json::Value, String> {
    // Check if local LLM service is running
    let client = reqwest::Client::new();
    
    match client.get("http://localhost:8000/health").send().await {
        Ok(response) if response.status().is_success() => {
            Ok(serde_json::json!({
                "status": "running",
                "service_url": "http://localhost:8000",
                "available": true
            }))
        }
        _ => {
            Ok(serde_json::json!({
                "status": "not_running",
                "service_url": "http://localhost:8000",
                "available": false
            }))
        }
    }
}

// Register all commands with your Tauri app
pub fn register_llm_commands<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("llm")
        .invoke_handler(tauri::generate_handler![
            list_local_models,
            upload_llm_model,
            delete_llm_model,
            generate_with_local_llm,
            get_llm_config,
            update_llm_config,
            check_llm_service_status
        ])
        .build()
}
