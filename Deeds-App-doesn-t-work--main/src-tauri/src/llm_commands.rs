// Tauri Commands for Local LLM Integration and File Management
// IMPORTANT: This system ONLY handles user-provided GGUF models
// NO automatic downloads, bundled models, or model provision occurs

use tauri::{command, AppHandle, Manager};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tokio::process::Command;
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead, generic_array::GenericArray};
use sha2::{Sha256, Digest};
use rand::{RngCore, rngs::OsRng};
use std::env;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelEncryptionInfo {
    pub is_encrypted: bool,
    pub nonce: Option<Vec<u8>>,
    pub key_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InferenceRequest {
    pub prompt: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub context_window: Option<u32>,
    pub system_prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InferenceResponse {
    pub text: String,
    pub tokens_generated: u32,
    pub tokens_per_second: f32,
    pub processing_time_ms: u64,
    pub model_used: String,
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

// Get the secure keys directory
fn get_keys_dir() -> Result<PathBuf, String> {
    let home_dir = env::var("USERPROFILE")
        .or_else(|_| env::var("HOME"))
        .map_err(|_| "Cannot determine home directory")?;
    
    let keys_dir = PathBuf::from(home_dir).join(".deeds").join("keys");
    
    if !keys_dir.exists() {
        fs::create_dir_all(&keys_dir)
            .map_err(|e| format!("Failed to create keys directory: {}", e))?;
    }
    
    Ok(keys_dir)
}

// Generate or load encryption key
fn get_or_create_model_key() -> Result<[u8; 32], String> {
    let keys_dir = get_keys_dir()?;
    let key_path = keys_dir.join("model.key");
    
    if key_path.exists() {
        let key_data = fs::read(&key_path)
            .map_err(|e| format!("Failed to read encryption key: {}", e))?;
        
        if key_data.len() != 32 {
            return Err("Invalid key size".to_string());
        }
        
        let mut key = [0u8; 32];
        key.copy_from_slice(&key_data);
        Ok(key)
    } else {
        // Generate new key
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        
        fs::write(&key_path, &key)
            .map_err(|e| format!("Failed to save encryption key: {}", e))?;
        
        // Set secure permissions (Unix-like systems)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&key_path)
                .map_err(|e| format!("Failed to get key file metadata: {}", e))?
                .permissions();
            perms.set_mode(0o600); // Read/write for owner only
            fs::set_permissions(&key_path, perms)
                .map_err(|e| format!("Failed to set key file permissions: {}", e))?;
        }
        
        Ok(key)
    }
}

// Get the active model name from config
fn get_active_model_name(app_handle: &AppHandle) -> Result<String, String> {
    let config = get_llm_config(app_handle.clone()).await?;
    config.get("active_model")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or("No active model set in config".to_string())
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

// Encrypt model file
#[command]
pub async fn encrypt_model_file(
    app_handle: AppHandle,
    model_path: String,
) -> Result<String, String> {
    let models_dir = get_models_dir(&app_handle)?;
    let source_path = PathBuf::from(&model_path);
    
    if !source_path.exists() {
        return Err("Model file does not exist".to_string());
    }
    
    let key = get_or_create_model_key()?;
    let cipher = Aes256Gcm::new(Key::from_slice(&key));
    
    // Generate random nonce
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    // Read model file
    let plaintext = fs::read(&source_path)
        .map_err(|e| format!("Failed to read model file: {}", e))?;
    
    // Encrypt
    let ciphertext = cipher.encrypt(nonce, plaintext.as_ref())
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    // Save encrypted file
    let encrypted_filename = format!("{}.encrypted", 
        source_path.file_name().unwrap().to_string_lossy());
    let encrypted_path = models_dir.join(&encrypted_filename);
    
    fs::write(&encrypted_path, &ciphertext)
        .map_err(|e| format!("Failed to write encrypted file: {}", e))?;
    
    // Save encryption metadata
    let metadata = ModelEncryptionInfo {
        is_encrypted: true,
        nonce: Some(nonce_bytes.to_vec()),
        key_id: "model.key".to_string(),
    };
    
    let metadata_path = models_dir.join(format!("{}.meta", encrypted_filename));
    let metadata_json = serde_json::to_string_pretty(&metadata)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    
    fs::write(&metadata_path, metadata_json)
        .map_err(|e| format!("Failed to write metadata: {}", e))?;
    
    Ok(format!("Model encrypted successfully: {}", encrypted_filename))
}

// Decrypt and load model for inference
#[command]
pub async fn run_llama_inference(
    app_handle: AppHandle,
    request: InferenceRequest,
    model_name: String,
) -> Result<InferenceResponse, String> {
    let models_dir = get_models_dir(&app_handle)?;
    let start_time = std::time::Instant::now();
    
    // Check if model is encrypted
    let encrypted_path = models_dir.join(&format!("{}.encrypted", model_name));
    let metadata_path = models_dir.join(&format!("{}.encrypted.meta", model_name));
    
    let model_data = if encrypted_path.exists() && metadata_path.exists() {
        // Decrypt model
        let key = get_or_create_model_key()?;
        let cipher = Aes256Gcm::new(Key::from_slice(&key));
        
        // Read metadata
        let metadata_content = fs::read_to_string(&metadata_path)
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        let metadata: ModelEncryptionInfo = serde_json::from_str(&metadata_content)
            .map_err(|e| format!("Failed to parse metadata: {}", e))?;
        
        if !metadata.is_encrypted {
            return Err("Model metadata indicates unencrypted file".to_string());
        }
        
        let nonce_bytes = metadata.nonce.ok_or("Missing nonce in metadata")?;
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // Read and decrypt
        let ciphertext = fs::read(&encrypted_path)
            .map_err(|e| format!("Failed to read encrypted model: {}", e))?;
        
        cipher.decrypt(nonce, ciphertext.as_ref())
            .map_err(|e| format!("Decryption failed: {}", e))?
    } else {
        // Try unencrypted model
        let model_path = models_dir.join(&model_name);
        if !model_path.exists() {
            return Err(format!("Model file not found: {}", model_name));
        }
        
        fs::read(&model_path)
            .map_err(|e| format!("Failed to read model file: {}", e))?
    };
    
    // For now, we'll call an external llama.cpp server
    // In a full implementation, you could integrate llama.cpp directly via Rust bindings
    let inference_result = run_external_llama_inference(&request, &model_data).await?;
    
    let processing_time = start_time.elapsed().as_millis() as u64;
    
    Ok(InferenceResponse {
        text: inference_result.text,
        tokens_generated: inference_result.tokens_generated,
        tokens_per_second: if processing_time > 0 {
            inference_result.tokens_generated as f32 / (processing_time as f32 / 1000.0)
        } else {
            0.0
        },
        processing_time_ms: processing_time,
        model_used: model_name,
    })
}

// External inference helper (replace with direct llama.cpp integration if needed)
async fn run_external_llama_inference(
    request: &InferenceRequest,
    _model_data: &[u8], // For direct integration, this would be used to load the model
) -> Result<InferenceResponse, String> {
    let client = reqwest::Client::new();
    
    // Call local llama.cpp server
    let response = client
        .post("http://localhost:8080/completion")
        .json(&serde_json::json!({
            "prompt": request.prompt,
            "n_predict": request.max_tokens.unwrap_or(512),
            "temperature": request.temperature.unwrap_or(0.7),
            "top_p": request.top_p.unwrap_or(0.95),
            "n_ctx": request.context_window.unwrap_or(2048),
            "system_prompt": request.system_prompt,
            "stream": false
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to call inference server: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Inference server error: {}", response.status()));
    }
    
    let result: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse inference response: {}", e))?;
    
    Ok(InferenceResponse {
        text: result["content"].as_str().unwrap_or("").to_string(),
        tokens_generated: result["tokens_evaluated"].as_u64().unwrap_or(0) as u32,
        tokens_per_second: 0.0, // Will be calculated by caller
        processing_time_ms: 0, // Will be calculated by caller
        model_used: "loaded".to_string(),
    })
}

// Start local llama.cpp server with model
#[command]
pub async fn start_llama_server(
    app_handle: AppHandle,
    model_name: String,
    port: Option<u16>,
) -> Result<String, String> {
    let models_dir = get_models_dir(&app_handle)?;
    let port = port.unwrap_or(8080);
    
    // Check if model exists (encrypted or unencrypted)
    let encrypted_path = models_dir.join(&format!("{}.encrypted", model_name));
    let model_path = models_dir.join(&model_name);
    
    let final_model_path = if encrypted_path.exists() {
        // For encrypted models, we'd need to decrypt to a temporary file
        // For simplicity, we'll assume unencrypted for server startup
        return Err("Encrypted models require decryption before server startup. Use run_llama_inference for encrypted models.".to_string());
    } else if model_path.exists() {
        model_path
    } else {
        return Err(format!("Model not found: {}", model_name));
    };
    
    // Start llama.cpp server
    let mut cmd = Command::new("llama-server");
    cmd.args(&[
        "-m", &final_model_path.to_string_lossy(),
        "--port", &port.to_string(),
        "--host", "127.0.0.1",
        "--n-gpu-layers", "99", // Use GPU if available
        "--ctx-size", "4096",
    ]);
    
    let child = cmd.spawn()
        .map_err(|e| format!("Failed to start llama server: {}. Make sure llama.cpp is installed.", e))?;
    
    // Store process ID for later management
    let pid = child.id().unwrap_or(0);
    
    Ok(format!("Llama server started on port {} with PID {}", port, pid))
}

// Health check for inference service
#[command]
pub async fn check_inference_health() -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    
    match client.get("http://localhost:8080/health").send().await {
        Ok(response) if response.status().is_success() => {
            Ok(serde_json::json!({
                "status": "healthy",
                "service": "llama.cpp",
                "port": 8080,
                "available": true
            }))
        }
        Ok(response) => {
            Ok(serde_json::json!({
                "status": "error",
                "service": "llama.cpp",
                "port": 8080,
                "available": false,
                "error": format!("HTTP {}", response.status())
            }))
        }
        Err(e) => {
            Ok(serde_json::json!({
                "status": "offline",
                "service": "llama.cpp",
                "port": 8080,
                "available": false,
                "error": format!("Connection failed: {}", e)
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
            check_llm_service_status,
            encrypt_model_file,
            run_llama_inference,
            start_llama_server,
            check_inference_health
        ])
        .build()
}
