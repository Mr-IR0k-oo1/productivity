use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use super::models::{Task, TASK_COLUMNS};
use super::tasks::task_json;
use crate::context::Ws;
use crate::error::{AppError, AppResult};
use crate::lib_util::{check_choice, check_length, created, no_content, nullable, ok, parse_id, sql, status_error, Body, Ts, TASK_STATUSES};
use crate::permissions::can_delete_owned;
use crate::AppState;

const IDEA_STATUSES: [&str; 4] = ["draft", "validated", "archived", "converted"];

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/{id}", get(read).patch(update).delete(remove))
        .route("/{id}/convert", post(convert))
        .route("/{id}/vote", post(toggle_vote).delete(remove_vote))
        .route("/{id}/votes", get(votes))
        .route("/{id}/votes/me", get(my_vote))
        .route("/{id}/dependencies", get(dependencies).post(add_dependency))
        .route("/{id}/dependencies/{depends_on_id}", delete(remove_dependency))
}

#[derive(Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Idea {
    id: Uuid,
    workspace_id: Uuid,
    author_id: Uuid,
    title: String,
    summary: Option<String>,
    content: Option<Value>,
    votes: i32,
    status: String,
    converted_task_id: Option<Uuid>,
    created_at: Ts,
    updated_at: Ts,
}

const IDEA_COLUMNS: &str =
    "id, workspace_id, author_id, title, summary, content, votes, status::text AS status, converted_task_id, created_at, updated_at";

async fn find_idea(db: &PgPool, id: Uuid, workspace_id: Uuid) -> AppResult<Idea> {
    sqlx::query_as(sql(format!("SELECT {IDEA_COLUMNS} FROM ideas WHERE id = $1 AND workspace_id = $2 LIMIT 1")))
        .bind(id)
        .bind(workspace_id)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::not_found("Idea not found"))
}

/// Checks the idea exists in the workspace; returns its id.
async fn require_idea(db: &PgPool, id: &str, workspace_id: Uuid) -> AppResult<Uuid> {
    let id = parse_id(id, "Idea not found")?;
    let exists: Option<Uuid> = sqlx::query_scalar("SELECT id FROM ideas WHERE id = $1 AND workspace_id = $2")
        .bind(id)
        .bind(workspace_id)
        .fetch_optional(db)
        .await?;
    exists.ok_or_else(|| AppError::not_found("Idea not found"))
}

async fn list(State(state): State<AppState>, ws: Ws) -> AppResult<Response> {
    let ideas: Vec<Idea> = sqlx::query_as(sql(format!("SELECT {IDEA_COLUMNS} FROM ideas WHERE workspace_id = $1 ORDER BY created_at")))
        .bind(ws.workspace_id)
        .fetch_all(&state.db)
        .await?;
    Ok(ok(ideas))
}

#[derive(Deserialize)]
struct CreateIdea {
    title: String,
    summary: Option<String>,
    content: Option<String>,
}

async fn create(State(state): State<AppState>, ws: Ws, Body(payload): Body<CreateIdea>) -> AppResult<Response> {
    check_length(&payload.title, "title", 2, None)?;
    let idea: Idea = sqlx::query_as(sql(format!(
        "INSERT INTO ideas (workspace_id, author_id, title, summary, content) VALUES ($1, $2, $3, $4, $5) RETURNING {IDEA_COLUMNS}"
    )))
    .bind(ws.workspace_id)
    .bind(ws.user_id)
    .bind(&payload.title)
    .bind(&payload.summary)
    .bind(payload.content.map(Value::String))
    .fetch_one(&state.db)
    .await?;
    Ok(created(idea))
}

async fn read(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let id = parse_id(&id, "Idea not found")?;
    Ok(ok(find_idea(&state.db, id, ws.workspace_id).await?))
}

#[derive(Deserialize)]
struct UpdateIdea {
    title: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    summary: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    content: Option<Option<String>>,
    status: Option<String>,
}

