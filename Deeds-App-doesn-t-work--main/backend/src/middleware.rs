use axum::{
    extract::{Extension, Request},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

use crate::{auth_simple::verify_jwt, AppState};

pub async fn auth_middleware(
    Extension(state): Extension<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Skip authentication for certain routes
    let path = request.uri().path();
    if path.starts_with("/api/auth/") || path == "/health" {
        return Ok(next.run(request).await);
    }

    // Extract JWT token from Authorization header
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // Verify JWT token
    let claims = verify_jwt(token, &state.config.jwt_secret)
        .map_err(|_| StatusCode::UNAUTHORIZED)?
        .claims;

    // Parse user ID
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Add user ID to request extensions
    request.extensions_mut().insert(user_id);

    Ok(next.run(request).await)
}
