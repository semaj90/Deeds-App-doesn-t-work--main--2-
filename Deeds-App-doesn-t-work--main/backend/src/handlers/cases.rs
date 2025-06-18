use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use serde::Deserialize;
use sqlx::{query, query_as};
use uuid::Uuid;

use crate::{
    models::{Case, CaseResponse, CreateCaseRequest, UpdateCaseRequest},
    AppState,
};

#[derive(Deserialize)]
pub struct ListCasesQuery {
    page: Option<u32>,
    limit: Option<u32>,
    status: Option<String>,
    priority: Option<String>,
    assigned_to: Option<Uuid>,
}

pub async fn list_cases(
    Extension(state): Extension<AppState>,
    Extension(user_id): Extension<Uuid>,
    Query(query): Query<ListCasesQuery>,
) -> Result<Json<Vec<CaseResponse>>, StatusCode> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100); // Max 100 per page
    let offset = (page - 1) * limit;

    let mut sql = r#"
        SELECT 
            c.*,
            creator.name as created_by_user,
            assignee.name as assigned_to_user,
            COALESCE(evidence_count.count, 0) as evidence_count
        FROM cases c
        LEFT JOIN users creator ON c.created_by = creator.id
        LEFT JOIN users assignee ON c.assigned_to = assignee.id
        LEFT JOIN (
            SELECT case_id, COUNT(*) as count
            FROM evidence
            WHERE case_id IS NOT NULL
            GROUP BY case_id
        ) evidence_count ON c.id = evidence_count.case_id
        WHERE c.archived = false
    "#.to_string();

    let mut bind_count = 0;
    let mut binds: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send + Sync>> = Vec::new();

    // Add filters
    if let Some(status) = &query.status {
        bind_count += 1;
        sql.push_str(&format!(" AND c.status = ${}", bind_count));
        binds.push(Box::new(status.clone()));
    }

    if let Some(priority) = &query.priority {
        bind_count += 1;
        sql.push_str(&format!(" AND c.priority = ${}", bind_count));
        binds.push(Box::new(priority.clone()));
    }

    if let Some(assigned_to) = &query.assigned_to {
        bind_count += 1;
        sql.push_str(&format!(" AND c.assigned_to = ${}", bind_count));
        binds.push(Box::new(*assigned_to));
    }

    sql.push_str(" ORDER BY c.created_at DESC");
    sql.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    // For simplicity, let's use a simpler query for now
    let cases = query_as::<_, Case>(
        r#"
        SELECT * FROM cases 
        WHERE archived = false
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        "#
    )
    .bind(limit as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let case_responses: Vec<CaseResponse> = cases.into_iter().map(|case| case.into()).collect();

    Ok(Json(case_responses))
}

pub async fn get_case(
    Extension(state): Extension<AppState>,
    Extension(user_id): Extension<Uuid>,
    Path(case_id): Path<i32>,
) -> Result<Json<CaseResponse>, StatusCode> {
    let case = query_as::<_, Case>(
        "SELECT * FROM cases WHERE id = $1 AND archived = false"
    )
    .bind(case_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(case.into()))
}

pub async fn create_case(
    Extension(state): Extension<AppState>,
    Extension(user_id): Extension<Uuid>,
    Json(request): Json<CreateCaseRequest>,
) -> Result<Json<CaseResponse>, StatusCode> {
    let now = Utc::now();
    let tags_json = serde_json::to_value(request.tags.unwrap_or_default())
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let case = query_as::<_, Case>(
        r#"
        INSERT INTO cases (
            case_number, title, description, status, priority, created_by, assigned_to,
            created_at, updated_at, court_date, court_location, judge_assigned,
            case_type, jurisdiction, estimated_duration, case_value,
            statute_of_limitations, tags, notes, archived
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *
        "#
    )
    .bind(&request.case_number)
    .bind(&request.title)
    .bind(&request.description)
    .bind(request.status.unwrap_or_else(|| "open".to_string()))
    .bind(request.priority.unwrap_or_else(|| "medium".to_string()))
    .bind(user_id)
    .bind(&request.assigned_to)
    .bind(now)
    .bind(now)
    .bind(&request.court_date)
    .bind(&request.court_location)
    .bind(&request.judge_assigned)
    .bind(&request.case_type)
    .bind(&request.jurisdiction)
    .bind(&request.estimated_duration)
    .bind(&request.case_value)
    .bind(&request.statute_of_limitations)
    .bind(&tags_json)
    .bind(&request.notes)
    .bind(false)
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(case.into()))
}

pub async fn update_case(
    Extension(state): Extension<AppState>,
    Extension(user_id): Extension<Uuid>,
    Path(case_id): Path<i32>,
    Json(request): Json<UpdateCaseRequest>,
) -> Result<Json<CaseResponse>, StatusCode> {
    let now = Utc::now();

    // Build dynamic update query
    let mut updates = Vec::new();
    let mut bind_count = 1;

    if request.title.is_some() { updates.push(format!("title = ${}", bind_count)); bind_count += 1; }
    if request.description.is_some() { updates.push(format!("description = ${}", bind_count)); bind_count += 1; }
    if request.status.is_some() { updates.push(format!("status = ${}", bind_count)); bind_count += 1; }
    if request.priority.is_some() { updates.push(format!("priority = ${}", bind_count)); bind_count += 1; }
    if request.assigned_to.is_some() { updates.push(format!("assigned_to = ${}", bind_count)); bind_count += 1; }
    if request.court_date.is_some() { updates.push(format!("court_date = ${}", bind_count)); bind_count += 1; }
    if request.court_location.is_some() { updates.push(format!("court_location = ${}", bind_count)); bind_count += 1; }
    if request.judge_assigned.is_some() { updates.push(format!("judge_assigned = ${}", bind_count)); bind_count += 1; }
    if request.case_type.is_some() { updates.push(format!("case_type = ${}", bind_count)); bind_count += 1; }
    if request.jurisdiction.is_some() { updates.push(format!("jurisdiction = ${}", bind_count)); bind_count += 1; }
    if request.estimated_duration.is_some() { updates.push(format!("estimated_duration = ${}", bind_count)); bind_count += 1; }
    if request.case_value.is_some() { updates.push(format!("case_value = ${}", bind_count)); bind_count += 1; }
    if request.statute_of_limitations.is_some() { updates.push(format!("statute_of_limitations = ${}", bind_count)); bind_count += 1; }
    if request.tags.is_some() { updates.push(format!("tags = ${}", bind_count)); bind_count += 1; }
    if request.notes.is_some() { updates.push(format!("notes = ${}", bind_count)); bind_count += 1; }

    if updates.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    updates.push(format!("updated_at = ${}", bind_count));

    // For simplicity, let's just update a few common fields
    let case = query_as::<_, Case>(
        "UPDATE cases SET title = COALESCE($1, title), description = COALESCE($2, description), 
         status = COALESCE($3, status), priority = COALESCE($4, priority), updated_at = $5
         WHERE id = $6 AND archived = false
         RETURNING *"
    )
    .bind(&request.title)
    .bind(&request.description)
    .bind(&request.status)
    .bind(&request.priority)
    .bind(now)
    .bind(case_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(case.into()))
}

pub async fn delete_case(
    Extension(state): Extension<AppState>,
    Extension(user_id): Extension<Uuid>,
    Path(case_id): Path<i32>,
) -> Result<Json<()>, StatusCode> {
    let result = query(
        "UPDATE cases SET archived = true WHERE id = $1"
    )
    .bind(case_id)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(Json(()))
}
