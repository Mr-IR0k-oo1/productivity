use axum::extract::{Path, State};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, patch, post};
use axum::Router;
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::{PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use super::models::{Task, TASK_COLUMNS};
use crate::context::Ws;
use crate::error::{AppError, AppResult};
use crate::lib_util::{
    check_choice, check_length, check_range, created, no_content, nullable, ok, parse_datetime, parse_id, parse_optional_datetime, sql,
    Body, QueryParams, ISSUE_TYPES, TASK_STATUSES,
};
use crate::permissions::can_delete_owned;
use crate::scrum::{format_issue_key, parse_issue_key};
use crate::task_metadata;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/{id}", get(read).patch(update).delete(remove))
        .route("/{id}/status", patch(update_status))
        .route("/{id}/dependencies", post(add_dependency))
}

// ------------------------------------------------------------------ shared helpers

pub async fn issue_key_prefix(db: &PgPool, workspace_id: Uuid) -> AppResult<String> {
    let prefix: Option<String> = sqlx::query_scalar("SELECT issue_key_prefix FROM workspaces WHERE id = $1")
        .bind(workspace_id)
        .fetch_optional(db)
        .await?;
    Ok(prefix.unwrap_or_else(|| "ORB".to_owned()))
}

/// A task as the API returns it: the row, its issue key, and normalized view metadata.
pub fn task_json(task: &Task, prefix: &str) -> Value {
    let fallback = task_metadata::fallback_for(Some(task.created_at.0), task.due_date.map(|d| d.0));
    let mut value = serde_json::to_value(task).expect("tasks serialize");
    value["metadata"] = task_metadata::normalize(&task.metadata, &fallback);
    value["key"] = json!(format_issue_key(prefix, task.number));
    value
}

pub async fn find_task(db: &PgPool, task_id: Uuid, workspace_id: Uuid) -> AppResult<Option<Task>> {
    Ok(sqlx::query_as(sql(format!("SELECT {TASK_COLUMNS} FROM tasks WHERE id = $1 AND workspace_id = $2 LIMIT 1")))
        .bind(task_id)
        .bind(workspace_id)
        .fetch_optional(db)
        .await?)
}

/// Notifies a user that an issue was assigned to them (never for self-assignment).
pub async fn notify_assignment(db: &PgPool, ws: &Ws, assignee: Option<Uuid>, task: &Task, prefix: &str) -> AppResult<()> {
    let Some(assignee) = assignee.filter(|a| *a != ws.user_id) else {
        return Ok(());
    };
    let key = format_issue_key(prefix, task.number);
    sqlx::query(
        "INSERT INTO notifications (workspace_id, user_id, type, title, body, link) VALUES ($1, $2, 'assignment', $3, $4, $5)",
    )
    .bind(ws.workspace_id)
    .bind(assignee)
    .bind(format!("{}assigned to you", key.map(|k| format!("{k} ")).unwrap_or_default()))
    .bind(&task.title)
    .bind(format!("/tasks?taskId={}", task.id))
    .execute(db)
    .await?;
    Ok(())
}

/// `started_at` / `completed_at` after moving to `status`.
fn status_timestamps(
    status: &str,
    started_at: Option<crate::lib_util::Ts>,
    completed_at: Option<crate::lib_util::Ts>,
) -> (Option<chrono::DateTime<Utc>>, Option<chrono::DateTime<Utc>>) {
    let now = Utc::now();
    let mut started = started_at.map(|t| t.0);
    let mut completed = completed_at.map(|t| t.0);

    if status == "in_progress" && started.is_none() {
        started = Some(now);
    }
    if status == "done" {
        started.get_or_insert(now);
        completed = Some(now);
    } else {
        completed = None;
    }
    (started, completed)
}

