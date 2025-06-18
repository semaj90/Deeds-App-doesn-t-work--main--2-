use axum::{extract::Extension, http::StatusCode, response::Json};
use serde_json::{json, Value};

use crate::AppState;

pub async fn health_check(Extension(state): Extension<AppState>) -> Result<Json<Value>, StatusCode> {
    // Test database connection
    match crate::database::test_connection(&state.db).await {
        Ok(_) => Ok(Json(json!({
            "status": "healthy",
            "database": "connected",
            "timestamp": chrono::Utc::now(),
            "version": env!("CARGO_PKG_VERSION")
        }))),
        Err(_) => Err(StatusCode::SERVICE_UNAVAILABLE),
    }
}
