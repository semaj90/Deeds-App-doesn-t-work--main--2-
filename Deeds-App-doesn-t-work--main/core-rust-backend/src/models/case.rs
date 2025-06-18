use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Case {
    pub id: i32,
    pub case_number: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub created_by: Uuid,
    pub assigned_to: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub court_date: Option<DateTime<Utc>>,
    pub court_location: Option<String>,
    pub judge_assigned: Option<String>,
    pub case_type: Option<String>,
    pub jurisdiction: Option<String>,
    pub estimated_duration: Option<i32>,
    pub case_value: Option<f64>,
    pub statute_of_limitations: Option<DateTime<Utc>>,
    pub tags: serde_json::Value,
    pub notes: Option<String>,
    pub archived: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCaseRequest {
    pub case_number: String,
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub assigned_to: Option<Uuid>,
    pub court_date: Option<DateTime<Utc>>,
    pub court_location: Option<String>,
    pub judge_assigned: Option<String>,
    pub case_type: Option<String>,
    pub jurisdiction: Option<String>,
    pub estimated_duration: Option<i32>,
    pub case_value: Option<f64>,
    pub statute_of_limitations: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCaseRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub assigned_to: Option<Uuid>,
    pub court_date: Option<DateTime<Utc>>,
    pub court_location: Option<String>,
    pub judge_assigned: Option<String>,
    pub case_type: Option<String>,
    pub jurisdiction: Option<String>,
    pub estimated_duration: Option<i32>,
    pub case_value: Option<f64>,
    pub statute_of_limitations: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CaseResponse {
    pub id: i32,
    pub case_number: String,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub court_date: Option<DateTime<Utc>>,
    pub court_location: Option<String>,
    pub judge_assigned: Option<String>,
    pub case_type: Option<String>,
    pub jurisdiction: Option<String>,
    pub estimated_duration: Option<i32>,
    pub case_value: Option<f64>,
    pub statute_of_limitations: Option<DateTime<Utc>>,
    pub tags: Vec<String>,
    pub notes: Option<String>,
    pub archived: bool,
    // Related data
    pub created_by_user: Option<String>, // User name
    pub assigned_to_user: Option<String>, // User name
    pub evidence_count: i64,
}

impl From<Case> for CaseResponse {
    fn from(case: Case) -> Self {
        let tags: Vec<String> = case.tags.as_array()
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
            .unwrap_or_default();

        Self {
            id: case.id,
            case_number: case.case_number,
            title: case.title,
            description: case.description,
            status: case.status,
            priority: case.priority,
            created_at: case.created_at,
            updated_at: case.updated_at,
            court_date: case.court_date,
            court_location: case.court_location,
            judge_assigned: case.judge_assigned,
            case_type: case.case_type,
            jurisdiction: case.jurisdiction,
            estimated_duration: case.estimated_duration,
            case_value: case.case_value,
            statute_of_limitations: case.statute_of_limitations,
            tags,
            notes: case.notes,
            archived: case.archived,
            created_by_user: None, // Will be populated by query
            assigned_to_user: None, // Will be populated by query
            evidence_count: 0, // Will be populated by query
        }
    }
}
