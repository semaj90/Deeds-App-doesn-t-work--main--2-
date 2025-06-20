// Rust Evidence Processor for Local File Enhancement
// Handles file preprocessing before sending to Python AI service
// Focuses on performance-critical operations like video frame extraction

use tauri::{command, AppHandle, Manager};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tokio::process::Command as TokioCommand;

#[derive(Debug, Serialize, Deserialize)]
pub struct EvidenceFile {
    pub file_path: String,
    pub case_id: String,
    pub evidence_type: String,
    pub file_size: u64,
    pub upload_date: String,
    pub enhanced_versions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessingRequest {
    pub file_path: String,
    pub case_id: String,
    pub evidence_type: String,
    pub enhancement_level: i32,
    pub extract_frames: bool,
    pub frame_interval: f64, // seconds
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessingResult {
    pub success: bool,
    pub processed_files: Vec<String>,
    pub frame_extracts: Vec<String>,
    pub metadata: EvidenceMetadata,
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EvidenceMetadata {
    pub file_type: String,
    pub duration: Option<f64>,
    pub dimensions: Option<(u32, u32)>,
    pub file_size: u64,
    pub codec: Option<String>,
    pub bitrate: Option<i32>,
}

// Get evidence storage directory
fn get_evidence_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app data directory")?;
    
    let evidence_dir = app_data_dir.join("evidence");
    
    if !evidence_dir.exists() {
        fs::create_dir_all(&evidence_dir)
            .map_err(|e| format!("Failed to create evidence directory: {}", e))?;
    }
    
    Ok(evidence_dir)
}

#[command]
pub async fn process_evidence_file(
    app_handle: AppHandle,
    request: ProcessingRequest,
) -> Result<ProcessingResult, String> {
    let evidence_dir = get_evidence_dir(&app_handle)?;
    let source_path = Path::new(&request.file_path);
    
    if !source_path.exists() {
        return Err("Source file does not exist".to_string());
    }
    
    let metadata = extract_file_metadata(&request.file_path).await?;
    let mut result = ProcessingResult {
        success: false,
        processed_files: Vec::new(),
        frame_extracts: Vec::new(),
        metadata,
        error_message: None,
    };
    
    match request.evidence_type.as_str() {
        "video" => {
            result = process_video_file(&request, &evidence_dir).await?;
        }
        "image" => {
            result = process_image_file(&request, &evidence_dir).await?;
        }
        "audio" => {
            result = process_audio_file(&request, &evidence_dir).await?;
        }
        "document" => {
            result = process_document_file(&request, &evidence_dir).await?;
        }
        _ => {
            return Err("Unsupported evidence type".to_string());
        }
    }
    
    result.success = true;
    Ok(result)
}

async fn extract_file_metadata(file_path: &str) -> Result<EvidenceMetadata, String> {
    let path = Path::new(file_path);
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    
    let file_size = metadata.len();
    let extension = path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("unknown")
        .to_lowercase();
    
    let mut evidence_metadata = EvidenceMetadata {
        file_type: extension.clone(),
        duration: None,
        dimensions: None,
        file_size,
        codec: None,
        bitrate: None,
    };
    
    // Use FFprobe for video/audio metadata
    if ["mp4", "avi", "mov", "mkv", "webm", "mp3", "wav", "m4a"].contains(&extension.as_str()) {
        if let Ok(output) = TokioCommand::new("ffprobe")
            .args([
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                file_path
            ])
            .output()
            .await
        {
            if output.status.success() {
                let json_str = String::from_utf8_lossy(&output.stdout);
                if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(&json_str) {
                    // Extract duration
                    if let Some(format) = json_value.get("format") {
                        if let Some(duration_str) = format.get("duration").and_then(|d| d.as_str()) {
                            if let Ok(duration) = duration_str.parse::<f64>() {
                                evidence_metadata.duration = Some(duration);
                            }
                        }
                    }
                    
                    // Extract video dimensions and codec
                    if let Some(streams) = json_value.get("streams").and_then(|s| s.as_array()) {
                        for stream in streams {
                            if stream.get("codec_type").and_then(|ct| ct.as_str()) == Some("video") {
                                let width = stream.get("width").and_then(|w| w.as_u64()).unwrap_or(0) as u32;
                                let height = stream.get("height").and_then(|h| h.as_u64()).unwrap_or(0) as u32;
                                evidence_metadata.dimensions = Some((width, height));
                                
                                if let Some(codec) = stream.get("codec_name").and_then(|c| c.as_str()) {
                                    evidence_metadata.codec = Some(codec.to_string());
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(evidence_metadata)
}

async fn process_video_file(
    request: &ProcessingRequest,
    evidence_dir: &Path,
) -> Result<ProcessingResult, String> {
    let case_dir = evidence_dir.join(&request.case_id);
    fs::create_dir_all(&case_dir)
        .map_err(|e| format!("Failed to create case directory: {}", e))?;
    
    let mut result = ProcessingResult {
        success: false,
        processed_files: Vec::new(),
        frame_extracts: Vec::new(),
        metadata: extract_file_metadata(&request.file_path).await?,
        error_message: None,
    };
    
    // Extract frames if requested
    if request.extract_frames {
        let frames_dir = case_dir.join("frames");
        fs::create_dir_all(&frames_dir)
            .map_err(|e| format!("Failed to create frames directory: {}", e))?;
        
        // Use FFmpeg to extract frames
        let output = TokioCommand::new("ffmpeg")
            .args([
                "-i", &request.file_path,
                "-vf", &format!("fps=1/{}", request.frame_interval),
                "-y", // Overwrite existing files
                &format!("{}/frame_%04d.png", frames_dir.to_string_lossy())
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;
        
        if output.status.success() {
            // List extracted frames
            let frame_entries = fs::read_dir(&frames_dir)
                .map_err(|e| format!("Failed to read frames directory: {}", e))?;
            
            for entry in frame_entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.extension().and_then(|ext| ext.to_str()) == Some("png") {
                        result.frame_extracts.push(path.to_string_lossy().to_string());
                    }
                }
            }
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Frame extraction failed: {}", error_msg));
        }
    }
    
    // Create optimized copy for processing
    let processed_file = case_dir.join(format!("processed_{}", 
        Path::new(&request.file_path).file_name().unwrap().to_string_lossy()));
    
    // Optimize video for AI processing (lower resolution, consistent format)
    let output = TokioCommand::new("ffmpeg")
        .args([
            "-i", &request.file_path,
            "-vf", "scale=1280:720",
            "-c:v", "libx264",
            "-c:a", "aac",
            "-y",
            &processed_file.to_string_lossy()
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to optimize video: {}", e))?;
    
    if output.status.success() {
        result.processed_files.push(processed_file.to_string_lossy().to_string());
    }
    
    Ok(result)
}

async fn process_image_file(
    request: &ProcessingRequest,
    evidence_dir: &Path,
) -> Result<ProcessingResult, String> {
    let case_dir = evidence_dir.join(&request.case_id);
    fs::create_dir_all(&case_dir)
        .map_err(|e| format!("Failed to create case directory: {}", e))?;
    
    let result = ProcessingResult {
        success: false,
        processed_files: vec![request.file_path.clone()], // For images, we can process original
        frame_extracts: Vec::new(),
        metadata: extract_file_metadata(&request.file_path).await?,
        error_message: None,
    };
    
    // TODO: Add image enhancement using Rust image processing libraries
    // For now, we'll let the Python service handle image processing
    
    Ok(result)
}

async fn process_audio_file(
    request: &ProcessingRequest,
    evidence_dir: &Path,
) -> Result<ProcessingResult, String> {
    let case_dir = evidence_dir.join(&request.case_id);
    fs::create_dir_all(&case_dir)
        .map_err(|e| format!("Failed to create case directory: {}", e))?;
    
    let mut result = ProcessingResult {
        success: false,
        processed_files: Vec::new(),
        frame_extracts: Vec::new(),
        metadata: extract_file_metadata(&request.file_path).await?,
        error_message: None,
    };
    
    // Convert to WAV for better processing
    let processed_file = case_dir.join(format!("processed_{}.wav", 
        Path::new(&request.file_path).file_stem().unwrap().to_string_lossy()));
    
    let output = TokioCommand::new("ffmpeg")
        .args([
            "-i", &request.file_path,
            "-acodec", "pcm_s16le",
            "-ar", "16000", // 16kHz for Whisper
            "-ac", "1", // Mono
            "-y",
            &processed_file.to_string_lossy()
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to process audio: {}", e))?;
    
    if output.status.success() {
        result.processed_files.push(processed_file.to_string_lossy().to_string());
    }
    
    Ok(result)
}

async fn process_document_file(
    request: &ProcessingRequest,
    evidence_dir: &Path,
) -> Result<ProcessingResult, String> {
    let result = ProcessingResult {
        success: false,
        processed_files: vec![request.file_path.clone()],
        frame_extracts: Vec::new(),
        metadata: extract_file_metadata(&request.file_path).await?,
        error_message: None,
    };
    
    // Document processing will be handled by Python service
    Ok(result)
}

#[command]
pub async fn list_evidence_files(
    app_handle: AppHandle,
    case_id: Option<String>,
) -> Result<Vec<EvidenceFile>, String> {
    let evidence_dir = get_evidence_dir(&app_handle)?;
    let mut evidence_files = Vec::new();
    
    let search_dir = if let Some(case_id) = case_id {
        evidence_dir.join(case_id)
    } else {
        evidence_dir
    };
    
    if search_dir.exists() {
        walk_evidence_directory(&search_dir, &mut evidence_files)?;
    }
    
    Ok(evidence_files)
}

fn walk_evidence_directory(dir: &Path, files: &mut Vec<EvidenceFile>) -> Result<(), String> {
    let entries = fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        
        if path.is_dir() {
            // Recursively search subdirectories
            walk_evidence_directory(&path, files)?;
        } else if path.is_file() {
            let metadata = fs::metadata(&path)
                .map_err(|e| format!("Failed to get file metadata: {}", e))?;
            
            let file_name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();
            
            // Extract case ID from path structure
            let case_id = path.parent()
                .and_then(|p| p.file_name())
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();
            
            // Determine evidence type from extension
            let evidence_type = match path.extension().and_then(|ext| ext.to_str()) {
                Some("mp4") | Some("avi") | Some("mov") | Some("mkv") | Some("webm") => "video",
                Some("jpg") | Some("jpeg") | Some("png") | Some("bmp") | Some("tiff") => "image",
                Some("mp3") | Some("wav") | Some("m4a") | Some("flac") => "audio",
                Some("pdf") | Some("txt") | Some("doc") | Some("docx") => "document",
                _ => "unknown"
            };
            
            files.push(EvidenceFile {
                file_path: path.to_string_lossy().to_string(),
                case_id,
                evidence_type: evidence_type.to_string(),
                file_size: metadata.len(),
                upload_date: metadata.created()
                    .map(|t| format!("{:?}", t))
                    .unwrap_or_else(|_| "Unknown".to_string()),
                enhanced_versions: Vec::new(), // TODO: Detect enhanced versions
            });
        }
    }
    
    Ok(())
}

#[command]
pub async fn call_python_nlp_service(
    endpoint: String,
    payload: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let url = format!("http://localhost:8001/{}", endpoint);
    
    let response = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to call NLP service: {}", e))?;
    
    if response.status().is_success() {
        let result = response.json::<serde_json::Value>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        Ok(result)
    } else {
        let error_text = response.text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        Err(format!("NLP service error: {}", error_text))
    }
}

#[command]
pub async fn check_python_service_status() -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    
    match client.get("http://localhost:8001/health").send().await {
        Ok(response) if response.status().is_success() => {
            let result = response.json::<serde_json::Value>()
                .await
                .map_err(|e| format!("Failed to parse health response: {}", e))?;
            Ok(result)
        }
        Ok(_) => {
            Ok(serde_json::json!({
                "status": "error",
                "message": "NLP service returned error status"
            }))
        }
        Err(e) => {
            Ok(serde_json::json!({
                "status": "offline",
                "message": format!("NLP service not reachable: {}", e)
            }))
        }
    }
}

// Register commands
pub fn register_evidence_commands<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("evidence")
        .invoke_handler(tauri::generate_handler![
            process_evidence_file,
            list_evidence_files,
            call_python_nlp_service,
            check_python_service_status
        ])
        .build()
}
