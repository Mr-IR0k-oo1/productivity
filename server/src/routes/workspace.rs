use std::collections::HashSet;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Response;
use axum::routing::{delete, get, patch, post};
use axum::Router;

use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use super::models::{list_members, Membership, UserSummary, Workspace, WorkspaceSummary, MEMBERSHIP_COLUMNS, WORKSPACE_COLUMNS};
use crate::context::{Auth, Ws};
use crate::error::{AppError, AppResult};
use crate::lib_util::{check_choice, check_email, check_length, created, data, no_content, ok, parse_id, sql, Body, Ts, MEMBER_ROLES};
use crate::permissions::{
    can_add_workspace_member, can_deactivate_workspace_member, can_delete_workspace, can_manage_workspace_member,
    can_update_workspace_member_role, Role,
};
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create).delete(delete_workspace))
        .route("/me", get(me))
        .route("/members", get(members).post(add_member))
        .route("/members/{user_id}", patch(update_member).delete(remove_member))
        .route("/invites", get(invites))
        .route("/invites/{id}", delete(revoke_invite))
        .route("/switch/{id}", post(switch))
}

async fn user_id_for(db: &PgPool, auth_user_id: Uuid) -> AppResult<Uuid> {
    sqlx::query_scalar("SELECT id FROM users WHERE auth_user_id = $1 LIMIT 1")
        .bind(auth_user_id)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::not_found("User not found"))
}

fn slugify(value: &str) -> String {
    let mut slug = String::new();
    for ch in value.trim().to_lowercase().chars() {
        if ch.is_ascii_lowercase() || ch.is_ascii_digit() {
            slug.push(ch);
        } else if !slug.ends_with('-') {
            slug.push('-');
        }
    }
    let slug = slug.trim_matches('-').to_owned();
    if slug.is_empty() {
        "workspace".to_owned()
    } else {
        slug
    }
}

/// `name`, or `name-2`, `name-3`, â€¦ whichever is free.
pub async fn unique_workspace_slug(db: &PgPool, input: &str) -> AppResult<String> {
    let base = slugify(input);
    let taken: HashSet<String> = sqlx::query_scalar("SELECT slug FROM workspaces WHERE slug = $1 OR slug LIKE $2")
        .bind(&base)
        .bind(format!("{base}-%"))
        .fetch_all(db)
        .await?
        .into_iter()
        .collect();

    if !taken.contains(&base) {
        return Ok(base);
    }
    let mut suffix = 2;
    while taken.contains(&format!("{base}-{suffix}")) {
        suffix += 1;
    }
    Ok(format!("{base}-{suffix}"))
}

async fn me(State(state): State<AppState>, ws: Ws) -> AppResult<Response> {
    let user: UserSummary = sqlx::query_as("SELECT id, email, full_name, job_title, avatar_url FROM users WHERE auth_user_id = $1 LIMIT 1")
        .bind(ws.auth_user_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::not_found("User not found"))?;
    let workspace: WorkspaceSummary = sqlx::query_as("SELECT id, name, slug FROM workspaces WHERE id = $1")
        .bind(ws.workspace_id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::not_found("Workspace not found"))?;

    Ok(ok(json!({ "user": user, "workspace": workspace, "membership": { "role": ws.role, "isActive": true } })))
}

async fn members(State(state): State<AppState>, ws: Ws) -> AppResult<Response> {
    Ok(ok(list_members(&state.db, ws.workspace_id).await?))
}

async fn list(State(state): State<AppState>, auth: Auth) -> AppResult<Response> {
    let user_id = user_id_for(&state.db, auth.auth_user_id).await?;
    let workspaces: Vec<Workspace> = sqlx::query_as(sql(format!(
        "SELECT {} FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = $1 ORDER BY m.joined_at",
        WORKSPACE_COLUMNS.split(", ").map(|c| format!("w.{c}")).collect::<Vec<_>>().join(", ")
    )))
    .bind(user_id)
    .fetch_all(&state.db)
    .await?;
    Ok(ok(workspaces))
}

#[derive(Deserialize)]
struct CreateWorkspace {
    name: String,
    slug: Option<String>,
}