/// Rejects parent/sprint references that point outside the workspace.
async fn validate_issue_references(
    db: &PgPool,
    workspace_id: Uuid,
    parent_id: Option<Uuid>,
    sprint_id: Option<Uuid>,
    task_id: Option<Uuid>,
) -> AppResult<()> {
    if let Some(parent_id) = parent_id {
        if Some(parent_id) == task_id {
            return Err(AppError::bad_request("An issue cannot be its own parent"));
        }
        let parent_type: Option<String> = sqlx::query_scalar("SELECT issue_type::text FROM tasks WHERE id = $1 AND workspace_id = $2")
            .bind(parent_id)
            .bind(workspace_id)
            .fetch_optional(db)
            .await?;
        match parent_type.as_deref() {
            None => return Err(AppError::bad_request("Parent issue not found in this workspace")),
            Some("epic") => {}
            Some(_) => return Err(AppError::bad_request("Only epics can be parents")),
        }
    }

    if let Some(sprint_id) = sprint_id {
        let status: Option<String> = sqlx::query_scalar("SELECT status::text FROM sprints WHERE id = $1 AND workspace_id = $2")
            .bind(sprint_id)
            .bind(workspace_id)
            .fetch_optional(db)
            .await?;
        match status.as_deref() {
            None => return Err(AppError::bad_request("Sprint not found in this workspace")),
            Some("completed") => return Err(AppError::bad_request("Cannot add issues to a completed sprint")),
            Some(_) => {}
        }
    }
    Ok(())
}

fn parse_uuid_field(value: &str, field: &str) -> AppResult<Uuid> {
    Uuid::parse_str(value).map_err(|_| AppError::bad_request(format!("{field} must be a UUID")))
}

// ------------------------------------------------------------------ list

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ListQuery {
    status: Option<String>,
    issue_type: Option<String>,
    parent_id: Option<String>,
    sprint_id: Option<String>,
    assignee_id: Option<String>,
    due_from: Option<String>,
    due_to: Option<String>,
    search: Option<String>,
}

async fn list(State(state): State<AppState>, ws: Ws, QueryParams(query): QueryParams<ListQuery>) -> AppResult<Response> {
    let prefix = issue_key_prefix(&state.db, ws.workspace_id).await?;
    let mut builder: QueryBuilder<Postgres> = QueryBuilder::new(format!("SELECT {TASK_COLUMNS} FROM tasks WHERE workspace_id = "));
    builder.push_bind(ws.workspace_id);

    if let Some(status) = &query.status {
        check_choice(status, "status", &TASK_STATUSES)?;
        builder.push(" AND status = ").push_bind(status.clone()).push("::task_status");
    }
    if let Some(assignee) = &query.assignee_id {
        builder.push(" AND assignee_id = ").push_bind(parse_uuid_field(assignee, "assigneeId")?);
    }
    if let Some(issue_type) = &query.issue_type {
        check_choice(issue_type, "issueType", &ISSUE_TYPES)?;
        builder.push(" AND issue_type = ").push_bind(issue_type.clone()).push("::issue_type");
    }
    if let Some(parent) = &query.parent_id {
        builder.push(" AND parent_id = ").push_bind(parse_uuid_field(parent, "parentId")?);
    }
    match query.sprint_id.as_deref() {
        Some("backlog") => {
            builder.push(" AND sprint_id IS NULL");
        }
        Some(sprint) => {
            builder.push(" AND sprint_id = ").push_bind(parse_uuid_field(sprint, "sprintId")?);
        }
        None => {}
    }
    if let Some(from) = parse_optional_datetime(query.due_from.as_deref(), "dueFrom")? {
        builder.push(" AND due_date >= ").push_bind(from);
    }
    if let Some(to) = parse_optional_datetime(query.due_to.as_deref(), "dueTo")? {
        builder.push(" AND due_date <= ").push_bind(to);
    }
    if let Some(search) = query.search.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        let pattern = format!("%{search}%");
        builder.push(" AND (title ILIKE ").push_bind(pattern.clone());
        // description is jsonb; search its text form.
        builder.push(" OR description::text ILIKE ").push_bind(pattern);
        if let Some((_, number)) = parse_issue_key(search).filter(|(p, _)| *p == prefix) {
            builder.push(" OR number = ").push_bind(number);
        }
        builder.push(")");
    }
    builder.push(" ORDER BY created_at DESC");

    let rows: Vec<Task> = builder.build_query_as().fetch_all(&state.db).await?;
    Ok(ok(rows.iter().map(|task| task_json(task, &prefix)).collect::<Vec<_>>()))
}

// ------------------------------------------------------------------ create

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateTask {
    title: String,
    description: Option<String>,
    assignee_id: Option<String>,
    status: Option<String>,
    priority: Option<i64>,
    due_date: Option<String>,
    metadata: Option<serde_json::Map<String, Value>>,
    issue_type: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    parent_id: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    sprint_id: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    story_points: Option<Option<i64>>,
}

