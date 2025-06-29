// Enhanced Tauri Main for Legal-BERT RAG System
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use tauri::State;

// Dependencies for rust-bert (add these to Cargo.toml)
use rust_bert::pipelines::sentence_embeddings::{
    SentenceEmbeddingsBuilder, SentenceEmbeddingsModel,
};
use rust_bert::pipelines::sequence_classification::{
    SequenceClassificationModel, SequenceClassificationBuilder,
};
use rust_bert::pipelines::summarization::{
    SummarizationModel, SummarizationBuilder,
};
use rust_bert::RustBertError;
use tch::Device;

// Model Management Types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalModel {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub model_type: String, // 'embedding', 'chat', 'classification'
    pub domain: String,     // 'general', 'legal', 'medical', 'technical'
    pub architecture: String, // 'bert', 'llama', 'mistral', 'legal-bert'
    pub dimensions: Option<u32>,
    pub max_tokens: Option<u32>,
    pub is_loaded: bool,
    pub memory_usage: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InferenceOptions {
    pub temperature: Option<f64>,
    pub max_tokens: Option<u32>,
    pub top_p: Option<f64>,
    pub top_k: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmbeddingOptions {
    pub batch_size: Option<usize>,
    pub normalize: Option<bool>,
    pub pooling_strategy: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelMetrics {
    pub memory_usage: u64,
    pub inference_time: u64,
    pub tokens_per_second: f64,
    pub accuracy: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentBatch {
    pub id: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessedDocument {
    pub id: String,
    pub embedding: Option<Vec<f32>>,
    pub classification: Option<serde_json::Value>,
    pub summary: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LegalClassification {
    pub category: String,
    pub confidence: f64,
    pub subcategories: Vec<SubCategory>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubCategory {
    pub name: String,
    pub confidence: f64,
}

// Global Model Storage
pub struct ModelManager {
    embedding_models: HashMap<String, Arc<SentenceEmbeddingsModel>>,
    classification_models: HashMap<String, Arc<SequenceClassificationModel>>,
    summarization_models: HashMap<String, Arc<SummarizationModel>>,
    available_models: Vec<LocalModel>,
    loaded_models: HashMap<String, bool>,
}

impl ModelManager {
    pub fn new() -> Self {
        Self {
            embedding_models: HashMap::new(),
            classification_models: HashMap::new(),
            summarization_models: HashMap::new(),
            available_models: Self::initialize_available_models(),
            loaded_models: HashMap::new(),
        }
    }

    fn initialize_available_models() -> Vec<LocalModel> {
        vec![
            LocalModel {
                id: "legal-bert-base-uncased".to_string(),
                name: "Legal-BERT Base Uncased".to_string(),
                model_type: "embedding".to_string(),
                domain: "legal".to_string(),
                architecture: "legal-bert".to_string(),
                dimensions: Some(768),
                max_tokens: Some(512),
                is_loaded: false,
                memory_usage: None,
            },
            LocalModel {
                id: "legal-bert-classification".to_string(),
                name: "Legal-BERT Classification".to_string(),
                model_type: "classification".to_string(),
                domain: "legal".to_string(),
                architecture: "legal-bert".to_string(),
                dimensions: None,
                max_tokens: Some(512),
                is_loaded: false,
                memory_usage: None,
            },
            LocalModel {
                id: "distilbert-summarization".to_string(),
                name: "DistilBERT Summarization".to_string(),
                model_type: "summarization".to_string(),
                domain: "general".to_string(),
                architecture: "bert".to_string(),
                dimensions: None,
                max_tokens: Some(1024),
                is_loaded: false,
                memory_usage: None,
            },
        ]
    }

    pub fn load_embedding_model(&mut self, model_id: &str) -> Result<bool, RustBertError> {
        if self.embedding_models.contains_key(model_id) {
            return Ok(true);
        }

        let model = match model_id {
            "legal-bert-base-uncased" => {
                println!("Loading Legal-BERT embedding model...");
                let model = SentenceEmbeddingsBuilder::remote("nlpaueb/legal-bert-base-uncased")
                    .with_device(Device::Cpu)
                    .create_model()?;
                Arc::new(model)
            }
            _ => {
                println!("Loading default BERT embedding model...");
                let model = SentenceEmbeddingsBuilder::remote("sentence-transformers/all-MiniLM-L6-v2")
                    .with_device(Device::Cpu)
                    .create_model()?;
                Arc::new(model)
            }
        };

        self.embedding_models.insert(model_id.to_string(), model);
        self.loaded_models.insert(model_id.to_string(), true);
        
        // Update available models
        if let Some(available_model) = self.available_models.iter_mut().find(|m| m.id == model_id) {
            available_model.is_loaded = true;
        }

        println!("Successfully loaded embedding model: {}", model_id);
        Ok(true)
    }

    pub fn load_classification_model(&mut self, model_id: &str) -> Result<bool, RustBertError> {
        if self.classification_models.contains_key(model_id) {
            return Ok(true);
        }

        let model = match model_id {
            "legal-bert-classification" => {
                println!("Loading Legal-BERT classification model...");
                let model = SequenceClassificationBuilder::remote("nlpaueb/legal-bert-base-uncased")
                    .with_device(Device::Cpu)
                    .create_model()?;
                Arc::new(model)
            }
            _ => {
                println!("Loading default classification model...");
                let model = SequenceClassificationBuilder::remote("distilbert-base-uncased-finetuned-sst-2-english")
                    .with_device(Device::Cpu)
                    .create_model()?;
                Arc::new(model)
            }
        };

        self.classification_models.insert(model_id.to_string(), model);
        self.loaded_models.insert(model_id.to_string(), true);
        
        // Update available models
        if let Some(available_model) = self.available_models.iter_mut().find(|m| m.id == model_id) {
            available_model.is_loaded = true;
        }

        println!("Successfully loaded classification model: {}", model_id);
        Ok(true)
    }

    pub fn generate_embeddings(&self, model_id: &str, texts: Vec<String>) -> Result<Vec<Vec<f32>>, String> {
        let model = self.embedding_models.get(model_id)
            .ok_or_else(|| format!("Model {} not loaded", model_id))?;

        let text_refs: Vec<&str> = texts.iter().map(|s| s.as_str()).collect();
        let embeddings = model.encode(&text_refs)
            .map_err(|e| format!("Embedding generation failed: {}", e))?;

        Ok(embeddings)
    }

    pub fn classify_text(&self, model_id: &str, text: &str) -> Result<LegalClassification, String> {
        let model = self.classification_models.get(model_id)
            .ok_or_else(|| format!("Classification model {} not loaded", model_id))?;

        let results = model.predict(&[text])
            .map_err(|e| format!("Classification failed: {}", e))?;

        if let Some(result) = results.first() {
            Ok(LegalClassification {
                category: result.text.clone(),
                confidence: result.score,
                subcategories: vec![], // Would need more sophisticated model for subcategories
            })
        } else {
            Err("No classification result".to_string())
        }
    }

    pub fn unload_model(&mut self, model_id: &str) -> bool {
        let mut unloaded = false;
        
        if self.embedding_models.remove(model_id).is_some() {
            unloaded = true;
        }
        if self.classification_models.remove(model_id).is_some() {
            unloaded = true;
        }
        if self.summarization_models.remove(model_id).is_some() {
            unloaded = true;
        }

        if unloaded {
            self.loaded_models.insert(model_id.to_string(), false);
            
            // Update available models
            if let Some(available_model) = self.available_models.iter_mut().find(|m| m.id == model_id) {
                available_model.is_loaded = false;
            }
        }

        unloaded
    }
}

// Global model manager instance
static MODEL_MANAGER: Lazy<Arc<Mutex<ModelManager>>> = Lazy::new(|| {
    Arc::new(Mutex::new(ModelManager::new()))
});

// Tauri Commands
#[tauri::command]
fn list_llm_models() -> Result<Vec<LocalModel>, String> {
    let manager = MODEL_MANAGER.lock().map_err(|e| e.to_string())?;
    Ok(manager.available_models.clone())
}

#[tauri::command]
fn load_model(model_id: String) -> Result<bool, String> {
    let mut manager = MODEL_MANAGER.lock().map_err(|e| e.to_string())?;
    
    // Determine model type and load accordingly
    let model = manager.available_models.iter()
        .find(|m| m.id == model_id)
        .ok_or_else(|| format!("Model {} not found", model_id))?;

    match model.model_type.as_str() {
        "embedding" => {
            manager.load_embedding_model(&model_id)
                .map_err(|e| format!("Failed to load embedding model: {}", e))
        }
        "classification" => {
            manager.load_classification_model(&model_id)
                .map_err(|e| format!("Failed to load classification model: {}", e))
        }
        _ => Err(format!("Unsupported model type: {}", model.model_type))
    }
}

#[tauri::command]
fn unload_model(model_id: String) -> Result<bool, String> {
    let mut manager = MODEL_MANAGER.lock().map_err(|e| e.to_string())?;
    Ok(manager.unload_model(&model_id))
}

#[tauri::command]
fn generate_embedding(
    model_id: String,
    text: Vec<String>,
    options: Option<EmbeddingOptions>,
) -> Result<Vec<Vec<f32>>, String> {
    let manager = MODEL_MANAGER.lock().map_err(|e| e.to_string())?;
    
    let embeddings = manager.generate_embeddings(&model_id, text)?;
    
    // Apply normalization if requested
    if let Some(opts) = options {
        if opts.normalize.unwrap_or(true) {
            return Ok(embeddings.into_iter()
                .map(|embedding| normalize_vector(embedding))
                .collect());
        }
    }
    
    Ok(embeddings)
}

#[tauri::command]
fn classify_legal_document(model_id: String, text: String) -> Result<LegalClassification, String> {
    let manager = MODEL_MANAGER.lock().map_err(|e| e.to_string())?;
    manager.classify_text(&model_id, &text)
}

#[tauri::command]
fn calculate_cosine_similarity(vector1: Vec<f32>, vector2: Vec<f32>) -> Result<f64, String> {
    if vector1.len() != vector2.len() {
        return Err("Vectors must have the same length".to_string());
    }

    let dot_product: f32 = vector1.iter().zip(vector2.iter()).map(|(a, b)| a * b).sum();
    let magnitude1: f32 = vector1.iter().map(|x| x * x).sum::<f32>().sqrt();
    let magnitude2: f32 = vector2.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if magnitude1 == 0.0 || magnitude2 == 0.0 {
        return Ok(0.0);
    }
    
    Ok((dot_product / (magnitude1 * magnitude2)) as f64)
}

#[tauri::command]
fn batch_process_documents(
    documents: Vec<DocumentBatch>,
    operations: Vec<String>,
    embedding_model_id: Option<String>,
    chat_model_id: Option<String>,
) -> Result<Vec<ProcessedDocument>, String> {
    let manager = MODEL_MANAGER.lock().map_err(|e| e.to_string())?;
    let mut results = Vec::new();

    for doc in documents {
        let mut processed = ProcessedDocument {
            id: doc.id.clone(),
            embedding: None,
            classification: None,
            summary: None,
            error: None,
        };

        // Generate embedding if requested
        if operations.contains(&"embed".to_string()) {
            if let Some(ref model_id) = embedding_model_id {
                match manager.generate_embeddings(model_id, vec![doc.text.clone()]) {
                    Ok(mut embeddings) => {
                        if let Some(embedding) = embeddings.pop() {
                            processed.embedding = Some(embedding);
                        }
                    }
                    Err(e) => {
                        processed.error = Some(format!("Embedding failed: {}", e));
                    }
                }
            }
        }

        // Classify if requested
        if operations.contains(&"classify".to_string()) {
            if let Some(ref model_id) = embedding_model_id {
                match manager.classify_text(model_id, &doc.text) {
                    Ok(classification) => {
                        processed.classification = Some(serde_json::to_value(classification).unwrap());
                    }
                    Err(e) => {
                        processed.error = Some(format!("Classification failed: {}", e));
                    }
                }
            }
        }

        results.push(processed);
    }

    Ok(results)
}

#[tauri::command]
fn get_model_metrics(model_id: String) -> Result<ModelMetrics, String> {
    // In a real implementation, you'd track actual metrics
    Ok(ModelMetrics {
        memory_usage: 500 * 1024 * 1024, // 500MB placeholder
        inference_time: 150, // 150ms placeholder
        tokens_per_second: 45.0,
        accuracy: Some(0.89),
    })
}

// Utility functions
fn normalize_vector(vector: Vec<f32>) -> Vec<f32> {
    let magnitude: f32 = vector.iter().map(|x| x * x).sum::<f32>().sqrt();
    if magnitude > 0.0 {
        vector.into_iter().map(|x| x / magnitude).collect()
    } else {
        vector
    }
}

// Legacy compatibility functions
#[tauri::command]
fn run_llm_inference(model: String, prompt: String) -> Result<String, String> {
    // This would integrate with a chat model for completion
    // For now, return a placeholder
    Ok(format!("Response to '{}' using model '{}'", prompt, model))
}

fn main() {
    // Pre-load models in background thread to improve startup performance
    std::thread::spawn(|| {
        println!("Pre-loading essential models...");
        if let Ok(mut manager) = MODEL_MANAGER.lock() {
            // Load legal-bert embedding model by default
            if let Err(e) = manager.load_embedding_model("legal-bert-base-uncased") {
                println!("Failed to pre-load legal-bert: {}", e);
                // Fallback to general model
                if let Err(e2) = manager.load_embedding_model("sentence-transformers/all-MiniLM-L6-v2") {
                    println!("Failed to load fallback model: {}", e2);
                }
            }
        }
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_llm_models,
            load_model,
            unload_model,
            generate_embedding,
            classify_legal_document,
            calculate_cosine_similarity,
            batch_process_documents,
            get_model_metrics,
            run_llm_inference
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
