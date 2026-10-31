use axum::extract::State;
use axum::response::Response;
use axum::routing::get;
use axum::Router;
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;

use super::models::{list_members, WorkspaceSummary};
use crate::context::Ws;
use crate::error::{AppError, AppResult};
use crate::lib_util::{ok, Body};
use crate::permissions::Permission;
use crate::workspace_settings::{self, SECTIONS};
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(read).patch(update))
}

fn invalid_stored(message: String) -> AppError {
    AppError::Internal(anyhow::anyhow!("stored workspace settings are invalid: {message}"))
}

async fn load(db: &PgPool, ws: &Ws) -> AppResult<(WorkspaceSummary, Option<Value>)> {
    let workspace: WorkspaceSummary = sqlx::query_as("SELECT id, name, slug FROM workspaces WHERE id = $1")
        .bind(ws.workspace_id)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::not_found("Workspace not found"))?;
    let stored: Option<Value> = sqlx::query_scalar("SELECT settings FROM workspace_settings WHERE workspace_id = $1")
        .bind(ws.workspace_id)
        .fetch_optional(db)
        .await?;
    Ok((workspace, stored))
}

async fn response(db: &PgPool, ws: &Ws, workspace: &WorkspaceSummary, settings: &Value) -> AppResult<Response> {
    let members = list_members(db, ws.workspace_id).await?;
    Ok(ok(json!({
        "workspace": workspace,
        "membership": { "role": ws.role, "isActive": true },
        "currentUserId": ws.auth_user_id,
        "members": members,
        "settings": settings,
    })))
}

async fn read(State(state): State<AppState>, ws: Ws) -> AppResult<Response> {
    let (workspace, stored) = load(&state.db, &ws).await?;
    let settings = workspace_settings::normalize(stored.as_ref().unwrap_or(&json!({})), Some(&workspace.name)).map_err(invalid_stored)?;

    if stored.is_none() {
        sqlx::query("INSERT INTO workspace_settings (workspace_id, settings) VALUES ($1, $2) ON CONFLICT (workspace_id) DO NOTHING")
            .bind(ws.workspace_id)
            .bind(&settings)
            .execute(&state.db)
            .await?;
    }

    response(&state.db, &ws, &workspace, &settings).await
}

#[derive(Deserialize)]
struct Patch {
    section: String,
    data: Value,
}

async fn update(State(state): State<AppState>, ws: Ws, Body(patch): Body<Patch>) -> AppResult<Response> {
    ws.require(Permission::ManageSettings)?;
    if !SECTIONS.contains(&patch.section.as_str()) {
        return Err(AppError::bad_request(format!("section must be one of: {}", SECTIONS.join(", "))));
    }
    let data = workspace_settings::parse_section(&patch.section, &patch.data).map_err(AppError::BadRequest)?;

    let (mut workspace, stored) = load(&state.db, &ws).await?;
    let current = workspace_settings::normalize(stored.as_ref().unwrap_or(&json!({})), Some(&workspace.name)).map_err(invalid_stored)?;

    let next_name = if patch.section == "general" {
        let requested = data["workspaceName"].as_str().unwrap_or_default().trim();
        if requested.is_empty() { workspace.name.clone() } else { requested.to_owned() }
    } else {
        workspace.name.clone()
    };

    let mut next = workspace_settings::update(&current, &patch.section, &data, Some(&next_name)).map_err(AppError::BadRequest)?;

    if patch.section == "general" && next_name != workspace.name {
        sqlx::query("UPDATE workspaces SET name = $2, updated_at = now() WHERE id = $1")
            .bind(ws.workspace_id)
            .bind(&next_name)
            .execute(&state.db)
            .await?;
        workspace.name = next_name;
    }

    next = workspace_settings::append_audit_entry(&next, &format!("{} settings updated", patch.section)).map_err(invalid_stored)?;

    sqlx::query(
        "INSERT INTO workspace_settings (workspace_id, settings) VALUES ($1, $2)
         ON CONFLICT (workspace_id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = now()",
    )
    .bind(ws.workspace_id)
    .bind(&next)
    .execute(&state.db)
    .await?;

    response(&state.db, &ws, &workspace, &next).await
}