fn check_story_points(points: Option<i64>) -> AppResult<()> {
    if let Some(points) = points {
        check_range(points, "storyPoints", 0, 100)?;
    }
    Ok(())
}

async fn create(State(state): State<AppState>, ws: Ws, Body(payload): Body<CreateTask>) -> AppResult<Response> {
    check_length(&payload.title, "title", 2, None)?;
    if let Some(status) = &payload.status {
        check_choice(status, "status", &TASK_STATUSES)?;
    }
    if let Some(issue_type) = &payload.issue_type {
        check_choice(issue_type, "issueType", &ISSUE_TYPES)?;
    }
    if let Some(priority) = payload.priority {
        check_range(priority, "priority", 1, 3)?;
    }
    let story_points = payload.story_points.flatten();
    check_story_points(story_points)?;
    let assignee = payload.assignee_id.as_deref().map(|a| parse_uuid_field(a, "assigneeId")).transpose()?;
    let parent_id = payload.parent_id.flatten().map(|p| parse_uuid_field(&p, "parentId")).transpose()?;
    let sprint_id = payload.sprint_id.flatten().map(|s| parse_uuid_field(&s, "sprintId")).transpose()?;
    let due_date = parse_optional_datetime(payload.due_date.as_deref(), "dueDate")?;

    validate_issue_references(&state.db, ws.workspace_id, parent_id, sprint_id, None).await?;

    let metadata = task_metadata::normalize(
        &payload.metadata.map(Value::Object).unwrap_or(Value::Null),
        &json!({ "startDate": task_metadata::iso(due_date.unwrap_or_else(Utc::now)) }),
    );

    let mut tx = state.db.begin().await?;
    // Atomically reserve the next issue number for this workspace.
    let (number, prefix): (i32, String) = sqlx::query_as(
        "UPDATE workspaces SET issue_counter = issue_counter + 1 WHERE id = $1 RETURNING issue_counter, issue_key_prefix",
    )
    .bind(ws.workspace_id)
    .fetch_one(&mut *tx)
    .await?;

    let task: Task = sqlx::query_as(sql(format!(
        "INSERT INTO tasks (workspace_id, creator_id, title, description, assignee_id, status, priority, due_date, number,
                            issue_type, parent_id, sprint_id, story_points, metadata)
         VALUES ($1, $2, $3, $4, $5, $6::task_status, COALESCE($7, 2), $8, $9, COALESCE($10::issue_type, 'task'), $11, $12, $13, $14)
         RETURNING {TASK_COLUMNS}"
    )))
    .bind(ws.workspace_id)
    .bind(ws.user_id)
    .bind(&payload.title)
    .bind(payload.description.map(Value::String))
    .bind(assignee)
    .bind(payload.status.as_deref().unwrap_or("todo"))
    .bind(payload.priority.map(|p| p as i32))
    .bind(due_date)
    .bind(number)
    .bind(payload.issue_type)
    .bind(parent_id)
    .bind(sprint_id)
    .bind(story_points.map(|p| p as i32))
    .bind(&metadata)
    .fetch_one(&mut *tx)
    .await?;
    tx.commit().await?;

    notify_assignment(&state.db, &ws, task.assignee_id, &task, &prefix).await?;

    let body = json!({
        "data": task_json(&task, &prefix),
        "meta": { "optimisticKey": format!("tasks:{}", ws.workspace_id) },
    });
    Ok((axum::http::StatusCode::CREATED, axum::Json(body)).into_response())
}

// ------------------------------------------------------------------ read / update