async fn create(State(state): State<AppState>, auth: Auth, Body(payload): Body<CreateWorkspace>) -> AppResult<Response> {
    check_length(&payload.name, "name", 2, None)?;
    if let Some(slug) = &payload.slug {
        check_length(slug, "slug", 2, None)?;
    }

    let user_id = user_id_for(&state.db, auth.auth_user_id).await?;
    let slug_input = payload.slug.as_deref().map(str::trim).filter(|s| !s.is_empty()).unwrap_or(&payload.name);
    let slug = unique_workspace_slug(&state.db, slug_input).await?;

    let mut tx = state.db.begin().await?;
    let workspace: Workspace =
        sqlx::query_as(sql(format!("INSERT INTO workspaces (owner_id, name, slug) VALUES ($1, $2, $3) RETURNING {WORKSPACE_COLUMNS}")))
            .bind(user_id)
            .bind(&payload.name)
            .bind(&slug)
            .fetch_one(&mut *tx)
            .await?;
    sqlx::query("INSERT INTO workspace_members (user_id, workspace_id, role) VALUES ($1, $2, 'owner')")
        .bind(user_id)
        .bind(workspace.id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    Ok(created(workspace))
}

async fn switch(State(state): State<AppState>, auth: Auth, Path(id): Path<String>) -> AppResult<Response> {
    let user_id = user_id_for(&state.db, auth.auth_user_id).await?;
    let Ok(workspace_id) = Uuid::parse_str(&id) else {
        return Err(AppError::forbidden("No access to workspace"));
    };
    let member: Option<Uuid> = sqlx::query_scalar("SELECT user_id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2")
        .bind(workspace_id)
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?;
    if member.is_none() {
        return Err(AppError::forbidden("No access to workspace"));
    }
    Ok(ok(json!({ "workspaceId": workspace_id })))
}

#[derive(Deserialize)]
struct AddMember {
    email: String,
    role: Option<String>,
}

#[derive(Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
struct Invite {
    id: Uuid,
    workspace_id: Uuid,
    email: String,
    role: String,
    invited_by: Option<Uuid>,
    created_at: Ts,
}

const INVITE_COLUMNS: &str = "id, workspace_id, email, role::text AS role, invited_by, created_at";

async fn add_member(State(state): State<AppState>, ws: Ws, Body(payload): Body<AddMember>) -> AppResult<Response> {
    check_email(&payload.email)?;
    let role_name = payload.role.unwrap_or_else(|| "member".to_owned());
    check_choice(&role_name, "role", &MEMBER_ROLES)?;
    let role: Role = role_name.parse().map_err(AppError::BadRequest)?;

    if !can_add_workspace_member(ws.role, role) {
        return Err(AppError::forbidden("You do not have permission to add members"));
    }

    let target: Option<UserSummary> = sqlx::query_as("SELECT id, email, full_name, job_title, avatar_url FROM users WHERE email = $1 LIMIT 1")
        .bind(&payload.email)
        .fetch_optional(&state.db)
        .await?;

    let Some(target) = target else {
        // No account yet: keep a pending invite for this email.
        let invite: Invite = sqlx::query_as(sql(format!(
            "INSERT INTO workspace_invites (workspace_id, email, role, invited_by) VALUES ($1, $2, $3::member_role, $4)
             ON CONFLICT (workspace_id, email) DO UPDATE SET role = EXCLUDED.role
             RETURNING {INVITE_COLUMNS}"
        )))
        .bind(ws.workspace_id)
        .bind(payload.email.trim().to_lowercase())
        .bind(role.as_str())
        .bind(ws.user_id)
        .fetch_one(&state.db)
        .await?;
        return Ok(data(StatusCode::ACCEPTED, json!({ "invite": invite })));
    };

    let membership: Membership = sqlx::query_as(sql(format!(
        "INSERT INTO workspace_members (workspace_id, user_id, role, is_active) VALUES ($1, $2, $3::member_role, true)
         ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role, is_active = true
         RETURNING {MEMBERSHIP_COLUMNS}"
    )))
    .bind(ws.workspace_id)
    .bind(target.id)
    .bind(role.as_str())
    .fetch_one(&state.db)
    .await?;

    Ok(created(json!({ "user": target, "membership": membership })))
}

async fn invites(State(state): State<AppState>, ws: Ws) -> AppResult<Response> {
    if !can_manage_workspace_member(ws.role) {
        return Err(AppError::forbidden("You do not have permission to view invites"));
    }
    let invites: Vec<Invite> = sqlx::query_as(sql(format!("SELECT {INVITE_COLUMNS} FROM workspace_invites WHERE workspace_id = $1 ORDER BY created_at")))
        .bind(ws.workspace_id)
        .fetch_all(&state.db)
        .await?;
    Ok(ok(invites))
}

async fn revoke_invite(State(state): State<AppState>, ws: Ws, Path(id): Path<String>) -> AppResult<Response> {
    if !can_manage_workspace_member(ws.role) {
        return Err(AppError::forbidden("You do not have permission to revoke invites"));
    }
    let id = parse_id(&id, "Invite not found")?;
    let revoked = sqlx::query("DELETE FROM workspace_invites WHERE id = $1 AND workspace_id = $2")
        .bind(id)
        .bind(ws.workspace_id)
        .execute(&state.db)
        .await?;
    if revoked.rows_affected() == 0 {
        return Err(AppError::not_found("Invite not found"));
    }
    Ok(no_content())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateMember {
    role: Option<String>,
    is_active: Option<bool>,
}

async fn current_member_role(db: &PgPool, workspace_id: Uuid, user_id: Uuid) -> AppResult<(Role, bool)> {
    let row: Option<(String, bool)> =
        sqlx::query_as("SELECT role::text, is_active FROM workspace_members WHERE workspace_id = $1 AND user_id = $2")
            .bind(workspace_id)
            .bind(user_id)
            .fetch_optional(db)
            .await?;
    let (role, active) = row.ok_or_else(|| AppError::not_found("Member not found"))?;
    Ok((role.parse().map_err(|e: String| AppError::Internal(anyhow::anyhow!(e)))?, active))
}

async fn update_member(
    State(state): State<AppState>,
    ws: Ws,
    Path(target): Path<String>,
    Body(payload): Body<UpdateMember>,
) -> AppResult<Response> {
    if payload.role.is_none() && payload.is_active.is_none() {
        return Err(AppError::bad_request("At least one field must be provided"));
    }
    let requested_role: Option<Role> = match &payload.role {
        Some(role) => {
            check_choice(role, "role", &MEMBER_ROLES)?;
            Some(role.parse().map_err(AppError::BadRequest)?)
        }
        None => None,
    };

    let target = parse_id(&target, "Member not found")?;
    let (current_role, current_active) = current_member_role(&state.db, ws.workspace_id, target).await?;

    if let Some(requested) = requested_role {
        if !can_update_workspace_member_role(ws.role, current_role, requested) {
            return Err(AppError::forbidden("You do not have permission to change this member role"));
        }
    }
    if payload.is_active == Some(false) && !can_deactivate_workspace_member(ws.role, current_role, ws.user_id, target) {
        return Err(AppError::forbidden("You do not have permission to remove this member"));
    }
    if payload.is_active == Some(true) && !can_manage_workspace_member(ws.role) {
        return Err(AppError::forbidden("You do not have permission to reactivate this member"));
    }

    let updated: Membership = sqlx::query_as(sql(format!(
        "UPDATE workspace_members SET role = $3::member_role, is_active = $4 WHERE workspace_id = $1 AND user_id = $2 RETURNING {MEMBERSHIP_COLUMNS}"
    )))
    .bind(ws.workspace_id)
    .bind(target)
    .bind(requested_role.unwrap_or(current_role).as_str())
    .bind(payload.is_active.unwrap_or(current_active))
    .fetch_one(&state.db)
    .await?;

    Ok(ok(updated))
}

async fn remove_member(State(state): State<AppState>, ws: Ws, Path(target): Path<String>) -> AppResult<Response> {
    let target = parse_id(&target, "Member not found")?;
    let (current_role, _) = current_member_role(&state.db, ws.workspace_id, target).await?;

    if !can_deactivate_workspace_member(ws.role, current_role, ws.user_id, target) {
        return Err(AppError::forbidden("You do not have permission to remove this member"));
    }

    let updated: Membership = sqlx::query_as(sql(format!(
        "UPDATE workspace_members SET is_active = false WHERE workspace_id = $1 AND user_id = $2 RETURNING {MEMBERSHIP_COLUMNS}"
    )))
    .bind(ws.workspace_id)
    .bind(target)
    .fetch_one(&state.db)
    .await?;

    Ok(ok(updated))
}

async fn delete_workspace(State(state): State<AppState>, ws: Ws) -> AppResult<Response> {
    if !can_delete_workspace(ws.role) {
        return Err(AppError::forbidden("You do not have permission to delete this workspace"));
    }
    let deleted = sqlx::query("DELETE FROM workspaces WHERE id = $1").bind(ws.workspace_id).execute(&state.db).await?;
    if deleted.rows_affected() == 0 {
        return Err(AppError::not_found("Workspace not found"));
    }
    Ok(no_content())
}

#[cfg(test)]
mod tests {
    use super::slugify;

    #[test]
    fn slugs() {
        assert_eq!(slugify("  My Team!! Space "), "my-team-space");
        assert_eq!(slugify("***"), "workspace");
        assert_eq!(slugify("a--b"), "a-b");
    }
}
