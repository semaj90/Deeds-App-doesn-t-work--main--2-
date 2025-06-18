use anyhow::{anyhow, Result};
use qdrant_client::{
    prelude::*,
    qdrant::{
        vectors_config::Config, CreateCollection, Distance, PointStruct, SearchPoints,
        VectorParams, VectorsConfig, Filter, Condition, FieldCondition, Match, Value as QdrantValue,
    },
    Qdrant,
};
use serde_json::Value;
use std::collections::HashMap;
use tracing::{debug, error, info, warn};
use uuid::Uuid;
use sqlx::PgPool;
use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};

use crate::{
    llm::LLMService,
    file_processor::{ProcessedFile, FileType},
    models::{Evidence, Case},
};

const COLLECTION_NAME: &str = "prosecutor_evidence";
const VECTOR_DIMENSION: u64 = 384; // All-MiniLM-L6-v2 embedding dimension

#[derive(Clone)]
pub struct QdrantService {
    client: Qdrant,
    embedding_model: Option<TextEmbedding>,
    llm_service: LLMService,
    collection_initialized: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SearchResult {
    pub evidence_id: Uuid,
    pub case_id: Option<Uuid>,
    pub score: f32,
    pub snippet: String,
    pub tags: Vec<String>,
    pub file_type: String,
    pub metadata: HashMap<String, Value>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct SearchQuery {
    pub query_text: String,
    pub case_id: Option<Uuid>,
    pub file_types: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub limit: Option<usize>,
    pub min_score: Option<f32>,
}

impl QdrantService {
    pub async fn new(qdrant_url: &str, llm_service: LLMService) -> Result<Self> {
        info!("Connecting to Qdrant at: {}", qdrant_url);
        
        let client = Qdrant::from_url(qdrant_url).build()?;
        
        // Initialize embedding model
        let embedding_model = match TextEmbedding::try_new(InitOptions {
            model_name: EmbeddingModel::AllMiniLML6V2,
            show_download_progress: true,
            ..Default::default()
        }) {
            Ok(model) => {
                info!("Embedding model loaded successfully");
                Some(model)
            }
            Err(e) => {
                warn!("Failed to load embedding model: {}", e);
                None
            }
        };

        let mut service = Self {
            client,
            embedding_model,
            llm_service,
            collection_initialized: false,
        };

        // Initialize collection
        service.ensure_collection_exists().await?;
        
        Ok(service)
    }

    async fn ensure_collection_exists(&mut self) -> Result<()> {
        if self.collection_initialized {
            return Ok(());
        }

        let collections = self.client.list_collections().await?;
        let collection_exists = collections
            .collections
            .iter()
            .any(|c| c.name == COLLECTION_NAME);

        if !collection_exists {
            info!("Creating Qdrant collection: {}", COLLECTION_NAME);
            
            let collection_config = CreateCollection {
                collection_name: COLLECTION_NAME.to_string(),
                vectors_config: Some(VectorsConfig {
                    config: Some(Config::Params(VectorParams {
                        size: VECTOR_DIMENSION,
                        distance: Distance::Cosine.into(),
                        ..Default::default()
                    })),
                }),
                ..Default::default()
            };

            self.client.create_collection(&collection_config).await?;
            info!("Collection created successfully");
        } else {
            info!("Collection already exists: {}", COLLECTION_NAME);
        }

        self.collection_initialized = true;
        Ok(())
    }

    pub async fn index_evidence(&self, 
        evidence: &Evidence, 
        processed_file: &ProcessedFile,
        db_pool: &PgPool
    ) -> Result<()> {
        debug!("Indexing evidence: {} - {}", evidence.id, processed_file.original_name);

        // Generate embeddings
        let embedding = self.generate_embedding(&processed_file.extracted_text).await?;
        
        // Generate AI tags
        let ai_tags = if self.llm_service.is_available().await {
            self.llm_service.process_for_tags(&processed_file.extracted_text).await?
        } else {
            vec![]
        };

        // Generate summary
        let ai_summary = if self.llm_service.is_available().await {
            self.llm_service.process_for_summary(&processed_file.extracted_text).await?
        } else {
            processed_file.extracted_text.chars().take(200).collect::<String>()
        };

        // Prepare metadata
        let mut metadata = HashMap::new();
        metadata.insert("case_id".to_string(), evidence.case_id.map(|id| Value::String(id.to_string())).unwrap_or(Value::Null));
        metadata.insert("file_name".to_string(), Value::String(processed_file.original_name.clone()));
        metadata.insert("file_type".to_string(), Value::String(format!("{:?}", processed_file.file_type)));
        metadata.insert("upload_date".to_string(), Value::String(evidence.uploaded_at.to_rfc3339()));
        metadata.insert("file_size".to_string(), Value::Number(processed_file.metadata.size_bytes.into()));
        metadata.insert("mime_type".to_string(), Value::String(processed_file.metadata.mime_type.clone()));
        metadata.insert("ai_summary".to_string(), Value::String(ai_summary.clone()));
        
        // Add AI tags to metadata
        if !ai_tags.is_empty() {
            metadata.insert("ai_tags".to_string(), Value::Array(
                ai_tags.iter().map(|tag| Value::String(tag.clone())).collect()
            ));
        }

        // Create point for Qdrant
        let point = PointStruct::new(
            evidence.id.to_string(),
            embedding,
            metadata.clone()
        );

        // Index in Qdrant
        self.client
            .upsert_points_blocking(COLLECTION_NAME, None, vec![point], None)
            .await?;

        // Update database with AI-generated tags and summary
        self.update_evidence_ai_data(evidence.id, &ai_tags, &ai_summary, db_pool).await?;

        info!("Successfully indexed evidence: {}", evidence.id);
        Ok(())
    }

    async fn update_evidence_ai_data(&self, 
        evidence_id: Uuid, 
        ai_tags: &[String], 
        ai_summary: &str,
        db_pool: &PgPool
    ) -> Result<()> {
        let tags_json = serde_json::to_value(ai_tags)?;
        
        sqlx::query!(
            r#"
            UPDATE evidence 
            SET 
                ai_tags = $2,
                ai_summary = $3,
                updated_at = NOW()
            WHERE id = $1
            "#,
            evidence_id,
            tags_json,
            ai_summary
        )
        .execute(db_pool)
        .await?;

        debug!("Updated evidence {} with AI data", evidence_id);
        Ok(())
    }

    async fn generate_embedding(&self, text: &str) -> Result<Vec<f32>> {
        if let Some(model) = &self.embedding_model {
            let embeddings = model.embed(vec![text], None)?;
            if let Some(embedding) = embeddings.first() {
                Ok(embedding.clone())
            } else {
                Err(anyhow!("Failed to generate embedding"))
            }
        } else {
            // Fallback: create a dummy embedding (replace with actual embedding service)
            warn!("No embedding model available, using dummy embedding");
            Ok(vec![0.0; VECTOR_DIMENSION as usize])
        }
    }

    pub async fn search(&self, query: SearchQuery) -> Result<Vec<SearchResult>> {
        debug!("Searching with query: {}", query.query_text);

        // Generate query embedding
        let query_embedding = self.generate_embedding(&query.query_text).await?;

        // Build filter
        let mut conditions = vec![];

        if let Some(case_id) = query.case_id {
            conditions.push(Condition {
                condition_one_of: Some(qdrant_client::qdrant::condition::ConditionOneOf::Field(
                    FieldCondition {
                        key: "case_id".to_string(),
                        match_: Some(Match {
                            match_value: Some(qdrant_client::qdrant::r#match::MatchValue::Keyword(
                                case_id.to_string()
                            )),
                        }),
                        ..Default::default()
                    }
                )),
            });
        }

        if let Some(file_types) = &query.file_types {
            for file_type in file_types {
                conditions.push(Condition {
                    condition_one_of: Some(qdrant_client::qdrant::condition::ConditionOneOf::Field(
                        FieldCondition {
                            key: "file_type".to_string(),
                            match_: Some(Match {
                                match_value: Some(qdrant_client::qdrant::r#match::MatchValue::Keyword(
                                    file_type.clone()
                                )),
                            }),
                            ..Default::default()
                        }
                    )),
                });
            }
        }

        let filter = if conditions.is_empty() {
            None
        } else {
            Some(Filter {
                should: conditions,
                ..Default::default()
            })
        };

        // Perform search
        let search_request = SearchPoints {
            collection_name: COLLECTION_NAME.to_string(),
            vector: query_embedding,
            limit: query.limit.unwrap_or(10) as u64,
            score_threshold: query.min_score,
            filter,
            with_payload: Some(true.into()),
            ..Default::default()
        };

        let search_result = self.client.search_points(&search_request).await?;

        // Convert results
        let mut results = Vec::new();
        for point in search_result.result {
            if let Ok(result) = self.convert_search_result(point).await {
                results.push(result);
            }
        }

        info!("Found {} search results", results.len());
        Ok(results)
    }

