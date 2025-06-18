use anyhow::Result;
use qdrant_client::{
    prelude::*,
    qdrant::{
        vectors::VectorsOptions, CreateCollection, SearchPoints, UpsertPoints, VectorParams,
        VectorsConfig, Distance, CollectionOperationResponse, SearchResponse,
    },
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct QdrantClient {
    client: qdrant_client::client::QdrantClient,
    collection_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EvidenceVector {
    pub evidence_id: i32,
    pub case_id: Option<i32>,
    pub title: String,
    pub description: Option<String>,
    pub evidence_type: String,
    pub tags: Vec<String>,
    pub embedding: Vec<f32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub evidence_id: i32,
    pub score: f32,
    pub metadata: HashMap<String, String>,
}

impl QdrantClient {
    pub async fn new(url: &str, collection_name: &str) -> Result<Self> {
        let client = qdrant_client::client::QdrantClient::from_url(url).build()?;
        
        let qdrant_client = Self {
            client,
            collection_name: collection_name.to_string(),
        };

        // Initialize collection if it doesn't exist
        qdrant_client.ensure_collection_exists().await?;

        Ok(qdrant_client)
    }

    async fn ensure_collection_exists(&self) -> Result<()> {
        // Check if collection exists
        let collections = self.client.list_collections().await?;
        
        let collection_exists = collections
            .collections
            .iter()
            .any(|c| c.name == self.collection_name);

        if !collection_exists {
            tracing::info!("🔍 Creating Qdrant collection: {}", self.collection_name);
            
            // Create collection with 1536 dimensions (OpenAI ada-002 embedding size)
            let create_collection = CreateCollection {
                collection_name: self.collection_name.clone(),
                vectors_config: Some(VectorsConfig {
                    config: Some(qdrant_client::qdrant::vectors_config::Config::Params(
                        VectorParams {
                            size: 1536, // OpenAI ada-002 embedding dimensions
                            distance: Distance::Cosine.into(),
                            hnsw_config: None,
                            quantization_config: None,
                            on_disk: Some(true), // Store on disk for better memory usage
                        },
                    )),
                }),
                ..Default::default()
            };

            self.client.create_collection(&create_collection).await?;
            tracing::info!("✅ Qdrant collection created successfully");
        } else {
            tracing::info!("✅ Qdrant collection already exists");
        }

        Ok(())
    }

    pub async fn upsert_evidence(&self, evidence: &EvidenceVector) -> Result<()> {
        let points = vec![PointStruct::new(
            evidence.evidence_id as u64,
            evidence.embedding.clone(),
            [
                ("evidence_id", evidence.evidence_id.into()),
                ("case_id", evidence.case_id.unwrap_or(0).into()),
                ("title", evidence.title.clone().into()),
                ("description", evidence.description.clone().unwrap_or_default().into()),
                ("evidence_type", evidence.evidence_type.clone().into()),
                ("tags", serde_json::to_string(&evidence.tags).unwrap_or_default().into()),
            ]
        )];

        let upsert_points = UpsertPoints {
            collection_name: self.collection_name.clone(),
            points,
            ..Default::default()
        };

        self.client.upsert_points(upsert_points).await?;
        tracing::debug!("📝 Upserted evidence {} to Qdrant", evidence.evidence_id);

        Ok(())
    }

    pub async fn search_similar_evidence(
        &self,
        query_vector: Vec<f32>,
        limit: u64,
        score_threshold: Option<f32>,
        filters: Option<HashMap<String, String>>,
    ) -> Result<Vec<SearchResult>> {
        let mut search_points = SearchPoints {
            collection_name: self.collection_name.clone(),
            vector: query_vector,
            limit,
            score_threshold,
            with_payload: Some(true.into()),
            ..Default::default()
        };

        // Apply filters if provided
        if let Some(filters) = filters {
            // Convert filters to Qdrant filter format
            // This is a simplified version - you can extend it for more complex filtering
            tracing::debug!("🔍 Applying filters: {:?}", filters);
        }

        let search_result = self.client.search_points(&search_points).await?;

        let results = search_result
            .result
            .into_iter()
            .map(|scored_point| {
                let mut metadata = HashMap::new();
                
                if let Some(payload) = scored_point.payload {
                    for (key, value) in payload {
                        if let Some(string_value) = value.as_str() {
                            metadata.insert(key, string_value.to_string());
                        }
                    }
                }

                SearchResult {
                    evidence_id: scored_point.id.unwrap().point_id_options.unwrap().try_into().unwrap_or(0),
                    score: scored_point.score,
                    metadata,
                }
            })
            .collect();

        Ok(results)
    }

    pub async fn search_by_tags(&self, tags: Vec<String>, limit: u64) -> Result<Vec<SearchResult>> {
        // This would implement tag-based filtering
        // For now, we'll use a simple approach - in a real implementation,
        // you'd want to use Qdrant's filtering capabilities
        
        tracing::info!("🏷️  Searching by tags: {:?}", tags);
        
        // Create a filter for tags
        let filters = tags.iter()
            .map(|tag| ("tags".to_string(), tag.clone()))
            .collect();

        // For semantic search, we'd need to convert tags to embeddings
        // This is a placeholder - implement based on your embedding strategy
        let query_vector = vec![0.0; 1536]; // Placeholder vector

        self.search_similar_evidence(query_vector, limit, Some(0.7), Some(filters)).await
    }

    pub async fn delete_evidence(&self, evidence_id: i32) -> Result<()> {
        let points_selector = PointsSelector {
            points_selector_one_of: Some(
                qdrant_client::qdrant::points_selector::PointsSelectorOneOf::Points(
                    PointsIdsList {
                        ids: vec![PointId::from(evidence_id as u64)],
                    }
                )
            ),
        };

        let delete_points = qdrant_client::qdrant::DeletePoints {
            collection_name: self.collection_name.clone(),
            points: Some(points_selector),
            ..Default::default()
        };

        self.client.delete_points(&delete_points).await?;
        tracing::debug!("🗑️  Deleted evidence {} from Qdrant", evidence_id);

        Ok(())
    }

    pub async fn get_collection_info(&self) -> Result<String> {
        let info = self.client.collection_info(&self.collection_name).await?;
        Ok(format!("Collection: {} - Points: {:?}", self.collection_name, info.result))
    }
}