async fn update(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<UpdateIdea>) -> AppResult<Response> {
    if payload.title.is_none() && payload.summary.is_none() && payload.content.is_none() && payload.status.is_none() {
        return Err(AppError::bad_request("At least one field is required"));
    }
    if let Some(title) = &payload.title {
        check_length(title, "title", 2, None)?;
    }
    if let Some(status) = &payload.status {
        check_choice(status, "status", &IDEA_STATUSES)?;
    }
    let id = parse_id(&id, "Idea not found")?;

    let idea: Idea = sqlx::query_as(sql(format!(
        "UPDATE ideas SET
            title = COALESCE($3, title),
            summary = CASE WHEN $4 THEN $5 ELSE summary END,
            content = CASE WHEN $6 THEN $7 ELSE content END,
            status = COALESCE($8::idea_status, status),
            updated_at = now()
         WHERE id = $1 AND workspace_id = $2 RETURNING {IDEA_COLUMNS}"
    )))
    .bind(id)
    .bind(ws.workspace_id)
    .bind(&payload.title)
    .bind(payload.summary.is_some())
    .bind(payload.summary.clone().flatten())
    .bind(payload.content.is_some())
    .bind(payload.content.clone().flatten().map(Value::String))
    .bind(&payload.status)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::not_found("Idea not found"))?;

    Ok(ok(idea))
}

async fn remove(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let id = parse_id(&id, "Idea not found")?;
    let idea = find_idea(&state.db, id, ws.workspace_id).await?;
    if !can_delete_owned(Some(ws.role), idea.author_id, ws.user_id) {
        return Err(AppError::forbidden("Only the author or an admin can delete this idea"));
    }
    sqlx::query("DELETE FROM ideas WHERE id = $1 AND workspace_id = $2").bind(id).bind(ws.workspace_id).execute(&state.db).await?;
    Ok(no_content())
}

#[derive(Deserialize, Default)]
struct Convert {
    status: Option<String>,
}

