// API communication module for prosecutor-core
// Handles JSON serialization and HTTP communication between frontend and backend

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};

// Common API response wrapper
#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: DateTime<Utc>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            timestamp: Utc::now(),
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
            timestamp: Utc::now(),
        }
    }
}

// Case-related API models
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Case {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub status: CaseStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub assigned_to: Option<String>,
    pub priority: Priority,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum CaseStatus {
    Open,
    InProgress,
    UnderReview,
    Closed,
    Archived,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateCaseRequest {
    pub title: String,
    pub description: String,
    pub priority: Priority,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateCaseRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<CaseStatus>,
    pub priority: Option<Priority>,
    pub assigned_to: Option<String>,
    pub tags: Option<Vec<String>>,
}

// Evidence-related API models
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Evidence {
    pub id: Uuid,
    pub case_id: Uuid,
    pub name: String,
    pub description: String,
    pub file_path: Option<String>,
    pub file_type: String,
    pub file_size: Option<i64>,
    pub checksum: Option<String>,
    pub created_at: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateEvidenceRequest {
    pub case_id: Uuid,
    pub name: String,
    pub description: String,
    pub file_type: String,
    pub metadata: HashMap<String, String>,
}

// Search and filtering
#[derive(Serialize, Deserialize, Debug)]
pub struct SearchQuery {
    pub q: Option<String>,         // Search term
    pub status: Option<CaseStatus>, // Filter by status
    pub priority: Option<Priority>, // Filter by priority
    pub tags: Option<Vec<String>>, // Filter by tags
    pub limit: Option<i32>,        // Results limit
    pub offset: Option<i32>,       // Pagination offset
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchResults<T> {
    pub items: Vec<T>,
    pub total: i32,
    pub limit: i32,
    pub offset: i32,
}

// AI/NLP integration models
#[derive(Serialize, Deserialize, Debug)]
pub struct EmbeddingRequest {
    pub text: String,
    pub model: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EmbeddingResponse {
    pub embedding: Vec<f32>,
    pub model: String,
    pub dimensions: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SimilaritySearchRequest {
    pub query: String,
    pub case_id: Option<Uuid>,
    pub limit: Option<i32>,
    pub threshold: Option<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SimilarityMatch {
    pub id: Uuid,
    pub content: String,
    pub score: f32,
    pub case_id: Uuid,
    pub evidence_id: Option<Uuid>,
}

// TTS integration models
#[derive(Serialize, Deserialize, Debug)]
pub struct TtsRequest {
    pub text: String,
    pub voice: Option<String>,
    pub speed: Option<f32>,
    pub format: Option<String>, // "wav", "mp3", etc.
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TtsResponse {
    pub audio_data: String, // Base64 encoded audio
    pub format: String,
    pub duration_ms: Option<u32>,
}

// User and authentication models
#[derive(Serialize, Deserialize, Debug)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub role: String,
    pub created_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginResponse {
    pub token: String,
    pub user: User,
    pub expires_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub role: Option<String>,
}

// API error types
#[derive(Serialize, Deserialize, Debug)]
pub struct ApiError {
    pub code: String,
    pub message: String,
    pub details: Option<HashMap<String, String>>,
}

impl ApiError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            details: None,
        }
    }

    pub fn with_details(code: &str, message: &str, details: HashMap<String, String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            details: Some(details),
        }
    }
}

// HTTP status code mapping
impl From<ApiError> for StatusCode {
    fn from(error: ApiError) -> Self {
        match error.code.as_str() {
            "NOT_FOUND" => StatusCode::NOT_FOUND,
            "UNAUTHORIZED" => StatusCode::UNAUTHORIZED,
            "FORBIDDEN" => StatusCode::FORBIDDEN,
            "BAD_REQUEST" => StatusCode::BAD_REQUEST,
            "CONFLICT" => StatusCode::CONFLICT,
            "VALIDATION_ERROR" => StatusCode::UNPROCESSABLE_ENTITY,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

// Utility functions for JSON handling
pub mod json_utils {
    use super::*;
    use anyhow::Result;

    // Serialize with pretty printing for debugging
    pub fn to_pretty_json<T: Serialize>(value: &T) -> Result<String> {
        Ok(serde_json::to_string_pretty(value)?)
    }

    // Deserialize with better error messages
    pub fn from_json_str<T: for<'de> Deserialize<'de>>(json: &str) -> Result<T> {
        Ok(serde_json::from_str(json)?)
    }

    // Convert between similar types safely
    pub fn convert_json<T, U>(from: T) -> Result<U>
    where
        T: Serialize,
        U: for<'de> Deserialize<'de>,
    {
        let json = serde_json::to_string(&from)?;
        Ok(serde_json::from_str(&json)?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_response_serialization() {
        let response = ApiResponse::success(Case {
            id: Uuid::new_v4(),
            title: "Test Case".to_string(),
            description: "Test Description".to_string(),
            status: CaseStatus::Open,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            assigned_to: None,
            priority: Priority::Medium,
            tags: vec!["tag1".to_string(), "tag2".to_string()],
        });

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("success"));
        assert!(json.contains("Test Case"));
    }

    #[test]
    fn test_search_query_deserialization() {
        let json = r#"{"q":"test","status":"Open","limit":10}"#;
        let query: SearchQuery = serde_json::from_str(json).unwrap();
        
        assert_eq!(query.q, Some("test".to_string()));
        assert!(matches!(query.status, Some(CaseStatus::Open)));
        assert_eq!(query.limit, Some(10));
    }
}
