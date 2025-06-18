use axum::{
    extract::{Extension, Request},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use serde_json::Value;
use sqlx::query_as;
use uuid::Uuid;

use crate::{
    auth_simple::{create_jwt, hash_password, verify_password, Claims},
    models::{AuthResponse, CreateUserRequest, LoginRequest, User, UserResponse},
    AppState,
};

pub async fn register(
    Extension(state): Extension<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Check if user already exists
    let existing_user = query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&request.email)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if existing_user.is_some() {
        return Err(StatusCode::CONFLICT);
    }

    // Hash password
    let hashed_password = hash_password(&request.password, state.config.bcrypt_cost)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Create user
    let user_id = Uuid::new_v4();
    let now = Utc::now();
    
    let name = match (&request.first_name, &request.last_name) {
        (Some(first), Some(last)) => Some(format!("{} {}", first, last)),
        (Some(first), None) => Some(first.clone()),
        (None, Some(last)) => Some(last.clone()),
        _ => None,
    };

    let user = query_as::<_, User>(
        r#"
        INSERT INTO users (
            id, email, hashed_password, role, is_active, created_at, updated_at,
            first_name, last_name, name, title, department, specializations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
        "#
    )
    .bind(user_id)
    .bind(&request.email)
    .bind(&hashed_password)
    .bind("prosecutor")
    .bind(true)
    .bind(now)
    .bind(now)
    .bind(&request.first_name)
    .bind(&request.last_name)
    .bind(&name)
    .bind(&request.title)
    .bind(&request.department)
    .bind(serde_json::json!([]))
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Create JWT token
    let claims = Claims::new(user.id, user.email.clone(), user.role.clone());
    let token = create_jwt(&claims, &state.config.jwt_secret)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AuthResponse {
        token,
        user: user.into(),
    }))
}

pub async fn login(
    Extension(state): Extension<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    // Find user by email
    let user = query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1 AND is_active = true"
    )
    .bind(&request.email)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::UNAUTHORIZED)?;

    // Verify password
    let hashed_password = user.hashed_password.as_ref().ok_or(StatusCode::UNAUTHORIZED)?;
    let valid = verify_password(&request.password, hashed_password)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !valid {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Create JWT token
    let claims = Claims::new(user.id, user.email.clone(), user.role.clone());
    let token = create_jwt(&claims, &state.config.jwt_secret)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AuthResponse {
        token,
        user: user.into(),
    }))
}

pub async fn me(
    Extension(state): Extension<AppState>,
    Extension(user_id): Extension<Uuid>,
) -> Result<Json<UserResponse>, StatusCode> {
    let user = query_as::<_, User>(
        "SELECT * FROM users WHERE id = $1 AND is_active = true"
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(user.into()))
}