async fn read(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let id = parse_id(&id, "Task not found")?;
    let task = find_task(&state.db, id, ws.workspace_id).await?.ok_or_else(|| AppError::not_found("Task not found"))?;
    Ok(ok(task_json(&task, &issue_key_prefix(&state.db, ws.workspace_id).await?)))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateTask {
    title: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    description: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    assignee_id: Option<Option<String>>,
    status: Option<String>,
    priority: Option<i64>,
    #[serde(default, deserialize_with = "nullable")]
    due_date: Option<Option<String>>,
    metadata: Option<serde_json::Map<String, Value>>,
    issue_type: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    parent_id: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    sprint_id: Option<Option<String>>,
    #[serde(default, deserialize_with = "nullable")]
    story_points: Option<Option<i64>>,
}

impl UpdateTask {
    fn is_empty(&self) -> bool {
        self.title.is_none()
            && self.description.is_none()
            && self.assignee_id.is_none()
            && self.status.is_none()
            && self.priority.is_none()
            && self.due_date.is_none()
            && self.metadata.is_none()
            && self.issue_type.is_none()
            && self.parent_id.is_none()
            && self.sprint_id.is_none()
            && self.story_points.is_none()
    }
}

fn parse_nullable_uuid(value: &Option<Option<String>>, field: &str) -> AppResult<Option<Option<Uuid>>> {
    match value {
        None => Ok(None),
        Some(None) => Ok(Some(None)),
        Some(Some(text)) => Ok(Some(Some(parse_uuid_field(text, field)?))),
    }
}

async fn update(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<UpdateTask>) -> AppResult<Response> {
    if payload.is_empty() {
        return Err(AppError::bad_request("At least one field is required"));
    }
    if let Some(title) = &payload.title {
        check_length(title, "title", 2, None)?;
    }
    if let Some(status) = &payload.status {
        check_choice(status, "status", &TASK_STATUSES)?;
    }
    if let Some(issue_type) = &payload.issue_type {
        check_choice(issue_type, "issueType", &ISSUE_TYPES)?;
    }
    if let Some(priority) = payload.priority {
        check_range(priority, "priority", 1, 3)?;
    }
    check_story_points(payload.story_points.flatten())?;
    let assignee = parse_nullable_uuid(&payload.assignee_id, "assigneeId")?;
    let parent = parse_nullable_uuid(&payload.parent_id, "parentId")?;
    let sprint = parse_nullable_uuid(&payload.sprint_id, "sprintId")?;
    let due_date = match &payload.due_date {
        None => None,
        Some(None) => Some(None),
        Some(Some(text)) => Some(Some(parse_datetime(text, "dueDate")?)),
    };

    let task_id = parse_id(&id, "Task not found")?;
    validate_issue_references(&state.db, ws.workspace_id, parent.flatten(), sprint.flatten(), Some(task_id)).await?;

    let existing = find_task(&state.db, task_id, ws.workspace_id).await?.ok_or_else(|| AppError::not_found("Task not found"))?;

    let mut builder: QueryBuilder<Postgres> = QueryBuilder::new("UPDATE tasks SET updated_at = now()");
    if let Some(title) = &payload.title {
        builder.push(", title = ").push_bind(title.clone());
    }
    if let Some(description) = &payload.description {
        builder.push(", description = ").push_bind(description.clone().map(Value::String));
    }
    if let Some(assignee) = assignee {
        builder.push(", assignee_id = ").push_bind(assignee);
    }
    if let Some(status) = &payload.status {
        let (started, completed) = status_timestamps(status, existing.started_at, existing.completed_at);
        builder.push(", status = ").push_bind(status.clone()).push("::task_status");
        builder.push(", started_at = ").push_bind(started);
        builder.push(", completed_at = ").push_bind(completed);
    }
    if let Some(priority) = payload.priority {
        builder.push(", priority = ").push_bind(priority as i32);
    }
    if let Some(due) = due_date {
        builder.push(", due_date = ").push_bind(due);
    }
    if let Some(patch) = &payload.metadata {
        let fallback = task_metadata::fallback_for(Some(existing.created_at.0), existing.due_date.map(|d| d.0));
        let merged = task_metadata::merge(&existing.metadata, &Value::Object(patch.clone()), &fallback);
        builder.push(", metadata = ").push_bind(merged);
    }
    if let Some(issue_type) = &payload.issue_type {
        builder.push(", issue_type = ").push_bind(issue_type.clone()).push("::issue_type");
    }
    if let Some(parent) = parent {
        builder.push(", parent_id = ").push_bind(parent);
    }
    if let Some(sprint) = sprint {
        builder.push(", sprint_id = ").push_bind(sprint);
    }
    if let Some(points) = payload.story_points {
        builder.push(", story_points = ").push_bind(points.map(|p| p as i32));
    }
    builder.push(" WHERE id = ").push_bind(task_id);
    builder.push(" AND workspace_id = ").push_bind(ws.workspace_id);
    builder.push(format!(" RETURNING {TASK_COLUMNS}"));

    let updated: Task = builder
        .build_query_as()
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::not_found("Task not found"))?;

    let prefix = issue_key_prefix(&state.db, ws.workspace_id).await?;
    if payload.assignee_id.is_some() && existing.assignee_id != updated.assignee_id {
        notify_assignment(&state.db, &ws, updated.assignee_id, &updated, &prefix).await?;
    }

    Ok(ok(task_json(&updated, &prefix)))
}

