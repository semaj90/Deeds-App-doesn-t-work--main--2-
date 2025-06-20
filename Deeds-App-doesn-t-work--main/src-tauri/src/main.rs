use tauri::{Manager, State};
use sqlx::{postgres::PgPoolOptions, Pool, Postgres};
use serde::{Serialize, Deserialize};
use dotenv::dotenv;
use std::env;

// Import our custom modules
mod llm_commands;
mod evidence_processor;

// Define a struct that mirrors your `cases` table schema
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Case {
    pub id: Option<i32>, // Option because it's auto-incremented
    pub name: String,
    pub title: String,
    pub summary: Option<String>,
    pub status: String,
    #[serde(with = "ts_datetime")]
    pub date_opened: chrono::DateTime<chrono::Utc>,
    pub description: Option<String>,
    #[serde(with = "ts_datetime")]
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub user_id: String,
}

// Helper module for serializing/deserializing chrono::DateTime to/from JavaScript Date strings
mod ts_datetime {
    use serde::{self, Deserialize, Deserializer, Serializer};
    use chrono::{DateTime, Utc, NaiveDateTime};

    pub fn serialize<S>(date: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&date.to_rfc3339())
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        // Try parsing as RFC3339 first (from JS Date.toISOString())
        if let Ok(dt) = DateTime::parse_from_rfc3339(&s) {
            return Ok(dt.with_timezone(&Utc));
        }
        // Fallback to NaiveDateTime parsing if RFC3339 fails (e.g., for simple date strings like "YYYY-MM-DD")
        if let Ok(naive_dt) = NaiveDateTime::parse_from_str(&s, "%Y-%m-%d") {
            return Ok(DateTime::<Utc>::from_naive_utc_and_offset(naive_dt, Utc));
        }
        Err(serde::de::Error::custom(format!("Cannot parse datetime: {}", s)))
    }
}

// Tauri command to create a new case
#[tauri::command]
async fn create_case(
    db_pool: State<'_, Pool<Postgres>>,
    name: String,
    title: String,
    summary: Option<String>,
    status: String,
    date_opened: String, // Received as string from frontend
    description: Option<String>,
    user_id: String, // Assuming user_id is passed from frontend for now
) -> Result<Case, String> {
    let parsed_date_opened = chrono::NaiveDate::parse_from_str(&date_opened, "%Y-%m-%d")
        .map_err(|e| format!("Invalid date_opened format: {}", e))?
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc();

    let new_case = sqlx::query_as!(
        Case,
        r#"
        INSERT INTO cases (name, title, summary, status, date_opened, description, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id, name, title, summary, status, date_opened, description, created_at, user_id
        "#,
        name,
        title,
        summary,
        status,
        parsed_date_opened,
        description,
        user_id
    )
    .fetch_one(&**db_pool)
    .await
    .map_err(|e| format!("Failed to create case: {}", e))?;

    Ok(new_case)
}

// Tauri command to update an existing case
#[tauri::command]
async fn update_case(
    db_pool: State<'_, Pool<Postgres>>,
    id: i32,
    name: String,
    title: String,
    summary: Option<String>,
    status: String,
    date_opened: String, // Received as string from frontend
    description: Option<String>,
) -> Result<Case, String> {
    let parsed_date_opened = chrono::NaiveDate::parse_from_str(&date_opened, "%Y-%m-%d")
        .map_err(|e| format!("Invalid date_opened format: {}", e))?
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc();

    let updated_case = sqlx::query_as!(
        Case,
        r#"
        UPDATE cases
        SET name = $1, title = $2, summary = $3, status = $4, date_opened = $5, description = $6
        WHERE id = $7
        RETURNING id, name, title, summary, status, date_opened, description, created_at, user_id
        "#,
        name,
        title,
        summary,
        status,
        parsed_date_opened,
        description,
        id
    )
    .fetch_one(&**db_pool)
    .await
    .map_err(|e| format!("Failed to update case: {}", e))?;

    Ok(updated_case)
}

// Tauri command to delete a case
#[tauri::command]
async fn delete_case(
    db_pool: State<'_, Pool<Postgres>>,
    id: i32,
) -> Result<String, String> {
    sqlx::query!(
        r#"
        DELETE FROM cases
        WHERE id = $1
        "#,
        id
    )
    .execute(&**db_pool)
    .await
    .map_err(|e| format!("Failed to delete case: {}", e))?;

    Ok(format!("Case with ID {} deleted successfully", id))
}

fn main() {
    dotenv().ok(); // Load .env file

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in .env file");

    // Create a Tokio runtime for async operations
    let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");

    // Block on the async database connection
    let pool = rt.block_on(async {
        PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .expect("Failed to connect to Postgres")
    });

    tauri::Builder::default()
        .manage(pool) // Make the database pool available as a state
        .plugin(llm_commands::register_llm_commands())
        .plugin(evidence_processor::register_evidence_commands())
        .invoke_handler(tauri::generate_handler![
            create_case,
            update_case,
            delete_case
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
