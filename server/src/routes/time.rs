use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{FromRow, PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use crate::context::Ws;
use crate::error::{AppError, AppResult};
use crate::lib_util::{created, nullable, ok, parse_datetime, parse_id, parse_optional_datetime, sql, status_error, Body, Ts};
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/entries", get(list).post(create_entry))
        .route("/entries/{id}", get(read).put(update).patch(update).delete(remove))
        .route("/timer/start", post(start_timer))
        .route("/timer/stop", post(stop_timer))
        .route("/timesheets", post(create_timesheet))
}

#[derive(Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TimeEntry {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub user_id: Uuid,
    pub task_id: Option<Uuid>,
    pub timesheet_id: Option<Uuid>,
    pub description: Option<String>,
    pub started_at: Ts,
    pub ended_at: Option<Ts>,
    pub duration_minutes: Option<i32>,
    pub is_running: bool,
    pub created_at: Ts,
}

pub const TIME_ENTRY_COLUMNS: &str =
    "id, workspace_id, user_id, task_id, timesheet_id, description, started_at, ended_at, duration_minutes, is_running, created_at";

/// An entry can only point at a task in the same workspace.
async fn check_task(db: &PgPool, task_id: Option<Uuid>, workspace_id: Uuid) -> AppResult<()> {
    if let Some(task_id) = task_id {
        let found: Option<Uuid> = sqlx::query_scalar("SELECT id FROM tasks WHERE id = $1 AND workspace_id = $2")
            .bind(task_id)
            .bind(workspace_id)
            .fetch_optional(db)
            .await?;
        if found.is_none() {
            return Err(AppError::bad_request("Task not found in this workspace"));
        }
    }
    Ok(())
}

fn parse_task_id(value: Option<&str>) -> AppResult<Option<Uuid>> {
    value.map(|v| Uuid::parse_str(v).map_err(|_| AppError::bad_request("taskId must be a UUID"))).transpose()
}

fn check_positive(minutes: Option<i64>) -> AppResult<Option<i32>> {
    match minutes {
        Some(m) if m <= 0 || m > i64::from(i32::MAX) => Err(AppError::bad_request("durationMinutes must be a positive integer")),
        other => Ok(other.map(|m| m as i32)),
    }
}

