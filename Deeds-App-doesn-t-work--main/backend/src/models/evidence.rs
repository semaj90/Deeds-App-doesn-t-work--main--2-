use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Evidence {
    pub id: i32,
    pub case_id: Option<i32>,
    pub criminal_id: Option<i32>,
    pub title: String,
    pub description: Option<String>,
    pub evidence_type: String,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_type: Option<String>,
    pub uploaded_by: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadEvidenceRequest {
    pub case_id: Option<i32>,
    pub criminal_id: Option<i32>,
    pub title: String,
    pub description: Option<String>,
    pub evidence_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EvidenceResponse {
    pub id: i32,
    pub case_id: Option<i32>,
    pub criminal_id: Option<i32>,
    pub title: String,
    pub description: Option<String>,
    pub evidence_type: String,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub file_type: Option<String>,
    pub created_at: DateTime<Utc>,
    pub uploaded_by_user: Option<String>, // User name
    pub case_title: Option<String>, // Case title if linked
}

impl From<Evidence> for EvidenceResponse {
    fn from(evidence: Evidence) -> Self {
        Self {
            id: evidence.id,
            case_id: evidence.case_id,
            criminal_id: evidence.criminal_id,
            title: evidence.title,
            description: evidence.description,
            evidence_type: evidence.evidence_type,
            file_path: evidence.file_path,
            file_size: evidence.file_size,
            file_type: evidence.file_type,
            created_at: evidence.created_at,
            uploaded_by_user: None, // Will be populated by query
            case_title: None, // Will be populated by query
        }
    }
}