async fn convert(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<Convert>) -> AppResult<Response> {
    let status = payload.status.unwrap_or_else(|| "todo".to_owned());
    check_choice(&status, "status", &TASK_STATUSES)?;
    let id = parse_id(&id, "Idea not found")?;
    let idea = find_idea(&state.db, id, ws.workspace_id).await?;

    if idea.status == "converted" && idea.converted_task_id.is_some() {
        return Err(status_error(StatusCode::CONFLICT, "Idea already converted"));
    }

    let mut tx = state.db.begin().await?;
    // Converted ideas get an issue number like any other new issue.
    let (number, prefix): (i32, String) = sqlx::query_as(
        "UPDATE workspaces SET issue_counter = issue_counter + 1 WHERE id = $1 RETURNING issue_counter, issue_key_prefix",
    )
    .bind(ws.workspace_id)
    .fetch_one(&mut *tx)
    .await?;
    let task: Task = sqlx::query_as(sql(format!(
        "INSERT INTO tasks (workspace_id, creator_id, title, description, status, idea_id, number)
         VALUES ($1, $2, $3, $4, $5::task_status, $6, $7) RETURNING {TASK_COLUMNS}"
    )))
    .bind(ws.workspace_id)
    .bind(ws.user_id)
    .bind(&idea.title)
    .bind(idea.content.clone().or(idea.summary.clone().map(Value::String)))
    .bind(&status)
    .bind(idea.id)
    .bind(number)
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query("UPDATE ideas SET status = 'converted', converted_task_id = $2, updated_at = now() WHERE id = $1")
        .bind(idea.id)
        .bind(task.id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    Ok(created(task_json(&task, &prefix)))
}

async fn has_voted(db: &PgPool, idea_id: Uuid, user_id: Uuid) -> AppResult<bool> {
    let vote: Option<Uuid> = sqlx::query_scalar("SELECT idea_id FROM idea_votes WHERE idea_id = $1 AND user_id = $2")
        .bind(idea_id)
        .bind(user_id)
        .fetch_optional(db)
        .await?;
    Ok(vote.is_some())
}

/// Votes, or takes the vote back if the user already voted. Responds `{ voted, voteCount }`.
async fn toggle_vote(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let idea_id = require_idea(&state.db, &id, ws.workspace_id).await?;
    let mut tx = state.db.begin().await?;

    let removed = sqlx::query("DELETE FROM idea_votes WHERE idea_id = $1 AND user_id = $2")
        .bind(idea_id)
        .bind(ws.user_id)
        .execute(&mut *tx)
        .await?
        .rows_affected()
        > 0;

    let votes: i32 = if removed {
        sqlx::query_scalar("UPDATE ideas SET votes = GREATEST(votes - 1, 0), updated_at = now() WHERE id = $1 RETURNING votes")
    } else {
        sqlx::query("INSERT INTO idea_votes (idea_id, user_id) VALUES ($1, $2)").bind(idea_id).bind(ws.user_id).execute(&mut *tx).await?;
        sqlx::query_scalar("UPDATE ideas SET votes = votes + 1, updated_at = now() WHERE id = $1 RETURNING votes")
    }
    .bind(idea_id)
    .fetch_one(&mut *tx)
    .await?;
    tx.commit().await?;

    Ok(Json(json!({ "voted": !removed, "voteCount": votes })).into_response())
}

async fn remove_vote(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let idea_id = require_idea(&state.db, &id, ws.workspace_id).await?;
    let mut tx = state.db.begin().await?;
    let removed = sqlx::query("DELETE FROM idea_votes WHERE idea_id = $1 AND user_id = $2")
        .bind(idea_id)
        .bind(ws.user_id)
        .execute(&mut *tx)
        .await?
        .rows_affected();
    if removed == 0 {
        return Err(AppError::not_found("Vote not found"));
    }
    sqlx::query("UPDATE ideas SET votes = GREATEST(votes - 1, 0), updated_at = now() WHERE id = $1").bind(idea_id).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(no_content())
}

async fn votes(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let idea_id = parse_id(&id, "Idea not found")?;
    let idea = find_idea(&state.db, idea_id, ws.workspace_id).await?;
    let voted = has_voted(&state.db, idea_id, ws.user_id).await?;
    Ok(ok(json!({ "total": idea.votes, "userVoted": voted, "vote": if voted { Some(1) } else { None } })))
}

async fn my_vote(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let idea_id = require_idea(&state.db, &id, ws.workspace_id).await?;
    Ok(Json(json!({ "voted": has_voted(&state.db, idea_id, ws.user_id).await? })).into_response())
}

#[derive(Serialize, FromRow)]
struct IdeaRef {
    id: Uuid,
    title: String,
    status: String,
}

async fn dependencies(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let idea_id = require_idea(&state.db, &id, ws.workspace_id).await?;
    let rows: Vec<IdeaRef> = sqlx::query_as(
        "SELECT i.id, i.title, i.status::text AS status FROM idea_dependencies d JOIN ideas i ON i.id = d.depends_on_idea_id
         WHERE d.idea_id = $1 AND i.workspace_id = $2 ORDER BY d.created_at",
    )
    .bind(idea_id)
    .bind(ws.workspace_id)
    .fetch_all(&state.db)
    .await?;
    Ok(ok(rows))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AddDependency {
    depends_on_id: String,
}

async fn add_dependency(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<AddDependency>) -> AppResult<Response> {
    let depends_on = Uuid::parse_str(&payload.depends_on_id).map_err(|_| AppError::bad_request("dependsOnId must be a UUID"))?;
    if id == payload.depends_on_id || parse_id(&id, "Idea not found")? == depends_on {
        return Err(AppError::bad_request("An idea cannot depend on itself"));
    }
    let idea_id = require_idea(&state.db, &id, ws.workspace_id).await?;

    let target: IdeaRef = sqlx::query_as("SELECT id, title, status::text AS status FROM ideas WHERE id = $1 AND workspace_id = $2")
        .bind(depends_on)
        .bind(ws.workspace_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::not_found("Dependency idea not found"))?;

    let inserted = sqlx::query("INSERT INTO idea_dependencies (idea_id, depends_on_idea_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(idea_id)
        .bind(depends_on)
        .execute(&state.db)
        .await?;
    if inserted.rows_affected() == 0 {
        return Err(status_error(StatusCode::CONFLICT, "Dependency already exists"));
    }

    Ok(created(target))
}

async fn remove_dependency(State(state): State<AppState>, ws: Ws, Path((id, depends_on_id)): Path<(String, String)>) -> AppResult<Response> {
    let idea_id = require_idea(&state.db, &id, ws.workspace_id).await?;
    let depends_on = parse_id(&depends_on_id, "Dependency not found")?;
    let deleted = sqlx::query("DELETE FROM idea_dependencies WHERE idea_id = $1 AND depends_on_idea_id = $2")
        .bind(idea_id)
        .bind(depends_on)
        .execute(&state.db)
        .await?;
    if deleted.rows_affected() == 0 {
        return Err(AppError::not_found("Dependency not found"));
    }
    Ok(no_content())
}
