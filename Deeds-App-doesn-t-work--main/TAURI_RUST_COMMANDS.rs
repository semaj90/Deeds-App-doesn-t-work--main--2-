// Tauri Rust Commands for WardenNet SQLite Integration
// src-tauri/src/commands/cases.rs

use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePool, Row};
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Case {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub created_by: String,
    pub status: Option<String>,
    pub data: serde_json::Value, // JSON1 field
    pub tags: Vec<String>,
    pub ai_summary: Option<String>,
    pub ai_tags: Vec<String>,
    pub embedding: Option<serde_json::Value>,
    pub danger_score: Option<i32>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCaseRequest {
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub data: Option<serde_json::Value>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCaseRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub data: Option<serde_json::Value>,
    pub tags: Option<Vec<String>>,
}

// Tauri Commands

#[tauri::command]
pub async fn get_cases(
    user_id: String,
    search: Option<String>,
    status: Option<String>,
    db: State<'_, SqlitePool>,
) -> Result<Vec<Case>, String> {
    let mut query = "SELECT * FROM cases WHERE created_by = ?".to_string();
    let mut params: Vec<String> = vec![user_id.clone()];
    
    // Add search filter
    if let Some(search_term) = search {
        query.push_str(" AND (title LIKE ? OR description LIKE ?)");
        params.push(format!("%{}%", search_term));
        params.push(format!("%{}%", search_term));
    }
    
    // Add status filter
    if let Some(status_filter) = status {
        query.push_str(" AND status = ?");
        params.push(status_filter);
    }
    
    query.push_str(" ORDER BY created_at DESC");
    
    let mut query_builder = sqlx::query(&query);
    for param in params {
        query_builder = query_builder.bind(param);
    }
    
    let rows = query_builder
        .fetch_all(db.get_ref())
        .await
        .map_err(|e| format!("Database error: {}", e))?;
    
    let mut cases = Vec::new();
    for row in rows {
        let case = Case {
            id: row.get("id"),
            title: row.get("title"),
            description: row.get("description"),
            created_by: row.get("created_by"),
            status: row.get("status"),
            data: serde_json::from_str(row.get("data")).unwrap_or_default(),
            tags: serde_json::from_str(row.get("tags")).unwrap_or_default(),
            ai_summary: row.get("ai_summary"),
            ai_tags: serde_json::from_str(row.get("ai_tags")).unwrap_or_default(),
            embedding: row.get::<Option<String>, _>("embedding")
                .and_then(|s| serde_json::from_str(&s).ok()),
            danger_score: row.get("danger_score"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };
        cases.push(case);
    }
    
    Ok(cases)
}

#[tauri::command]
pub async fn get_case_by_id(
    case_id: String,
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<Option<Case>, String> {
    let row = sqlx::query(
        "SELECT * FROM cases WHERE id = ? AND created_by = ?"
    )
    .bind(&case_id)
    .bind(&user_id)
    .fetch_optional(db.get_ref())
    .await
    .map_err(|e| format!("Database error: {}", e))?;
    
    if let Some(row) = row {
        let case = Case {
            id: row.get("id"),
            title: row.get("title"),
            description: row.get("description"),
            created_by: row.get("created_by"),
            status: row.get("status"),
            data: serde_json::from_str(row.get("data")).unwrap_or_default(),
            tags: serde_json::from_str(row.get("tags")).unwrap_or_default(),
            ai_summary: row.get("ai_summary"),
            ai_tags: serde_json::from_str(row.get("ai_tags")).unwrap_or_default(),
            embedding: row.get::<Option<String>, _>("embedding")
                .and_then(|s| serde_json::from_str(&s).ok()),
            danger_score: row.get("danger_score"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        };
        Ok(Some(case))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn create_case(
    request: CreateCaseRequest,
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<Case, String> {
    let case_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now();
    
    let data_json = request.data.unwrap_or_else(|| serde_json::json!({}));
    let tags_json = serde_json::to_string(&request.tags.unwrap_or_default())
        .unwrap_or_else(|_| "[]".to_string());
    
    sqlx::query(
        r#"
        INSERT INTO cases (
            id, title, description, created_by, status, data, tags, 
            ai_summary, ai_tags, embedding, danger_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&case_id)
    .bind(&request.title)
    .bind(&request.description)
    .bind(&user_id)
    .bind(request.status.unwrap_or_else(|| "draft".to_string()))
    .bind(serde_json::to_string(&data_json).unwrap())
    .bind(&tags_json)
    .bind::<Option<String>>(None) // ai_summary
    .bind("[]") // ai_tags
    .bind::<Option<String>>(None) // embedding
    .bind::<Option<i32>>(None) // danger_score
    .bind(&now)
    .bind(&now)
    .execute(db.get_ref())
    .await
    .map_err(|e| format!("Failed to create case: {}", e))?;
    
    // Trigger background AI analysis
    tokio::spawn(async move {
        if let Some(description) = &request.description {
            // Call AI service to analyze case description
            // Update case with AI summary, tags, and embeddings
            // This would call your local LLM service
        }
    });
    
    // Return the created case
    get_case_by_id(case_id, user_id, db).await
        .map(|opt| opt.ok_or_else(|| "Failed to retrieve created case".to_string()))?
}

#[tauri::command]
pub async fn update_case(
    case_id: String,
    request: UpdateCaseRequest,
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<Case, String> {
    let now = chrono::Utc::now();
    
    // Build dynamic UPDATE query
    let mut update_fields = Vec::new();
    let mut params = Vec::new();
    
    if let Some(title) = &request.title {
        update_fields.push("title = ?");
        params.push(title.clone());
    }
    
    if let Some(description) = &request.description {
        update_fields.push("description = ?");
        params.push(description.clone());
    }
    
    if let Some(status) = &request.status {
        update_fields.push("status = ?");
        params.push(status.clone());
    }
    
    if let Some(data) = &request.data {
        update_fields.push("data = ?");
        params.push(serde_json::to_string(data).unwrap());
    }
    
    if let Some(tags) = &request.tags {
        update_fields.push("tags = ?");
        params.push(serde_json::to_string(tags).unwrap());
    }
    
    if update_fields.is_empty() {
        return Err("No fields to update".to_string());
    }
    
    update_fields.push("updated_at = ?");
    params.push(now.to_rfc3339());
    
    let query = format!(
        "UPDATE cases SET {} WHERE id = ? AND created_by = ?",
        update_fields.join(", ")
    );
    
    let mut query_builder = sqlx::query(&query);
    for param in params {
        query_builder = query_builder.bind(param);
    }
    query_builder = query_builder.bind(&case_id).bind(&user_id);
    
    let result = query_builder
        .execute(db.get_ref())
        .await
        .map_err(|e| format!("Failed to update case: {}", e))?;
    
    if result.rows_affected() == 0 {
        return Err("Case not found or unauthorized".to_string());
    }
    
    // Return updated case
    get_case_by_id(case_id, user_id, db).await
        .map(|opt| opt.ok_or_else(|| "Failed to retrieve updated case".to_string()))?
}

#[tauri::command]
pub async fn delete_case(
    case_id: String,
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<bool, String> {
    let result = sqlx::query(
        "DELETE FROM cases WHERE id = ? AND created_by = ?"
    )
    .bind(&case_id)
    .bind(&user_id)
    .execute(db.get_ref())
    .await
    .map_err(|e| format!("Failed to delete case: {}", e))?;
    
    Ok(result.rows_affected() > 0)
}

// Search and Analytics Commands

#[tauri::command]
pub async fn search_cases_semantic(
    query: String,
    user_id: String,
    limit: Option<i32>,
    db: State<'_, SqlitePool>,
) -> Result<Vec<Case>, String> {
    // This would integrate with Qdrant for vector search
    // 1. Generate embedding for query
    // 2. Search Qdrant for similar case embeddings
    // 3. Return matching cases from SQLite
    
    // For now, fallback to text search
    get_cases(user_id, Some(query), None, db).await
}

#[tauri::command]
pub async fn get_case_statistics(
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<serde_json::Value, String> {
    let stats = sqlx::query(
        r#"
        SELECT 
            COUNT(*) as total_cases,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cases,
            COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_cases,
            AVG(danger_score) as avg_danger_score
        FROM cases WHERE created_by = ?
        "#
    )
    .bind(&user_id)
    .fetch_one(db.get_ref())
    .await
    .map_err(|e| format!("Failed to get statistics: {}", e))?;
    
    Ok(serde_json::json!({
        "total_cases": stats.get::<i64, _>("total_cases"),
        "active_cases": stats.get::<i64, _>("active_cases"),
        "closed_cases": stats.get::<i64, _>("closed_cases"),
        "avg_danger_score": stats.get::<Option<f64>, _>("avg_danger_score")
    }))
}
