use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::Json,
};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;

use crate::AppState;

#[derive(Deserialize)]
pub struct CreateEmbeddingRequest {
    pub content_id: String,
    pub content_type: String, // "evidence", "case", "note", etc.
    pub content_text: String,
    pub embedding_vector: Vec<f32>, // The actual embedding vector
    pub metadata: Option<Value>,
}

#[derive(Serialize)]
pub struct EmbeddingResponse {
    pub id: i64,
    pub content_id: String,
    pub content_type: String,
    pub content_text: String,
    pub metadata: String, // JSON string for SQLite
    pub created_at: String, // SQLite datetime string
}

#[derive(Deserialize)]
pub struct SearchEmbeddingRequest {
    pub query_embedding: Vec<f32>,
    pub content_type: Option<String>,
    pub limit: Option<i64>,
    pub threshold: Option<f32>, // Similarity threshold
}

#[derive(Serialize)]
pub struct SearchResult {
    pub embedding: EmbeddingResponse,
    pub similarity: f32,
}

// Create a new embedding
pub async fn create_embedding(
    Extension(state): Extension<AppState>,
    Json(request): Json<CreateEmbeddingRequest>,
) -> Result<Json<EmbeddingResponse>, StatusCode> {
    let db = &state.db;
    
    // Convert embedding vector to JSON string
    let embedding_json = serde_json::to_string(&request.embedding_vector)
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    
    let metadata = serde_json::to_string(&request.metadata.unwrap_or_else(|| serde_json::json!({})))
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let conn = db.lock().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Use REPLACE to handle upserts
    let id = conn.execute(
        "INSERT OR REPLACE INTO embeddings (content_id, content_type, content_text, embedding_vector, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            request.content_id,
            request.content_type,
            request.content_text,
            embedding_json,
            metadata
        ],
    ).map_err(|e| {
        tracing::error!("Database error creating embedding: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Get the created/updated record
    let mut stmt = conn.prepare(
        "SELECT id, content_id, content_type, content_text, metadata, created_at
         FROM embeddings 
         WHERE content_id = ?1 AND content_type = ?2"
    ).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result = stmt.query_row(
        params![request.content_id, request.content_type],
        |row| {
            Ok(EmbeddingResponse {
                id: row.get(0)?,
                content_id: row.get(1)?,
                content_type: row.get(2)?,
                content_text: row.get(3)?,
                metadata: row.get(4)?,
                created_at: row.get(5)?,
            })
        }
    ).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(result))
}

// Get embedding by content_id and content_type
pub async fn get_embedding(
    Extension(state): Extension<AppState>,
    Path((content_id, content_type)): Path<(String, String)>,
) -> Result<Json<EmbeddingResponse>, StatusCode> {
    let db = &state.db;
    let conn = db.lock().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut stmt = conn.prepare(
        "SELECT id, content_id, content_type, content_text, metadata, created_at
         FROM embeddings 
         WHERE content_id = ?1 AND content_type = ?2"
    ).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result = stmt.query_row(
        params![content_id, content_type],
        |row| {
            Ok(EmbeddingResponse {
                id: row.get(0)?,
                content_id: row.get(1)?,
                content_type: row.get(2)?,
                content_text: row.get(3)?,
                metadata: row.get(4)?,
                created_at: row.get(5)?,
            })
        }
    ).map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(result))
}

// Get all embeddings for a content_id
pub async fn get_content_embeddings(
    Extension(state): Extension<AppState>,
    Path(content_id): Path<String>,
) -> Result<Json<Vec<EmbeddingResponse>>, StatusCode> {
    let db = &state.db;
    let conn = db.lock().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut stmt = conn.prepare(
        "SELECT id, content_id, content_type, content_text, metadata, created_at
         FROM embeddings 
         WHERE content_id = ?1
         ORDER BY created_at DESC"
    ).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let rows = stmt.query_map(params![content_id], |row| {
        Ok(EmbeddingResponse {
            id: row.get(0)?,
            content_id: row.get(1)?,
            content_type: row.get(2)?,
            content_text: row.get(3)?,
            metadata: row.get(4)?,
            created_at: row.get(5)?,
        })
    }).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let results: Result<Vec<_>, _> = rows.collect();
    let results = results.map_err(|e| {
        tracing::error!("Database error fetching embeddings: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(results))
}

// Search embeddings by similarity
pub async fn search_embeddings(
    Extension(state): Extension<AppState>,
    Query(params): Query<HashMap<String, String>>,
    Json(request): Json<SearchEmbeddingRequest>,
) -> Result<Json<Vec<SearchResult>>, StatusCode> {
    let db = &state.db;
    let conn = db.lock().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let limit = request.limit.unwrap_or(10).min(100); // Cap at 100 results
    
    // Basic implementation without vector similarity
    // In production, you'd want to use a proper vector database like Qdrant
    let mut query = "SELECT id, content_id, content_type, content_text, metadata, created_at
                     FROM embeddings WHERE 1=1".to_string();
    let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = vec![];
    
    if let Some(content_type) = &request.content_type {
        query.push_str(" AND content_type = ?");
        query_params.push(Box::new(content_type.clone()));
    }

    query.push_str(" ORDER BY created_at DESC LIMIT ?");
    query_params.push(Box::new(limit));

    let mut stmt = conn.prepare(&query)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter()
        .map(|p| p.as_ref())
        .collect();

    let rows = stmt.query_map(&param_refs[..], |row| {
        Ok(EmbeddingResponse {
            id: row.get(0)?,
            content_id: row.get(1)?,
            content_type: row.get(2)?,
            content_text: row.get(3)?,
            metadata: row.get(4)?,
            created_at: row.get(5)?,
        })
    }).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let embeddings: Result<Vec<_>, _> = rows.collect();
    let embeddings = embeddings.map_err(|e| {
        tracing::error!("Database error searching embeddings: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let search_results: Vec<SearchResult> = embeddings
        .into_iter()
        .map(|embedding| SearchResult {
            embedding,
            similarity: 1.0, // Placeholder similarity score
        })
        .collect();

    Ok(Json(search_results))
}
