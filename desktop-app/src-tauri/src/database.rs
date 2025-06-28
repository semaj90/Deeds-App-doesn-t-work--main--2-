use sqlx::{Pool, Postgres, Row};
use serde_json::{json, Value};
use uuid::Uuid;

pub async fn get_cases(pool: &Pool<Postgres>) -> Result<Vec<Value>, String> {
    match sqlx::query("SELECT id, title, description, case_number, case_type, status, priority, created_at FROM cases ORDER BY created_at DESC")
        .fetch_all(pool)
        .await 
    {
        Ok(rows) => {
            let cases: Vec<Value> = rows
                .iter()
                .map(|row| {
                    json!({
                        "id": row.get::<String, _>("id"),
                        "title": row.get::<String, _>("title"),
                        "description": row.get::<Option<String>, _>("description"),
                        "caseNumber": row.get::<Option<String>, _>("case_number"),
                        "caseType": row.get::<Option<String>, _>("case_type"),
                        "status": row.get::<Option<String>, _>("status"),
                        "priority": row.get::<Option<String>, _>("priority"),
                        "createdAt": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339()
                    })
                })
                .collect();
            Ok(cases)
        }
        Err(e) => Err(format!("Database error: {}", e))
    }
}

pub async fn create_case(
    pool: &Pool<Postgres>,
    title: String,
    description: String,
) -> Result<Value, String> {
    let case_id = Uuid::new_v4().to_string();
    let case_number = format!("CASE-{}", chrono::Utc::now().format("%Y%m%d-%H%M%S"));
    
    match sqlx::query(
        "INSERT INTO cases (id, title, description, case_number, case_type, status, priority, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id, title, description, case_number, case_type, status, priority, created_at"
    )
    .bind(&case_id)
    .bind(&title)
    .bind(&description)
    .bind(&case_number)
    .bind("criminal")
    .bind("active")
    .bind("medium")
    .bind(chrono::Utc::now())
    .bind(chrono::Utc::now())
    .fetch_one(pool)
    .await 
    {
        Ok(row) => {
            Ok(json!({
                "id": row.get::<String, _>("id"),
                "title": row.get::<String, _>("title"),
                "description": row.get::<Option<String>, _>("description"),
                "caseNumber": row.get::<Option<String>, _>("case_number"),
                "caseType": row.get::<Option<String>, _>("case_type"),
                "status": row.get::<Option<String>, _>("status"),
                "priority": row.get::<Option<String>, _>("priority"),
                "createdAt": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339()
            }))
        }
        Err(e) => Err(format!("Database error: {}", e))
    }
}

pub async fn get_reports(pool: &Pool<Postgres>) -> Result<Vec<Value>, String> {
    match sqlx::query("SELECT id, title, content, summary, report_type, status, created_at FROM reports ORDER BY created_at DESC")
        .fetch_all(pool)
        .await 
    {
        Ok(rows) => {
            let reports: Vec<Value> = rows
                .iter()
                .map(|row| {
                    json!({
                        "id": row.get::<String, _>("id"),
                        "title": row.get::<String, _>("title"),
                        "content": row.get::<Option<String>, _>("content"),
                        "summary": row.get::<Option<String>, _>("summary"),
                        "reportType": row.get::<Option<String>, _>("report_type"),
                        "status": row.get::<Option<String>, _>("status"),
                        "createdAt": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339()
                    })
                })
                .collect();
            Ok(reports)
        }
        Err(e) => Err(format!("Database error: {}", e))
    }
}

pub async fn create_report(
    pool: &Pool<Postgres>,
    title: String,
    content: String,
    summary: String,
) -> Result<Value, String> {
    let report_id = Uuid::new_v4().to_string();
    
    match sqlx::query(
        "INSERT INTO reports (id, title, content, summary, report_type, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, title, content, summary, report_type, status, created_at"
    )
    .bind(&report_id)
    .bind(&title)
    .bind(&content)
    .bind(&summary)
    .bind("investigation")
    .bind("draft")
    .bind(chrono::Utc::now())
    .bind(chrono::Utc::now())
    .fetch_one(pool)
    .await 
    {
        Ok(row) => {
            Ok(json!({
                "id": row.get::<String, _>("id"),
                "title": row.get::<String, _>("title"),
                "content": row.get::<Option<String>, _>("content"),
                "summary": row.get::<Option<String>, _>("summary"),
                "reportType": row.get::<Option<String>, _>("report_type"),
                "status": row.get::<Option<String>, _>("status"),
                "createdAt": row.get::<chrono::DateTime<chrono::Utc>, _>("created_at").to_rfc3339()
            }))
        }
        Err(e) => Err(format!("Database error: {}", e))
    }
}