async fn list(State(state): State<AppState>, ws: Ws) -> AppResult<Response> {
    let entries: Vec<TimeEntry> = sqlx::query_as(sql(format!(
        "SELECT {TIME_ENTRY_COLUMNS} FROM time_entries WHERE workspace_id = $1 AND user_id = $2 ORDER BY started_at"
    )))
    .bind(ws.workspace_id)
    .bind(ws.user_id)
    .fetch_all(&state.db)
    .await?;
    Ok(ok(entries))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartTimer {
    task_id: Option<String>,
    description: Option<String>,
}

async fn start_timer(State(state): State<AppState>, ws: Ws, Body(payload): Body<StartTimer>) -> AppResult<Response> {
    let task_id = parse_task_id(payload.task_id.as_deref())?;
    check_task(&state.db, task_id, ws.workspace_id).await?;

    let running: Option<Uuid> =
        sqlx::query_scalar("SELECT id FROM time_entries WHERE workspace_id = $1 AND user_id = $2 AND is_running = true LIMIT 1")
            .bind(ws.workspace_id)
            .bind(ws.user_id)
            .fetch_optional(&state.db)
            .await?;
    if running.is_some() {
        return Err(status_error(StatusCode::CONFLICT, "A timer is already running"));
    }

    let entry: TimeEntry = sqlx::query_as(sql(format!(
        "INSERT INTO time_entries (workspace_id, user_id, task_id, description, started_at, is_running)
         VALUES ($1, $2, $3, $4, now(), true) RETURNING {TIME_ENTRY_COLUMNS}"
    )))
    .bind(ws.workspace_id)
    .bind(ws.user_id)
    .bind(task_id)
    .bind(&payload.description)
    .fetch_one(&state.db)
    .await?;
    Ok(created(entry))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StopTimer {
    entry_id: String,
}

async fn stop_timer(State(state): State<AppState>, ws: Ws, Body(payload): Body<StopTimer>) -> AppResult<Response> {
    let entry_id = Uuid::parse_str(&payload.entry_id).map_err(|_| AppError::bad_request("entryId must be a UUID"))?;
    let entry: TimeEntry = sqlx::query_as(sql(format!(
        "SELECT {TIME_ENTRY_COLUMNS} FROM time_entries WHERE id = $1 AND workspace_id = $2 AND user_id = $3 AND is_running = true LIMIT 1"
    )))
    .bind(entry_id)
    .bind(ws.workspace_id)
    .bind(ws.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::not_found("Running entry not found"))?;

    let ended = Utc::now();
    let minutes = ((ended - entry.started_at.0).num_milliseconds() as f64 / 60_000.0).round().max(1.0) as i32;

    let updated: TimeEntry = sqlx::query_as(sql(format!(
        "UPDATE time_entries SET ended_at = $2, duration_minutes = $3, is_running = false WHERE id = $1 RETURNING {TIME_ENTRY_COLUMNS}"
    )))
    .bind(entry.id)
    .bind(ended)
    .bind(minutes)
    .fetch_one(&state.db)
    .await?;
    Ok(ok(updated))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateTimesheet {
    period_start: String,
    period_end: String,
}

#[derive(Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
struct Timesheet {
    id: Uuid,
    workspace_id: Uuid,
    user_id: Uuid,
    period_start: Ts,
    period_end: Ts,
    approved_at: Option<Ts>,
    approved_by: Option<Uuid>,
    created_at: Ts,
}

async fn create_timesheet(State(state): State<AppState>, ws: Ws, Body(payload): Body<CreateTimesheet>) -> AppResult<Response> {
    let start = parse_datetime(&payload.period_start, "periodStart")?;
    let end = parse_datetime(&payload.period_end, "periodEnd")?;

    let mut tx = state.db.begin().await?;
    let sheet: Timesheet = sqlx::query_as(
        "INSERT INTO timesheets (workspace_id, user_id, period_start, period_end) VALUES ($1, $2, $3, $4)
         RETURNING id, workspace_id, user_id, period_start, period_end, approved_at, approved_by, created_at",
    )
    .bind(ws.workspace_id)
    .bind(ws.user_id)
    .bind(start)
    .bind(end)
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query("UPDATE time_entries SET timesheet_id = $3 WHERE workspace_id = $1 AND user_id = $2 AND timesheet_id IS NULL")
        .bind(ws.workspace_id)
        .bind(ws.user_id)
        .bind(sheet.id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(created(sheet))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateEntry {
    task_id: Option<String>,
    description: Option<String>,
    started_at: String,
    ended_at: Option<String>,
    duration_minutes: Option<i64>,
}

async fn create_entry(State(state): State<AppState>, ws: Ws, Body(payload): Body<CreateEntry>) -> AppResult<Response> {
    let task_id = parse_task_id(payload.task_id.as_deref())?;
    let started = parse_datetime(&payload.started_at, "startedAt")?;
    let ended = parse_optional_datetime(payload.ended_at.as_deref(), "endedAt")?;
    let minutes = check_positive(payload.duration_minutes)?;
    check_task(&state.db, task_id, ws.workspace_id).await?;

    let entry: TimeEntry = sqlx::query_as(sql(format!(
        "INSERT INTO time_entries (workspace_id, user_id, task_id, description, started_at, ended_at, duration_minutes, is_running)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false) RETURNING {TIME_ENTRY_COLUMNS}"
    )))
    .bind(ws.workspace_id)
    .bind(ws.user_id)
    .bind(task_id)
    .bind(&payload.description)
    .bind(started)
    .bind(ended)
    .bind(minutes)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(json!({ "data": &entry, "entry": &entry }))).into_response())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateEntry {
    #[serde(default, deserialize_with = "nullable")]
    task_id: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    description: Option<Option<String>>,
    started_at: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    ended_at: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    duration_minutes: Option<Option<i64>>,
    is_running: Option<bool>,
}

/// The entry's owner, or an error if it isn't in this workspace.
async fn entry_owner(db: &PgPool, id: Uuid, workspace_id: Uuid) -> AppResult<Uuid> {
    sqlx::query_scalar("SELECT user_id FROM time_entries WHERE id = $1 AND workspace_id = $2")
        .bind(id)
        .bind(workspace_id)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::not_found("Time entry not found"))
}

async fn update(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<UpdateEntry>) -> AppResult<Response> {
    if payload.task_id.is_none()
        && payload.description.is_none()
        && payload.started_at.is_none()
        && payload.ended_at.is_none()
        && payload.duration_minutes.is_none()
        && payload.is_running.is_none()
    {
        return Err(AppError::bad_request("At least one field is required"));
    }
    let task_id = match &payload.task_id {
        None => None,
        Some(value) => Some(parse_task_id(value.as_deref())?),
    };
    let started = parse_optional_datetime(payload.started_at.as_deref(), "startedAt")?;
    let ended = match &payload.ended_at {
        None => None,
        Some(value) => Some(parse_optional_datetime(value.as_deref(), "endedAt")?),
    };
    let minutes = match payload.duration_minutes {
        None => None,
        Some(value) => Some(check_positive(value)?),
    };

    let id = parse_id(&id, "Time entry not found")?;
    if entry_owner(&state.db, id, ws.workspace_id).await? != ws.user_id {
        return Err(AppError::forbidden("You can only edit your own time entries"));
    }
    if let Some(task_id) = task_id {
        check_task(&state.db, task_id, ws.workspace_id).await?;
    }

    let mut builder: QueryBuilder<Postgres> = QueryBuilder::new("UPDATE time_entries SET id = id");
    if let Some(task_id) = task_id {
        builder.push(", task_id = ").push_bind(task_id);
    }
    if let Some(description) = &payload.description {
        builder.push(", description = ").push_bind(description.clone());
    }
    if let Some(started) = started {
        builder.push(", started_at = ").push_bind(started);
    }
    if let Some(ended) = ended {
        builder.push(", ended_at = ").push_bind(ended);
    }
    if let Some(minutes) = minutes {
        builder.push(", duration_minutes = ").push_bind(minutes);
    }
    if let Some(running) = payload.is_running {
        builder.push(", is_running = ").push_bind(running);
    }
    builder.push(" WHERE id = ").push_bind(id);
    builder.push(format!(" RETURNING {TIME_ENTRY_COLUMNS}"));

    let entry: TimeEntry = builder.build_query_as().fetch_one(&state.db).await?;
    Ok(Json(json!({ "data": &entry, "entry": &entry })).into_response())
}

async fn remove(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let entry_id = parse_id(&id, "Time entry not found")?;
    if entry_owner(&state.db, entry_id, ws.workspace_id).await? != ws.user_id {
        return Err(AppError::forbidden("You can only delete your own time entries"));
    }
    sqlx::query("DELETE FROM time_entries WHERE id = $1").bind(entry_id).execute(&state.db).await?;
    Ok(Json(json!({ "success": true, "deletedId": entry_id })).into_response())
}

async fn read(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let id = parse_id(&id, "Time entry not found")?;
    let entry: TimeEntry = sqlx::query_as(sql(format!(
        "SELECT {TIME_ENTRY_COLUMNS} FROM time_entries WHERE id = $1 AND workspace_id = $2 AND user_id = $3 LIMIT 1"
    )))
    .bind(id)
    .bind(ws.workspace_id)
    .bind(ws.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::not_found("Time entry not found"))?;
    Ok(ok(entry))
}
