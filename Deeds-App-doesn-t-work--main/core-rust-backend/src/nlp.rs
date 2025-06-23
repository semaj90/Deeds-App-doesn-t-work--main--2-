// Python NLP integration module for prosecutor-core
// Handles communication with Python NLP libraries via PyO3

#[cfg(feature = "ai-features")]
use pyo3::prelude::*;
#[cfg(feature = "ai-features")]
use pyo3::types::PyDict;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use anyhow::Result;

// NLP analysis results
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NlpAnalysis {
    pub entities: Vec<NamedEntity>,
    pub sentiment: SentimentScore,
    pub keywords: Vec<Keyword>,
    pub summary: Option<String>,
    pub language: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NamedEntity {
    pub text: String,
    pub label: String,
    pub start: usize,
    pub end: usize,
    pub confidence: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SentimentScore {
    pub polarity: f32,    // -1.0 to 1.0
    pub subjectivity: f32, // 0.0 to 1.0
    pub label: String,    // "positive", "negative", "neutral"
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Keyword {
    pub text: String,
    pub score: f32,
    pub frequency: u32,
}

// Text embedding for similarity search
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TextEmbedding {
    pub text: String,
    pub embedding: Vec<f32>,
    pub model: String,
    pub dimensions: usize,
}

// NLP service configuration
#[derive(Debug, Clone)]
pub struct NlpConfig {
    pub spacy_model: String,
    pub embedding_model: String,
    pub max_text_length: usize,
    pub use_gpu: bool,
}

impl Default for NlpConfig {
    fn default() -> Self {
        Self {
            spacy_model: "en_core_web_sm".to_string(),
            embedding_model: "sentence-transformers/all-MiniLM-L6-v2".to_string(),
            max_text_length: 10000,
            use_gpu: false, // Default to CPU for compatibility
        }
    }
}

// Main NLP service
pub struct NlpService {
    config: NlpConfig,
    #[cfg(feature = "ai-features")]
    python_instance: Option<Python>,
}

impl NlpService {
    pub fn new(config: NlpConfig) -> Result<Self> {
        Ok(Self {
            config,
            #[cfg(feature = "ai-features")]
            python_instance: None,
        })
    }

    // Initialize Python environment
    #[cfg(feature = "ai-features")]
    pub fn initialize_python(&mut self) -> Result<()> {
        pyo3::prepare_freethreaded_python();
        self.python_instance = Some(Python::acquire_gil().python().clone());
        
        // Install required packages if needed
        self.ensure_python_dependencies()?;
        
        Ok(())
    }

    #[cfg(not(feature = "ai-features"))]
    pub fn initialize_python(&mut self) -> Result<()> {
        tracing::warn!("AI features not enabled, Python NLP will not be available");
        Ok(())
    }

    // Ensure required Python packages are installed
    #[cfg(feature = "ai-features")]
    fn ensure_python_dependencies(&self) -> Result<()> {
        // This would run pip install commands or check for package availability
        // For now, assume packages are installed
        Ok(())
    }

    // Analyze text using Python NLP libraries
    #[cfg(feature = "ai-features")]
    pub fn analyze_text(&self, text: &str) -> Result<NlpAnalysis> {
        if text.len() > self.config.max_text_length {
            return Err(anyhow::anyhow!("Text too long for analysis"));
        }

        Python::with_gil(|py| {
            // Import required Python modules
            let spacy = py.import("spacy")?;
            let textblob = py.import("textblob")?;
            
            // Load spaCy model
            let nlp = spacy.call_method1("load", (&self.config.spacy_model,))?;
            
            // Process text with spaCy
            let doc = nlp.call_method1("__call__", (text,))?;
            
            // Extract named entities
            let entities = self.extract_entities(py, &doc)?;
            
            // Analyze sentiment with TextBlob
            let blob = textblob.call_method1("TextBlob", (text,))?;
            let sentiment = self.extract_sentiment(py, &blob)?;
            
            // Extract keywords (simple frequency-based)
            let keywords = self.extract_keywords(text)?;
            
            Ok(NlpAnalysis {
                entities,
                sentiment,
                keywords,
                summary: None, // TODO: Implement summarization
                language: Some("en".to_string()),
            })
        })
    }

    #[cfg(not(feature = "ai-features"))]
    pub fn analyze_text(&self, text: &str) -> Result<NlpAnalysis> {
        // Fallback implementation without Python
        Ok(NlpAnalysis {
            entities: vec![],
            sentiment: SentimentScore {
                polarity: 0.0,
                subjectivity: 0.0,
                label: "neutral".to_string(),
            },
            keywords: self.extract_keywords_simple(text)?,
            summary: None,
            language: Some("en".to_string()),
        })
    }

    // Generate text embeddings
    #[cfg(feature = "ai-features")]
    pub fn generate_embedding(&self, text: &str) -> Result<TextEmbedding> {
        Python::with_gil(|py| {
            let sentence_transformers = py.import("sentence_transformers")?;
            let model = sentence_transformers.call_method1("SentenceTransformer", (&self.config.embedding_model,))?;
            
            let embedding_result = model.call_method1("encode", (text,))?;
            let embedding: Vec<f32> = embedding_result.extract()?;
            
            Ok(TextEmbedding {
                text: text.to_string(),
                embedding: embedding.clone(),
                model: self.config.embedding_model.clone(),
                dimensions: embedding.len(),
            })
        })
    }

    #[cfg(not(feature = "ai-features"))]
    pub fn generate_embedding(&self, text: &str) -> Result<TextEmbedding> {
        // Simple fallback: hash-based pseudo-embedding
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(text.as_bytes());
        let hash = hasher.finalize();
        
        // Convert hash to normalized float vector
        let embedding: Vec<f32> = hash.iter()
            .map(|&b| (b as f32 - 128.0) / 128.0)
            .collect();
        
        Ok(TextEmbedding {
            text: text.to_string(),
            embedding,
            model: "hash-based".to_string(),
            dimensions: 32,
        })
    }

    // Helper methods
    #[cfg(feature = "ai-features")]
    fn extract_entities(&self, py: Python, doc: &PyAny) -> Result<Vec<NamedEntity>> {
        let ents = doc.getattr("ents")?;
        let mut entities = Vec::new();
        
        for ent in ents.iter()? {
            let text: String = ent.getattr("text")?.extract()?;
            let label: String = ent.getattr("label_")?.extract()?;
            let start: usize = ent.getattr("start_char")?.extract()?;
            let end: usize = ent.getattr("end_char")?.extract()?;
            
            entities.push(NamedEntity {
                text,
                label,
                start,
                end,
                confidence: 0.9, // spaCy doesn't provide confidence by default
            });
        }
        
        Ok(entities)
    }

    #[cfg(feature = "ai-features")]
    fn extract_sentiment(&self, py: Python, blob: &PyAny) -> Result<SentimentScore> {
        let sentiment = blob.getattr("sentiment")?;
        let polarity: f32 = sentiment.getattr("polarity")?.extract()?;
        let subjectivity: f32 = sentiment.getattr("subjectivity")?.extract()?;
        
        let label = if polarity > 0.1 {
            "positive"
        } else if polarity < -0.1 {
            "negative"
        } else {
            "neutral"
        };
        
        Ok(SentimentScore {
            polarity,
            subjectivity,
            label: label.to_string(),
        })
    }

    fn extract_keywords(&self, text: &str) -> Result<Vec<Keyword>> {
        // Simple keyword extraction based on word frequency
        self.extract_keywords_simple(text)
    }

    fn extract_keywords_simple(&self, text: &str) -> Result<Vec<Keyword>> {
        let mut word_count: HashMap<String, u32> = HashMap::new();
        let words: Vec<&str> = text
            .to_lowercase()
            .split_whitespace()
            .filter(|word| word.len() > 3) // Filter short words
            .collect();
        
        for word in words {
            *word_count.entry(word.to_string()).or_insert(0) += 1;
        }
        
        let mut keywords: Vec<Keyword> = word_count
            .into_iter()
            .map(|(text, frequency)| Keyword {
                score: frequency as f32,
                text,
                frequency,
            })
            .collect();
        
        keywords.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        keywords.truncate(10); // Top 10 keywords
        
        Ok(keywords)
    }
}

// Similarity search functions
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }
    
    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        return 0.0;
    }
    
    dot_product / (norm_a * norm_b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 2.0, 3.0];
        let b = vec![4.0, 5.0, 6.0];
        let similarity = cosine_similarity(&a, &b);
        assert!(similarity > 0.9); // Should be high similarity
    }

    #[test]
    fn test_nlp_service_creation() {
        let config = NlpConfig::default();
        let service = NlpService::new(config);
        assert!(service.is_ok());
    }

    #[test]
    fn test_keyword_extraction() {
        let config = NlpConfig::default();
        let service = NlpService::new(config).unwrap();
        let text = "This is a test document with several important keywords and phrases";
        let keywords = service.extract_keywords_simple(text).unwrap();
        assert!(!keywords.is_empty());
    }
}
