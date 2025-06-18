use anyhow::{anyhow, Result};
use image::ImageFormat;
use std::path::Path;
use tracing::{debug, error, info, warn};

#[derive(Debug, Clone)]
pub struct ProcessedFile {
    pub file_path: String,
    pub original_name: String,
    pub file_type: FileType,
    pub extracted_text: String,
    pub metadata: FileMetadata,
}

#[derive(Debug, Clone)]
pub struct FileMetadata {
    pub size_bytes: u64,
    pub mime_type: String,
    pub duration_seconds: Option<f64>, // For video/audio files
    pub width: Option<u32>,           // For images/videos
    pub height: Option<u32>,          // For images/videos
    pub page_count: Option<u32>,      // For PDFs
}

#[derive(Debug, Clone, PartialEq)]
pub enum FileType {
    Pdf,
    Text,
    Word,
    Image,
    Video,
    Audio,
    Unknown,
}

impl FileType {
    pub fn from_extension(extension: &str) -> Self {
        match extension.to_lowercase().as_str() {
            "pdf" => Self::Pdf,
            "txt" | "md" | "log" => Self::Text,
            "doc" | "docx" | "rtf" => Self::Word,
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "tiff" => Self::Image,
            "mp4" | "avi" | "mov" | "wmv" | "flv" | "mkv" => Self::Video,
            "mp3" | "wav" | "aac" | "flac" | "ogg" => Self::Audio,
            _ => Self::Unknown,
        }
    }
}

#[derive(Clone)]
pub struct FileProcessor {
    upload_dir: String,
    enable_ocr: bool,
    enable_text_extraction: bool,
    max_file_size: usize,
}

impl FileProcessor {
    pub fn new(upload_dir: String, enable_ocr: bool, enable_text_extraction: bool, max_file_size: usize) -> Self {
        Self {
            upload_dir,
            enable_ocr,
            enable_text_extraction,
            max_file_size,
        }
    }

    pub async fn process_file(&self, file_path: &str, original_name: &str) -> Result<ProcessedFile> {
        info!("Processing file: {} -> {}", original_name, file_path);

        let path = Path::new(file_path);
        let extension = path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");

        let file_type = FileType::from_extension(extension);
        let metadata = self.extract_metadata(file_path, &file_type).await?;

        // Check file size
        if metadata.size_bytes > self.max_file_size as u64 {
            return Err(anyhow!("File too large: {} bytes (max: {})", metadata.size_bytes, self.max_file_size));
        }

        let extracted_text = if self.enable_text_extraction {
            self.extract_text(file_path, &file_type).await?
        } else {
            String::new()
        };

        Ok(ProcessedFile {
            file_path: file_path.to_string(),
            original_name: original_name.to_string(),
            file_type,
            extracted_text,
            metadata,
        })
    }

    async fn extract_metadata(&self, file_path: &str, file_type: &FileType) -> Result<FileMetadata> {
        let metadata = std::fs::metadata(file_path)?;
        let size_bytes = metadata.len();

        let mime_type = match file_type {
            FileType::Pdf => "application/pdf".to_string(),
            FileType::Text => "text/plain".to_string(),
            FileType::Word => "application/vnd.openxmlformats-officedocument.wordprocessingml.document".to_string(),
            FileType::Image => self.detect_image_mime_type(file_path)?,
            FileType::Video => "video/mp4".to_string(),
            FileType::Audio => "audio/mpeg".to_string(),
            FileType::Unknown => "application/octet-stream".to_string(),
        };

        let mut file_metadata = FileMetadata {
            size_bytes,
            mime_type,
            duration_seconds: None,
            width: None,
            height: None,
            page_count: None,
        };

        // Extract type-specific metadata
        match file_type {
            FileType::Image => {
                if let Ok((width, height)) = self.get_image_dimensions(file_path) {
                    file_metadata.width = Some(width);
                    file_metadata.height = Some(height);
                }
            }
            FileType::Pdf => {
                file_metadata.page_count = Some(self.get_pdf_page_count(file_path)?);
            }
            FileType::Video | FileType::Audio => {
                file_metadata.duration_seconds = self.get_media_duration(file_path).ok();
                if matches!(file_type, FileType::Video) {
                    if let Ok((width, height)) = self.get_video_dimensions(file_path) {
                        file_metadata.width = Some(width);
                        file_metadata.height = Some(height);
                    }
                }
            }
            _ => {}
        }

        Ok(file_metadata)
    }

