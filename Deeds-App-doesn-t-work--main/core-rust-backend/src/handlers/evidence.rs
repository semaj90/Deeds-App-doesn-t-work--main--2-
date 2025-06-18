use axum::{
    extract::{Extension, Multipart, Path},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use sqlx::{query, query_as};
use std::{fs, path::PathBuf};
use uuid::Uuid;

use crate::{
    models::{Evidence, EvidenceResponse, UploadEvidenceRequest},
    AppState,
};

pub async fn upload_evidence(
    Extension(state): Extension<AppState>,
    Extension(user_id): Extension<Uuid>,
    mut multipart: Multipart,
) -> Result<Json<EvidenceResponse>, StatusCode> {
    let mut title = String::new();
    let mut description: Option<String> = None;
    let mut evidence_type = String::new();
    let mut case_id: Option<i32> = None;
    let mut criminal_id: Option<i32> = None;
    let mut file_data: Option<Vec<u8>> = None;
    let mut file_name: Option<String> = None;
    let mut file_type: Option<String> = None;

    // Process multipart form data
    while let Some(field) = multipart.next_field().await.map_err(|_| StatusCode::BAD_REQUEST)? {
        let name = field.name().unwrap_or("").to_string();
        
        match name.as_str() {
            "title" => {
                title = field.text().await.map_err(|_| StatusCode::BAD_REQUEST)?;
            }
            "description" => {
                description = Some(field.text().await.map_err(|_| StatusCode::BAD_REQUEST)?);
            }
            "evidence_type" => {
                evidence_type = field.text().await.map_err(|_| StatusCode::BAD_REQUEST)?;
            }
            "case_id" => {
                let text = field.text().await.map_err(|_| StatusCode::BAD_REQUEST)?;
                case_id = text.parse().ok();
            }
            "criminal_id" => {
                let text = field.text().await.map_err(|_| StatusCode::BAD_REQUEST)?;
                criminal_id = text.parse().ok();
            }
            "file" => {
                file_name = field.file_name().map(|s| s.to_string());
                file_type = field.content_type().map(|s| s.to_string());
                file_data = Some(field.bytes().await.map_err(|_| StatusCode::BAD_REQUEST)?.to_vec());
            }
            _ => {}
        }
    }

    if title.is_empty() || evidence_type.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Handle file upload if present
    let mut file_path: Option<String> = None;
    let mut file_size: Option<i64> = None;

    if let Some(data) = file_data {
        if data.len() > state.config.max_file_size {
            return Err(StatusCode::PAYLOAD_TOO_LARGE);
        }

        // Create upload directory if it doesn't exist
        let upload_dir = PathBuf::from(&state.config.upload_dir);
        if !upload_dir.exists() {
            fs::create_dir_all(&upload_dir).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }

        // Generate unique filename
        let file_id = Uuid::new_v4();
        let extension = file_name.as_ref()
            .and_then(|name| PathBuf::from(name).extension())
            .and_then(|ext| ext.to_str())
            .unwrap_or("bin");
        
        let stored_filename = format!("{}_{}.{}", Utc::now().format("%Y%m%d_%H%M%S"), file_id, extension);
        let stored_path = upload_dir.join(&stored_filename);

        // Save file
        fs::write(&stored_path, &data).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        file_path = Some(stored_path.to_string_lossy().to_string());
        file_size = Some(data.len() as i64);
    }

    // Insert evidence record
    let evidence = query_as::<_, Evidence>(
        r#"
        INSERT INTO evidence (
            case_id, criminal_id, title, description, evidence_type,
            file_path, file_size, file_type, uploaded_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        "#
    )
    .bind(case_id)
    .bind(criminal_id)
    .bind(&title)
    .bind(&description)
    .bind(&evidence_type)
    .bind(&file_path)
    .bind(file_size)
    .bind(&file_type)
    .bind(user_id)
    .bind(Utc::now())
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(evidence.into()))
}

pub async fn get_evidence(
    Extension(state): Extension<AppState>,
    Extension(user_id): Extension<Uuid>,
    Path(evidence_id): Path<i32>,
) -> Result<Json<EvidenceResponse>, StatusCode> {
    let evidence = query_as::<_, Evidence>(
        "SELECT * FROM evidence WHERE id = $1"
    )
    .bind(evidence_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(evidence.into()))
}

pub async fn delete_evidence(
    Extension(state): Extension<AppState>,
    Extension(user_id): Extension<Uuid>,
    Path(evidence_id): Path<i32>,
) -> Result<Json<()>, StatusCode> {
    // Get evidence to check if file needs to be deleted
    let evidence = query_as::<_, Evidence>(
        "SELECT * FROM evidence WHERE id = $1"
    )
    .bind(evidence_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    // Delete from database
    let result = query("DELETE FROM evidence WHERE id = $1")
        .bind(evidence_id)
        .execute(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    // Delete file if it exists
    if let Some(file_path) = evidence.file_path {
        let _ = fs::remove_file(file_path); // Ignore errors for file deletion
    }

    Ok(Json(()))
}
