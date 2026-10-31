use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Response;
use axum::routing::{get, patch, post};
use axum::Router;
use chrono::{DateTime, Duration, Utc};
use serde::Deserialize;
use serde_json::Value;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use super::models::{Sprint, SPRINT_COLUMNS};
use crate::context::Ws;
use crate::error::{AppError, AppResult};
use crate::lib_util::{check_choice, check_length, created, no_content, nullable, ok, parse_datetime, parse_id, sql, status_error, Body, QueryParams, Ts};
use crate::permissions::{is_read_method, Permission};
use crate::scrum::{build_burndown, compute_velocity, sum_story_points, BurndownIssue};
use crate::AppState;

const DEFAULT_SPRINT_DAYS: i64 = 14;
const SPRINT_STATUSES: [&str; 3] = ["planned", "active", "completed"];

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/velocity", get(velocity))
        .route("/{id}", patch(update).delete(remove))
        .route("/{id}/start", post(start))
        .route("/{id}/complete", post(complete))
        .route("/{id}/burndown", get(burndown))
}

/// Everyone can read sprints; only admins and owners can change them.
fn require_manage(ws: &Ws, method: &axum::http::Method) -> AppResult<()> {
    if is_read_method(method.as_str()) {
        Ok(())
    } else {
        ws.require(Permission::ManageSprints)
    }
}

#[derive(FromRow)]
struct SprintIssue {
    sprint_id: Option<Uuid>,
    status: String,
    story_points: Option<i32>,
    completed_at: Option<DateTime<Utc>>,
}

async fn load_sprint_issues(db: &PgPool, sprint_ids: &[Uuid]) -> AppResult<Vec<SprintIssue>> {
    if sprint_ids.is_empty() {
        return Ok(Vec::new());
    }
    Ok(sqlx::query_as("SELECT sprint_id, status::text AS status, story_points, completed_at FROM tasks WHERE sprint_id = ANY($1)")
        .bind(sprint_ids)
        .fetch_all(db)
        .await?)
}

/// The sprint plus issue and point counts.
fn summarize(sprint: &Sprint, issues: &[SprintIssue]) -> Value {
    let own: Vec<&SprintIssue> = issues.iter().filter(|i| i.sprint_id == Some(sprint.id)).collect();
    let done: Vec<&&SprintIssue> = own.iter().filter(|i| i.status == "done").collect();

    let mut value = serde_json::to_value(sprint).expect("sprints serialize");
    value["issueCount"] = own.len().into();
    value["doneCount"] = done.len().into();
    value["totalPoints"] = sum_story_points(own.iter().map(|i| i.story_points)).into();
    value["donePoints"] = sum_story_points(done.iter().map(|i| i.story_points)).into();
    value
}

async fn find_sprint(db: &PgPool, id: &str, workspace_id: Uuid) -> AppResult<Sprint> {
    let id = parse_id(id, "Sprint not found")?;
    sqlx::query_as(sql(format!("SELECT {SPRINT_COLUMNS} FROM sprints WHERE id = $1 AND workspace_id = $2 LIMIT 1")))
        .bind(id)
        .bind(workspace_id)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::not_found("Sprint not found"))
}

#[derive(Deserialize)]
struct ListQuery {
    status: Option<String>,
}

async fn list(State(state): State<AppState>, ws: Ws, QueryParams(query): QueryParams<ListQuery>) -> AppResult<Response> {
    if let Some(status) = &query.status {
        check_choice(status, "status", &SPRINT_STATUSES)?;
    }
    let rows: Vec<Sprint> = sqlx::query_as(sql(format!(
        "SELECT {SPRINT_COLUMNS} FROM sprints WHERE workspace_id = $1 AND ($2::text IS NULL OR status::text = $2) ORDER BY created_at"
    )))
    .bind(ws.workspace_id)
    .bind(&query.status)
    .fetch_all(&state.db)
    .await?;

    let ids: Vec<Uuid> = rows.iter().map(|s| s.id).collect();
    let issues = load_sprint_issues(&state.db, &ids).await?;
    Ok(ok(rows.iter().map(|sprint| summarize(sprint, &issues)).collect::<Vec<_>>()))
}

async fn velocity(State(state): State<AppState>, ws: Ws) -> AppResult<Response> {
    let mut completed: Vec<Sprint> = sqlx::query_as(sql(format!(
        "SELECT {SPRINT_COLUMNS} FROM sprints WHERE workspace_id = $1 AND status = 'completed' ORDER BY completed_at DESC NULLS LAST LIMIT 6"
    )))
    .bind(ws.workspace_id)
    .fetch_all(&state.db)
    .await?;
    completed.reverse();

    Ok(ok(compute_velocity(completed.into_iter().map(|s| (s.name, s.committed_points, s.completed_points)))))
}