    async fn extract_text(&self, file_path: &str, file_type: &FileType) -> Result<String> {
        debug!("Extracting text from {:?} file: {}", file_type, file_path);

        match file_type {
            FileType::Text => self.extract_text_from_txt(file_path),
            FileType::Pdf => self.extract_text_from_pdf(file_path),
            FileType::Word => self.extract_text_from_word(file_path),
            FileType::Image => {
                if self.enable_ocr {
                    self.extract_text_from_image_ocr(file_path).await
                } else {
                    Ok(String::new())
                }
            }
            FileType::Video => {
                if self.enable_ocr {
                    self.extract_text_from_video(file_path).await
                } else {
                    Ok(String::new())
                }
            }
            FileType::Audio => self.extract_text_from_audio(file_path).await,
            FileType::Unknown => Ok(String::new()),
        }
    }

    fn extract_text_from_txt(&self, file_path: &str) -> Result<String> {
        std::fs::read_to_string(file_path)
            .map_err(|e| anyhow!("Failed to read text file: {}", e))
    }

    fn extract_text_from_pdf(&self, file_path: &str) -> Result<String> {
        // Using pdf-extract crate
        match pdf_extract::extract_text(file_path) {
            Ok(text) => {
                debug!("Extracted {} characters from PDF", text.len());
                Ok(text)
            }
            Err(e) => {
                warn!("PDF text extraction failed: {}", e);
                Ok(String::new())
            }
        }
    }

    fn extract_text_from_word(&self, file_path: &str) -> Result<String> {
        // Placeholder for Word document processing
        // You could use a crate like `docx-rs` or call external tools
        warn!("Word document text extraction not implemented yet");
        Ok(format!("Word document: {}", Path::new(file_path).file_name().unwrap().to_string_lossy()))
    }

    async fn extract_text_from_image_ocr(&self, file_path: &str) -> Result<String> {
        // Placeholder for OCR processing
        // You could use tesseract-rs or call external OCR tools
        warn!("OCR text extraction not implemented yet");
        Ok(format!("Image file: {}", Path::new(file_path).file_name().unwrap().to_string_lossy()))
    }

    async fn extract_text_from_video(&self, file_path: &str) -> Result<String> {
        // Placeholder for video frame extraction + OCR
        warn!("Video text extraction not implemented yet");
        Ok(format!("Video file: {}", Path::new(file_path).file_name().unwrap().to_string_lossy()))
    }

    async fn extract_text_from_audio(&self, file_path: &str) -> Result<String> {
        // Placeholder for speech-to-text
        warn!("Audio transcription not implemented yet");
        Ok(format!("Audio file: {}", Path::new(file_path).file_name().unwrap().to_string_lossy()))
    }

    fn detect_image_mime_type(&self, file_path: &str) -> Result<String> {
        let extension = Path::new(file_path)
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        let mime_type = match extension.as_str() {
            "jpg" | "jpeg" => "image/jpeg",
            "png" => "image/png",
            "gif" => "image/gif",
            "bmp" => "image/bmp",
            "tiff" | "tif" => "image/tiff",
            _ => "image/jpeg", // default
        };

        Ok(mime_type.to_string())
    }

    fn get_image_dimensions(&self, file_path: &str) -> Result<(u32, u32)> {
        let img = image::open(file_path)?;
        Ok((img.width(), img.height()))
    }

    fn get_pdf_page_count(&self, _file_path: &str) -> Result<u32> {
        // Placeholder - implement with a PDF library
        warn!("PDF page count extraction not implemented yet");
        Ok(1)
    }

    fn get_media_duration(&self, _file_path: &str) -> Result<f64> {
        // Placeholder for ffmpeg integration
        warn!("Media duration extraction not implemented yet");
        Ok(0.0)
    }

    fn get_video_dimensions(&self, _file_path: &str) -> Result<(u32, u32)> {
        // Placeholder for ffmpeg integration
        warn!("Video dimension extraction not implemented yet");
        Ok((1920, 1080))
    }

    pub fn get_supported_formats(&self) -> Vec<String> {
        vec![
            "pdf".to_string(),
            "txt".to_string(),
            "doc".to_string(),
            "docx".to_string(),
            "jpg".to_string(),
            "jpeg".to_string(),
            "png".to_string(),
            "gif".to_string(),
            "bmp".to_string(),
            "mp4".to_string(),
            "avi".to_string(),
            "mov".to_string(),
            "mp3".to_string(),
            "wav".to_string(),
        ]
    }

    pub async fn cleanup_temp_files(&self, older_than_hours: u64) -> Result<usize> {
        let temp_dir = format!("{}/temp", self.upload_dir);
        let mut cleaned_count = 0;

        if let Ok(entries) = std::fs::read_dir(&temp_dir) {
            let cutoff_time = std::time::SystemTime::now() - std::time::Duration::from_secs(older_than_hours * 3600);

            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        if modified < cutoff_time {
                            if std::fs::remove_file(entry.path()).is_ok() {
                                cleaned_count += 1;
                            }
                        }
                    }
                }
            }
        }

        info!("Cleaned up {} temporary files", cleaned_count);
        Ok(cleaned_count)
    }
}