    async fn convert_search_result(&self, point: qdrant_client::qdrant::ScoredPoint) -> Result<SearchResult> {
        let payload = point.payload;
        
        let evidence_id = Uuid::parse_str(&point.id.unwrap().point_id_options.unwrap().to_string())?;
        
        let case_id = payload.get("case_id")
            .and_then(|v| v.as_str())
            .and_then(|s| Uuid::parse_str(s).ok());

        let file_name = payload.get("file_name")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown")
            .to_string();

        let file_type = payload.get("file_type")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown")
            .to_string();

        let ai_summary = payload.get("ai_summary")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let ai_tags = payload.get("ai_tags")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter()
                .filter_map(|v| v.as_str())
                .map(|s| s.to_string())
                .collect())
            .unwrap_or_default();

        // Create snippet from summary or filename
        let snippet = if !ai_summary.is_empty() {
            ai_summary.chars().take(150).collect::<String>()
        } else {
            format!("File: {}", file_name)
        };

        let mut metadata = HashMap::new();
        for (key, value) in payload {
            metadata.insert(key, serde_json::from_str(&value.to_string()).unwrap_or(Value::Null));
        }

        Ok(SearchResult {
            evidence_id,
            case_id,
            score: point.score,
            snippet,
            tags: ai_tags,
            file_type,
            metadata,
        })
    }

    pub async fn delete_evidence(&self, evidence_id: Uuid) -> Result<()> {
        debug!("Deleting evidence from index: {}", evidence_id);

        self.client
            .delete_points(
                COLLECTION_NAME,
                None,
                &[evidence_id.to_string().into()],
                None,
            )
            .await?;

        info!("Deleted evidence from index: {}", evidence_id);
        Ok(())
    }

    pub async fn reindex_case(&self, case_id: Uuid, db_pool: &PgPool) -> Result<usize> {
        info!("Reindexing all evidence for case: {}", case_id);

        let evidence_list = sqlx::query_as!(
            Evidence,
            "SELECT * FROM evidence WHERE case_id = $1",
            case_id
        )
        .fetch_all(db_pool)
        .await?;

        let mut indexed_count = 0;
        for evidence in evidence_list {
            // This would need the processed file data - you might want to store this in the DB
            // or reprocess the files during reindexing
            warn!("Reindexing requires file reprocessing - not implemented yet");
            indexed_count += 1;
        }

        info!("Reindexed {} evidence items for case {}", indexed_count, case_id);
        Ok(indexed_count)
    }

    pub async fn get_similar_evidence(&self, evidence_id: Uuid, limit: usize) -> Result<Vec<SearchResult>> {
        debug!("Finding similar evidence to: {}", evidence_id);

        // Get the vector for the given evidence
        let points = self.client
            .get_points(COLLECTION_NAME, None, &[evidence_id.to_string().into()], Some(true), Some(true))
            .await?;

        if let Some(point) = points.result.first() {
            if let Some(vector) = &point.vectors {
                // Extract the vector data
                let query_vector = match vector {
                    qdrant_client::qdrant::vectors::VectorsOptions::Vector(v) => v.data.clone(),
                    _ => return Err(anyhow!("Unexpected vector format")),
                };

                // Search for similar vectors
                let search_request = SearchPoints {
                    collection_name: COLLECTION_NAME.to_string(),
                    vector: query_vector,
                    limit: limit as u64 + 1, // +1 to exclude the original
                    filter: None,
                    with_payload: Some(true.into()),
                    ..Default::default()
                };

                let search_result = self.client.search_points(&search_request).await?;

                // Convert results and exclude the original evidence
                let mut results = Vec::new();
                for point in search_result.result {
                    let point_id = point.id.as_ref()
                        .and_then(|id| id.point_id_options.as_ref())
                        .map(|id| id.to_string());

                    if point_id.as_ref() != Some(&evidence_id.to_string()) {
                        if let Ok(result) = self.convert_search_result(point).await {
                            results.push(result);
                        }
                    }
                }

                results.truncate(limit);
                return Ok(results);
            }
        }

        Ok(vec![])
    }

    pub async fn get_collection_stats(&self) -> Result<HashMap<String, serde_json::Value>> {
        let info = self.client.collection_info(COLLECTION_NAME).await?;
        
        let mut stats = HashMap::new();
        stats.insert("collection_name".to_string(), serde_json::Value::String(COLLECTION_NAME.to_string()));
        
        if let Some(result) = info.result {
            stats.insert("points_count".to_string(), serde_json::Value::Number(result.points_count.unwrap_or(0).into()));
            stats.insert("segments_count".to_string(), serde_json::Value::Number(result.segments_count.into()));
            stats.insert("vectors_count".to_string(), serde_json::Value::Number(result.vectors_count.unwrap_or(0).into()));
        }

        Ok(stats)
    }
}
