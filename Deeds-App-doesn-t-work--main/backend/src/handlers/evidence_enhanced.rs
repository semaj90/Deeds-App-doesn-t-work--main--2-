use axum::{
    extract::{Extension, Multipart, Path, Query},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{query, query_as};
use std::{fs, path::PathBuf};
use uuid::Uuid;

use crate::{
    models::{CreateEvidenceRequest, Evidence, User},
    utils::ensure_directory_exists,
    AppState,
    qdrant::SearchQuery,
};

#[derive(Deserialize)]
pub struct EvidenceQuery {
    case_id: Option<Uuid>,
    limit: Option<usize>,
    offset: Option<usize>,
}

#[derive(Deserialize)]
pub struct SearchEvidenceQuery {
    q: String,
    case_id: Option<Uuid>,
    file_types: Option<String>, // comma-separated
    tags: Option<String>,       // comma-separated
    limit: Option<usize>,
    min_score: Option<f32>,
}

#[derive(Serialize)]
pub struct EvidenceResponse {
    pub evidence: Evidence,
    pub ai_tags: Option<Vec<String>>,
    pub ai_summary: Option<String>,
    pub similar_evidence: Option<Vec<Uuid>>,
}

pub async fn upload_evidence(
    mut multipart: Multipart,
    Extension(state): Extension<AppState>,
    Extension(user): Extension<User>,
) -> Result<Json<EvidenceResponse>, StatusCode> {
    let upload_dir = format!("{}/evidence", &state.file_processor.upload_dir);
    ensure_directory_exists(&upload_dir).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut evidence_data: Option<CreateEvidenceRequest> = None;
    let mut file_path: Option<String> = None;
    let mut original_filename: Option<String> = None;

    // Process multipart form
    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or_default();

        match name {
            "file" => {
                let filename = field.file_name().unwrap_or("unknown").to_string();
                original_filename = Some(filename.clone());
                
                let data = field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?;
                
                // Generate unique filename
                let file_id = Uuid::new_v4();
                let extension = PathBuf::from(&filename)
                    .extension()
                    .and_then(|ext| ext.to_str())
                    .unwrap_or("bin");
                
                let unique_filename = format!("{}.{}", file_id, extension);
                let path = format!("{}/{}", upload_dir, unique_filename);
                
                fs::write(&path, data).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
                file_path = Some(path);
            }
            "case_id" => {
                let case_id_str = field.text().await.map_err(|_| StatusCode::BAD_REQUEST)?;
                let case_id = if case_id_str.is_empty() {
                    None
                } else {
                    Some(Uuid::parse_str(&case_id_str).map_err(|_| StatusCode::BAD_REQUEST)?)
                };
                
                evidence_data = Some(CreateEvidenceRequest {
                    case_id,
                    title: "Uploaded Evidence".to_string(), // Will be updated below
                    description: None,
                    evidence_type: "file".to_string(),
                    tags: None,
                });
            }
            "title" => {
                let title = field.text().await.map_err(|_| StatusCode::BAD_REQUEST)?;
                if let Some(ref mut data) = evidence_data {
                    data.title = title;
                }
            }
            "description" => {
                let description = field.text().await.map_err(|_| StatusCode::BAD_REQUEST)?;
                if let Some(ref mut data) = evidence_data {
                    data.description = Some(description);
                }
            }
            "evidence_type" => {
                let evidence_type = field.text().await.map_err(|_| StatusCode::BAD_REQUEST)?;
                if let Some(ref mut data) = evidence_data {
                    data.evidence_type = evidence_type;
                }
            }
            _ => {}
        }
    }

    let evidence_data = evidence_data.ok_or(StatusCode::BAD_REQUEST)?;
    let file_path = file_path.ok_or(StatusCode::BAD_REQUEST)?;
    let original_filename = original_filename.ok_or(StatusCode::BAD_REQUEST)?;

    // Process the uploaded file
    let processed_file = state
        .file_processor
        .process_file(&file_path, &original_filename)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Create evidence record in database
    let evidence_id = Uuid::new_v4();
    let now = Utc::now();

    let evidence = query_as!(
        Evidence,
        r#"
        INSERT INTO evidence 
        (id, case_id, title, description, evidence_type, file_path, file_name, 
         file_size, mime_type, uploaded_by, uploaded_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
        RETURNING *
        "#,
        evidence_id,
        evidence_data.case_id,
        evidence_data.title,
        evidence_data.description,
        evidence_data.evidence_type,
        file_path,
        original_filename,
        processed_file.metadata.size_bytes as i64,
        processed_file.metadata.mime_type,
        user.id,
        now,
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Index in Qdrant with AI processing
    if let Err(e) = state
        .qdrant_service
        .index_evidence(&evidence, &processed_file, &state.db)
        .await
    {
        tracing::warn!("Failed to index evidence in Qdrant: {}", e);
    }

    // Get updated evidence with AI data
    let updated_evidence = query_as!(
        Evidence,
        "SELECT * FROM evidence WHERE id = $1",
        evidence_id
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Find similar evidence
    let similar_evidence = state
        .qdrant_service
        .get_similar_evidence(evidence_id, 5)
        .await
        .ok()
        .map(|results| results.into_iter().map(|r| r.evidence_id).collect());

    let ai_tags = updated_evidence.ai_tags
        .as_ref()
        .and_then(|tags| serde_json::from_value::<Vec<String>>(tags.clone()).ok());

    let response = EvidenceResponse {
        evidence: updated_evidence,
        ai_tags,
        ai_summary: evidence.ai_summary.clone(),
        similar_evidence,
    };

    Ok(Json(response))
}

pub async fn search_evidence(
    Query(query): Query<SearchEvidenceQuery>,
    Extension(state): Extension<AppState>,
    Extension(_user): Extension<User>,
) -> Result<Json<Vec<crate::qdrant::SearchResult>>, StatusCode> {
    let file_types = query.file_types
        .map(|types| types.split(',').map(|s| s.trim().to_string()).collect());
    
    let tags = query.tags
        .map(|tags| tags.split(',').map(|s| s.trim().to_string()).collect());

    let search_query = SearchQuery {
        query_text: query.q,
        case_id: query.case_id,
        file_types,
        tags,
        limit: query.limit,
        min_score: query.min_score,
    };

    let results = state
        .qdrant_service
        .search(search_query)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(results))
}

pub async fn get_evidence(
    Path(id): Path<Uuid>,
    Extension(state): Extension<AppState>,
    Extension(_user): Extension<User>,
) -> Result<Json<EvidenceResponse>, StatusCode> {
    let evidence = query_as!(Evidence, "SELECT * FROM evidence WHERE id = $1", id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let ai_tags = evidence.ai_tags
        .as_ref()
        .and_then(|tags| serde_json::from_value::<Vec<String>>(tags.clone()).ok());

    let similar_evidence = state
        .qdrant_service
        .get_similar_evidence(id, 5)
        .await
        .ok()
        .map(|results| results.into_iter().map(|r| r.evidence_id).collect());

    let response = EvidenceResponse {
        evidence,
        ai_tags,
        ai_summary: evidence.ai_summary.clone(),
        similar_evidence,
    };

    Ok(Json(response))
}

pub async fn list_evidence(
    Query(query): Query<EvidenceQuery>,
    Extension(state): Extension<AppState>,
    Extension(_user): Extension<User>,
) -> Result<Json<Vec<Evidence>>, StatusCode> {
    let limit = query.limit.unwrap_or(50).min(100) as i64;
    let offset = query.offset.unwrap_or(0) as i64;

    let evidence = if let Some(case_id) = query.case_id {
        query_as!(
            Evidence,
            "SELECT * FROM evidence WHERE case_id = $1 ORDER BY uploaded_at DESC LIMIT $2 OFFSET $3",
            case_id,
            limit,
            offset
        )
        .fetch_all(&state.db)
        .await
    } else {
        query_as!(
            Evidence,
            "SELECT * FROM evidence ORDER BY uploaded_at DESC LIMIT $1 OFFSET $2",
            limit,
            offset
        )
        .fetch_all(&state.db)
        .await
    };

    match evidence {
        Ok(evidence_list) => Ok(Json(evidence_list)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn delete_evidence(
    Path(id): Path<Uuid>,
    Extension(state): Extension<AppState>,
    Extension(_user): Extension<User>,
) -> Result<StatusCode, StatusCode> {
    // Get evidence info first
    let evidence = query_as!(Evidence, "SELECT * FROM evidence WHERE id = $1", id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    // Delete from database
    query!("DELETE FROM evidence WHERE id = $1", id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Delete file from filesystem
    if let Some(file_path) = &evidence.file_path {
        if let Err(e) = fs::remove_file(file_path) {
            tracing::warn!("Failed to delete file {}: {}", file_path, e);
        }
    }

    // Delete from Qdrant
    if let Err(e) = state.qdrant_service.delete_evidence(id).await {
        tracing::warn!("Failed to delete evidence from Qdrant: {}", e);
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_evidence_stats(
    Extension(state): Extension<AppState>,
    Extension(_user): Extension<User>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let db_stats = query!(
        r#"
        SELECT 
            COUNT(*) as total_evidence,
            COUNT(DISTINCT case_id) as cases_with_evidence,
            SUM(file_size) as total_file_size,
            COUNT(*) FILTER (WHERE ai_tags IS NOT NULL) as ai_processed_count
        FROM evidence
        "#
    )
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let qdrant_stats = state
        .qdrant_service
        .get_collection_stats()
        .await
        .unwrap_or_default();

    let stats = serde_json::json!({
        "database": {
            "total_evidence": db_stats.total_evidence,
            "cases_with_evidence": db_stats.cases_with_evidence,
            "total_file_size_bytes": db_stats.total_file_size,
            "ai_processed_count": db_stats.ai_processed_count,
        },
        "vector_search": qdrant_stats,
        "services": {
            "llm_available": state.llm_service.is_available().await,
            "supported_formats": state.file_processor.get_supported_formats(),
        }
    });

    Ok(Json(stats))
}