/// zod's `.trim().min(1).max(120)`: returns the trimmed value.
fn trimmed(value: &str, field: &str, min: usize, max: usize) -> AppResult<String> {
    let value = value.trim();
    check_length(value, field, min, Some(max))?;
    Ok(value.to_owned())
}

#[derive(Deserialize)]
struct CreateSprint {
    name: Option<String>,
    goal: Option<String>,
}

async fn create(State(state): State<AppState>, ws: Ws, Body(payload): Body<CreateSprint>) -> AppResult<Response> {
    require_manage(&ws, &axum::http::Method::POST)?;
    let name = payload.name.as_deref().map(|n| trimmed(n, "name", 1, 120)).transpose()?;
    let goal = payload.goal.as_deref().map(|g| trimmed(g, "goal", 0, 2000)).transpose()?;

    let total: i64 = sqlx::query_scalar("SELECT count(*) FROM sprints WHERE workspace_id = $1").bind(ws.workspace_id).fetch_one(&state.db).await?;
    let sprint: Sprint = sqlx::query_as(sql(format!("INSERT INTO sprints (workspace_id, name, goal) VALUES ($1, $2, $3) RETURNING {SPRINT_COLUMNS}")))
        .bind(ws.workspace_id)
        .bind(name.unwrap_or_else(|| format!("Sprint {}", total + 1)))
        .bind(goal)
        .fetch_one(&state.db)
        .await?;

    Ok(created(summarize(&sprint, &[])))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateSprint {
    name: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    goal: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    start_date: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    end_date: Option<Option<String>>,
}

fn nullable_date(value: &Option<Option<String>>, current: Option<Ts>, field: &str) -> AppResult<Option<DateTime<Utc>>> {
    match value {
        None => Ok(current.map(|t| t.0)),
        Some(None) => Ok(None),
        Some(Some(text)) => Ok(Some(parse_datetime(text, field)?)),
    }
}

async fn update(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<UpdateSprint>) -> AppResult<Response> {
    require_manage(&ws, &axum::http::Method::PATCH)?;
    if payload.name.is_none() && payload.goal.is_none() && payload.start_date.is_none() && payload.end_date.is_none() {
        return Err(AppError::bad_request("At least one field is required"));
    }
    let name = payload.name.as_deref().map(|n| trimmed(n, "name", 1, 120)).transpose()?;
    let goal = match &payload.goal {
        None => None,
        Some(None) => Some(None),
        Some(Some(goal)) => Some(Some(trimmed(goal, "goal", 0, 2000)?)),
    };

    let sprint = find_sprint(&state.db, &id, ws.workspace_id).await?;
    let start = nullable_date(&payload.start_date, sprint.start_date, "startDate")?;
    let end = nullable_date(&payload.end_date, sprint.end_date, "endDate")?;
    if let (Some(start), Some(end)) = (start, end) {
        if end <= start {
            return Err(AppError::bad_request("End date must be after the start date"));
        }
    }

    let updated: Sprint = sqlx::query_as(sql(format!(
        "UPDATE sprints SET name = COALESCE($2, name), goal = CASE WHEN $3 THEN $4 ELSE goal END,
                start_date = $5, end_date = $6, updated_at = now()
         WHERE id = $1 RETURNING {SPRINT_COLUMNS}"
    )))
    .bind(sprint.id)
    .bind(name)
    .bind(goal.is_some())
    .bind(goal.flatten())
    .bind(start)
    .bind(end)
    .fetch_one(&state.db)
    .await?;

    let issues = load_sprint_issues(&state.db, &[updated.id]).await?;
    Ok(ok(summarize(&updated, &issues)))
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct StartSprint {
    start_date: Option<String>,
    end_date: Option<String>,
}

async fn start(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<StartSprint>) -> AppResult<Response> {
    require_manage(&ws, &axum::http::Method::POST)?;
    let requested_start = payload.start_date.as_deref().map(|d| parse_datetime(d, "startDate")).transpose()?;
    let requested_end = payload.end_date.as_deref().map(|d| parse_datetime(d, "endDate")).transpose()?;

    let sprint = find_sprint(&state.db, &id, ws.workspace_id).await?;
    if sprint.status != "planned" {
        return Err(status_error(StatusCode::CONFLICT, "Only planned sprints can be started"));
    }

    let active: Option<String> = sqlx::query_scalar("SELECT name FROM sprints WHERE workspace_id = $1 AND status = 'active' LIMIT 1")
        .bind(ws.workspace_id)
        .fetch_optional(&state.db)
        .await?;
    if let Some(active) = active {
        return Err(status_error(StatusCode::CONFLICT, format!("Complete {active} before starting another sprint")));
    }

    let start = requested_start.or(sprint.start_date.map(|t| t.0)).unwrap_or_else(Utc::now);
    let end = requested_end.or(sprint.end_date.map(|t| t.0)).unwrap_or(start + Duration::days(DEFAULT_SPRINT_DAYS));
    if end <= start {
        return Err(AppError::bad_request("End date must be after the start date"));
    }

    let issues = load_sprint_issues(&state.db, &[sprint.id]).await?;
    let committed = sum_story_points(issues.iter().map(|i| i.story_points));

    let updated: Sprint = sqlx::query_as(sql(format!(
        "UPDATE sprints SET status = 'active', start_date = $2, end_date = $3, committed_points = $4, updated_at = now()
         WHERE id = $1 RETURNING {SPRINT_COLUMNS}"
    )))
    .bind(sprint.id)
    .bind(start)
    .bind(end)
    .bind(committed as i32)
    .fetch_one(&state.db)
    .await?;

    Ok(ok(summarize(&updated, &issues)))
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct CompleteSprint {
    /// Where unfinished issues go: "backlog", or another planned sprint's id.
    move_incomplete_to: Option<String>,
}

async fn complete(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<CompleteSprint>) -> AppResult<Response> {
    require_manage(&ws, &axum::http::Method::POST)?;
    let destination = payload.move_incomplete_to.unwrap_or_else(|| "backlog".to_owned());
    if destination != "backlog" && Uuid::parse_str(&destination).is_err() {
        return Err(AppError::bad_request("moveIncompleteTo must be \"backlog\" or a sprint id"));
    }

    let sprint = find_sprint(&state.db, &id, ws.workspace_id).await?;
    if sprint.status != "active" {
        return Err(status_error(StatusCode::CONFLICT, "Only the active sprint can be completed"));
    }

    let target: Option<Uuid> = if destination == "backlog" {
        None
    } else {
        let target = find_sprint(&state.db, &destination, ws.workspace_id).await.ok();
        match target {
            Some(target) if target.status == "planned" && target.id != sprint.id => Some(target.id),
            _ => return Err(AppError::bad_request("Unfinished issues can only move to a planned sprint")),
        }
    };

    let issues = load_sprint_issues(&state.db, &[sprint.id]).await?;
    let completed_points = sum_story_points(issues.iter().filter(|i| i.status == "done").map(|i| i.story_points));

    let mut tx = state.db.begin().await?;
    sqlx::query("UPDATE tasks SET sprint_id = $2, updated_at = now() WHERE sprint_id = $1 AND status <> 'done'")
        .bind(sprint.id)
        .bind(target)
        .execute(&mut *tx)
        .await?;
    let updated: Sprint = sqlx::query_as(sql(format!(
        "UPDATE sprints SET status = 'completed', completed_at = now(), completed_points = $2, updated_at = now()
         WHERE id = $1 RETURNING {SPRINT_COLUMNS}"
    )))
    .bind(sprint.id)
    .bind(completed_points as i32)
    .fetch_one(&mut *tx)
    .await?;
    tx.commit().await?;

    let remaining = load_sprint_issues(&state.db, &[updated.id]).await?;
    Ok(ok(summarize(&updated, &remaining)))
}

async fn burndown(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let sprint = find_sprint(&state.db, &id, ws.workspace_id).await?;
    let (Some(start), Some(end)) = (sprint.start_date, sprint.end_date) else {
        return Ok(ok(Vec::<Value>::new()));
    };

    let issues = load_sprint_issues(&state.db, &[sprint.id]).await?;
    let committed = sprint.committed_points.map(i64::from).unwrap_or_else(|| sum_story_points(issues.iter().map(|i| i.story_points)));
    let burndown_issues: Vec<BurndownIssue> = issues
        .iter()
        .map(|i| BurndownIssue { story_points: i.story_points, completed_at: if i.status == "done" { i.completed_at } else { None } })
        .collect();

    Ok(ok(build_burndown(start.0, end.0, committed, &burndown_issues, Utc::now())))
}

async fn remove(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    require_manage(&ws, &axum::http::Method::DELETE)?;
    let sprint = find_sprint(&state.db, &id, ws.workspace_id).await?;
    if sprint.status == "active" {
        return Err(status_error(StatusCode::CONFLICT, "Complete the sprint before deleting it"));
    }
    // Issues fall back to the backlog via ON DELETE SET NULL.
    sqlx::query("DELETE FROM sprints WHERE id = $1").bind(sprint.id).execute(&state.db).await?;
    Ok(no_content())
}
