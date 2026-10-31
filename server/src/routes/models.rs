//! Row types shared by several route modules. Field names serialize in camelCase, matching
//! what the previous API (drizzle) returned. Enum columns are selected as `::text`.

use crate::lib_util::Ts;
use serde::Serialize;
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub issue_key_prefix: String,
    pub issue_counter: i32,
    pub owner_id: Uuid,
    pub created_at: Ts,
    pub updated_at: Ts,
}

pub const WORKSPACE_COLUMNS: &str = "id, name, slug, issue_key_prefix, issue_counter, owner_id, created_at, updated_at";

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSummary {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct UserSummary {
    pub id: Uuid,
    pub email: String,
    pub full_name: Option<String>,
    pub job_title: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: Uuid,
    pub auth_user_id: Uuid,
    pub full_name: Option<String>,
    pub job_title: Option<String>,
    pub email: String,
    pub avatar_url: Option<String>,
    pub created_at: Ts,
    pub updated_at: Ts,
}

pub const PROFILE_COLUMNS: &str = "id, auth_user_id, full_name, job_title, email, avatar_url, created_at, updated_at";

/// A member as listed in settings and the members API: `{ user, role, isActive, joinedAt }`.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Member {
    pub user: UserSummary,
    pub role: String,
    pub is_active: bool,
    pub joined_at: Ts,
}

#[derive(FromRow)]
struct MemberRow {
    id: Uuid,
    email: String,
    full_name: Option<String>,
    job_title: Option<String>,
    avatar_url: Option<String>,
    role: String,
    is_active: bool,
    joined_at: Ts,
}

pub async fn list_members(db: &sqlx::PgPool, workspace_id: Uuid) -> sqlx::Result<Vec<Member>> {
    let rows: Vec<MemberRow> = sqlx::query_as(
        "SELECT u.id, u.email, u.full_name, u.job_title, u.avatar_url, m.role::text AS role, m.is_active, m.joined_at
         FROM workspace_members m JOIN users u ON u.id = m.user_id
         WHERE m.workspace_id = $1 ORDER BY m.joined_at",
    )
    .bind(workspace_id)
    .fetch_all(db)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| Member {
            user: UserSummary {
                id: row.id,
                email: row.email,
                full_name: row.full_name,
                job_title: row.job_title,
                avatar_url: row.avatar_url,
            },
            role: row.role,
            is_active: row.is_active,
            joined_at: row.joined_at,
        })
        .collect())
}

/// `workspace_members` as returned after an insert or update.
#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Membership {
    pub workspace_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub is_active: bool,
    pub joined_at: Ts,
}

pub const MEMBERSHIP_COLUMNS: &str = "workspace_id, user_id, role::text AS role, is_active, joined_at";

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub project_id: Option<Uuid>,
    pub idea_id: Option<Uuid>,
    pub creator_id: Uuid,
    pub assignee_id: Option<Uuid>,
    pub number: Option<i32>,
    pub issue_type: String,
    pub parent_id: Option<Uuid>,
    pub sprint_id: Option<Uuid>,
    pub story_points: Option<i32>,
    pub title: String,
    pub description: Option<Value>,
    pub status: String,
    pub priority: i32,
    pub due_date: Option<Ts>,
    pub started_at: Option<Ts>,
    pub completed_at: Option<Ts>,
    pub position: i32,
    pub metadata: Value,
    pub created_at: Ts,
    pub updated_at: Ts,
}

pub const TASK_COLUMNS: &str = "id, workspace_id, project_id, idea_id, creator_id, assignee_id, number, issue_type::text AS issue_type, \
     parent_id, sprint_id, story_points, title, description, status::text AS status, priority, due_date, started_at, completed_at, \
     position, metadata, created_at, updated_at";

/// `TASK_COLUMNS` qualified with a table alias, for joins.
pub fn task_columns(alias: &str) -> String {
    TASK_COLUMNS
        .split(", ")
        .map(|column| format!("{alias}.{column}"))
        .collect::<Vec<_>>()
        .join(", ")
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Sprint {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub name: String,
    pub goal: Option<String>,
    pub status: String,
    pub start_date: Option<Ts>,
    pub end_date: Option<Ts>,
    pub committed_points: Option<i32>,
    pub completed_points: Option<i32>,
    pub completed_at: Option<Ts>,
    pub created_at: Ts,
    pub updated_at: Ts,
}

pub const SPRINT_COLUMNS: &str = "id, workspace_id, name, goal, status::text AS status, start_date, end_date, committed_points, \
     completed_points, completed_at, created_at, updated_at";

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Comment {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub task_id: Option<Uuid>,
    pub idea_id: Option<Uuid>,
    pub parent_id: Option<Uuid>,
    pub author_id: Uuid,
    pub body: String,
    pub edited_at: Option<Ts>,
    pub created_at: Ts,
}

pub const COMMENT_COLUMNS: &str = "id, workspace_id, task_id, idea_id, parent_id, author_id, body, edited_at, created_at";