#[derive(Deserialize)]
struct StatusUpdate {
    status: String,
}

async fn update_status(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<StatusUpdate>) -> AppResult<Response> {
    check_choice(&payload.status, "status", &TASK_STATUSES)?;
    let task_id = parse_id(&id, "Task not found")?;
    let existing = find_task(&state.db, task_id, ws.workspace_id).await?.ok_or_else(|| AppError::not_found("Task not found"))?;
    let (started, completed) = status_timestamps(&payload.status, existing.started_at, existing.completed_at);

    let updated: Task = sqlx::query_as(sql(format!(
        "UPDATE tasks SET status = $3::task_status, updated_at = now(), started_at = $4, completed_at = $5
         WHERE id = $1 AND workspace_id = $2 RETURNING {TASK_COLUMNS}"
    )))
    .bind(task_id)
    .bind(ws.workspace_id)
    .bind(&payload.status)
    .bind(started)
    .bind(completed)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::not_found("Task not found"))?;

    Ok(ok(task_json(&updated, &issue_key_prefix(&state.db, ws.workspace_id).await?)))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Dependency {
    depends_on_task_id: String,
}

#[derive(serde::Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
struct TaskDependency {
    task_id: Uuid,
    depends_on_task_id: Uuid,
    created_at: crate::lib_util::Ts,
}

async fn add_dependency(State(state): State<AppState>, ws: Ws, Path(id): Path<String>, Body(payload): Body<Dependency>) -> AppResult<Response> {
    let depends_on = parse_uuid_field(&payload.depends_on_task_id, "dependsOnTaskId")?;
    let task_id = parse_id(&id, "Task not found")?;
    if task_id == depends_on {
        return Err(AppError::bad_request("A task cannot depend on itself"));
    }

    let found: Vec<Uuid> = sqlx::query_scalar("SELECT id FROM tasks WHERE workspace_id = $1 AND id = ANY($2)")
        .bind(ws.workspace_id)
        .bind(vec![task_id, depends_on])
        .fetch_all(&state.db)
        .await?;
    if !found.contains(&task_id) {
        return Err(AppError::not_found("Task not found"));
    }
    if !found.contains(&depends_on) {
        return Err(AppError::bad_request("Dependency task not found in this workspace"));
    }

    sqlx::query("INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(task_id)
        .bind(depends_on)
        .execute(&state.db)
        .await?;
    let dependency: TaskDependency =
        sqlx::query_as("SELECT task_id, depends_on_task_id, created_at FROM task_dependencies WHERE task_id = $1 AND depends_on_task_id = $2")
            .bind(task_id)
            .bind(depends_on)
            .fetch_one(&state.db)
            .await?;

    Ok(created(dependency))
}

async fn remove(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    let task_id = parse_id(&id, "Task not found")?;
    let creator: Uuid = sqlx::query_scalar("SELECT creator_id FROM tasks WHERE id = $1 AND workspace_id = $2")
        .bind(task_id)
        .bind(ws.workspace_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::not_found("Task not found"))?;

    if !can_delete_owned(Some(ws.role), creator, ws.user_id) {
        return Err(AppError::forbidden("Only the creator or an admin can delete this issue"));
    }

    sqlx::query("DELETE FROM tasks WHERE id = $1 AND workspace_id = $2").bind(task_id).bind(ws.workspace_id).execute(&state.db).await?;
    Ok(no_content())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lib_util::Ts;

    #[test]
    fn status_timestamps_follow_the_workflow() {
        let (started, completed) = status_timestamps("in_progress", None, None);
        assert!(started.is_some() && completed.is_none());

        let earlier = Ts(Utc::now() - chrono::Duration::days(1));
        let (started, completed) = status_timestamps("done", Some(earlier), None);
        assert_eq!(started, Some(earlier.0));
        assert!(completed.is_some());

        let (started, completed) = status_timestamps("todo", Some(earlier), Some(earlier));
        assert_eq!(started, Some(earlier.0));
        assert!(completed.is_none());
    }
}
