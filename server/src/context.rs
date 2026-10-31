//! Who is making a request, and in which workspace.
//!
//! [`Auth`] resolves the caller: the owner of an API key (`Authorization: Bearer orb_…`),
//! otherwise the built-in local user. [`Ws`] adds the workspace (from `x-workspace-id`,
//! falling back to the caller's first workspace) and the caller's role in it, and rejects
//! writes the role doesn't allow.

use axum::extract::{FromRequestParts, OriginalUri};
use axum::http::request::Parts;
use axum::http::StatusCode;
use chrono::{DateTime, Utc};
use rand::RngExt;
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::db::LOCAL_AUTH_USER_ID;
use crate::error::AppError;
use crate::lib_util::status_error;
use crate::permissions::{is_read_method, is_write_allowed_for_role, Role};
use crate::AppState;

// ---------------------------------------------------------------- API keys

/// Every Orbit key starts with this, so secret scanners and people can recognise it.
pub const API_KEY_PREFIX: &str = "orb_";
const KEY_BODY_LENGTH: usize = 40;
const ALPHABET: &[u8; 62] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
/// Last-used timestamps are written at most this often, to avoid a write on every request.
const LAST_USED_WRITE_INTERVAL_SECS: i64 = 60;

/// SHA-256 is enough here: keys carry 238 bits of randomness, so there's nothing to brute-force.
pub fn hash_api_key(key: &str) -> String {
    hex::encode(Sha256::digest(key.as_bytes()))
}

pub struct GeneratedKey {
    /// Shown to the person once; never stored.
    pub key: String,
    pub hash: String,
    pub prefix: String,
}

pub fn generate_api_key() -> GeneratedKey {
    let mut rng = rand::rng();
    let mut body = String::with_capacity(KEY_BODY_LENGTH);
    while body.len() < KEY_BODY_LENGTH {
        // Rejection sampling keeps every character equally likely (256 isn't a multiple of 62).
        let byte: u8 = rng.random();
        if byte < 248 {
            body.push(ALPHABET[usize::from(byte) % ALPHABET.len()] as char);
        }
    }
    let key = format!("{API_KEY_PREFIX}{body}");
    GeneratedKey { hash: hash_api_key(&key), prefix: key[..API_KEY_PREFIX.len() + 6].to_owned(), key }
}

pub fn is_api_key_format(value: &str) -> bool {
    value
        .strip_prefix(API_KEY_PREFIX)
        .is_some_and(|body| body.len() == KEY_BODY_LENGTH && body.bytes().all(|b| b.is_ascii_alphanumeric()))
}

/// The API key from an `Authorization: Bearer orb_…` header, or None for anything else.
pub fn read_api_key_from_header(header: Option<&str>) -> Option<&str> {
    let header = header?.trim();
    let (scheme, token) = header.split_once(char::is_whitespace)?;
    let token = token.trim_start();
    if !scheme.eq_ignore_ascii_case("bearer") || token.contains(char::is_whitespace) {
        return None;
    }
    is_api_key_format(token).then_some(token)
}

/// Read keys may only read; write keys may do whatever the owner's role allows.
pub fn is_method_allowed_for_scope(scope: &str, method: &str) -> bool {
    scope == "write" || is_read_method(method)
}

/// Why a stored key can't be used right now, or None when it can.
pub fn api_key_unusable_reason(
    revoked_at: Option<DateTime<Utc>>,
    expires_at: Option<DateTime<Utc>>,
    now: DateTime<Utc>,
) -> Option<&'static str> {
    if revoked_at.is_some() {
        return Some("revoked");
    }
    if expires_at.is_some_and(|expires| expires <= now) {
        return Some("expired");
    }
    None
}

/// Paths an API key may never call: managing keys, and the auth endpoints.
pub fn is_path_blocked_for_api_keys(path: &str) -> bool {
    path.starts_with("/api/api-keys") || path.starts_with("/api/auth")
}

pub fn should_record_last_used(last_used_at: Option<DateTime<Utc>>, now: DateTime<Utc>) -> bool {
    last_used_at.is_none_or(|last| (now - last).num_seconds() >= LAST_USED_WRITE_INTERVAL_SECS)
}

// ---------------------------------------------------------------- extractors

#[derive(Debug, Clone)]
pub struct ApiKeyContext {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub scope: String,
}

/// The caller.
#[derive(Debug, Clone)]
pub struct Auth {
    pub auth_user_id: Uuid,
    pub api_key: Option<ApiKeyContext>,
}

/// The caller, their workspace, and their role in it.
#[derive(Debug, Clone)]
pub struct Ws {
    pub auth_user_id: Uuid,
    /// `users.id` (not the auth id).
    pub user_id: Uuid,
    pub workspace_id: Uuid,
    pub role: Role,
    pub api_key: Option<ApiKeyContext>,
}

/// The full request path, including the `/api` prefix that nested routers strip.
fn full_path(parts: &Parts) -> String {
    parts
        .extensions
        .get::<OriginalUri>()
        .map(|uri| uri.0.path().to_owned())
        .unwrap_or_else(|| parts.uri.path().to_owned())
}

#[derive(sqlx::FromRow)]
struct StoredKey {
    id: Uuid,
    workspace_id: Uuid,
    scope: String,
    revoked_at: Option<DateTime<Utc>>,
    expires_at: Option<DateTime<Utc>>,
    last_used_at: Option<DateTime<Utc>>,
    auth_user_id: Uuid,
}

/// The built-in local user, or the first user of an existing database. Cached once found.
pub async fn resolve_local_auth_user_id(state: &AppState) -> Result<Option<Uuid>, AppError> {
    if let Some(id) = *state.local_auth_user.read().await {
        return Ok(Some(id));
    }

    let local: Option<Uuid> = sqlx::query_scalar("SELECT auth_user_id FROM users WHERE auth_user_id = $1 LIMIT 1")
        .bind(LOCAL_AUTH_USER_ID)
        .fetch_optional(&state.db)
        .await?;
    let resolved = match local {
        Some(id) => Some(id),
        None => sqlx::query_scalar("SELECT auth_user_id FROM users ORDER BY created_at LIMIT 1").fetch_optional(&state.db).await?,
    };

    if let Some(id) = resolved {
        *state.local_auth_user.write().await = Some(id);
    }
    Ok(resolved)
}

impl FromRequestParts<AppState> for Auth {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        if let Some(auth) = parts.extensions.get::<Auth>() {
            return Ok(auth.clone());
        }

        let header = parts.headers.get(axum::http::header::AUTHORIZATION).and_then(|value| value.to_str().ok());
        let auth = match read_api_key_from_header(header) {
            Some(raw_key) => authenticate_api_key(state, raw_key, &full_path(parts)).await?,
            None => {
                let auth_user_id = resolve_local_auth_user_id(state).await?.ok_or_else(|| {
                    status_error(StatusCode::INTERNAL_SERVER_ERROR, "No local user exists yet. Restart the API to create one.")
                })?;
                Auth { auth_user_id, api_key: None }
            }
        };

        parts.extensions.insert(auth.clone());
        Ok(auth)
    }
}

async fn authenticate_api_key(state: &AppState, raw_key: &str, path: &str) -> Result<Auth, AppError> {
    if is_path_blocked_for_api_keys(path) {
        return Err(AppError::forbidden("API keys can't be used for this endpoint"));
    }

    let key: Option<StoredKey> = sqlx::query_as(
        "SELECT k.id, k.workspace_id, k.scope::text AS scope, k.revoked_at, k.expires_at, k.last_used_at, u.auth_user_id
         FROM api_keys k JOIN users u ON u.id = k.user_id
         WHERE k.key_hash = $1 LIMIT 1",
    )
    .bind(hash_api_key(raw_key))
    .fetch_optional(&state.db)
    .await?;

    let now = Utc::now();
    let Some(key) = key.filter(|key| api_key_unusable_reason(key.revoked_at, key.expires_at, now).is_none()) else {
        return Err(status_error(StatusCode::UNAUTHORIZED, "Invalid, expired or revoked API key"));
    };

    if should_record_last_used(key.last_used_at, now) {
        // Best effort: a failed timestamp write must not fail the request.
        let pool = state.db.clone();
        let id = key.id;
        tokio::spawn(async move {
            let _ = sqlx::query("UPDATE api_keys SET last_used_at = now() WHERE id = $1").bind(id).execute(&pool).await;
        });
    }

    Ok(Auth {
        auth_user_id: key.auth_user_id,
        api_key: Some(ApiKeyContext { id: key.id, workspace_id: key.workspace_id, scope: key.scope }),
    })
}

#[derive(sqlx::FromRow)]
struct Membership {
    workspace_id: Uuid,
    role: String,
    is_active: bool,
}

async fn membership(state: &AppState, workspace_id: Uuid, user_id: Uuid) -> Result<Option<Membership>, AppError> {
    Ok(sqlx::query_as(
        "SELECT workspace_id, role::text AS role, is_active FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 LIMIT 1",
    )
    .bind(workspace_id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?)
}

fn parse_role(value: &str) -> Result<Role, AppError> {
    value.parse().map_err(|error: String| AppError::Internal(anyhow::anyhow!(error)))
}

impl FromRequestParts<AppState> for Ws {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        if let Some(ws) = parts.extensions.get::<Ws>() {
            return Ok(ws.clone());
        }

        let auth = Auth::from_request_parts(parts, state).await?;
        let method = parts.method.as_str().to_owned();
        let path = full_path(parts);
        let requested = parts
            .headers
            .get("x-workspace-id")
            .and_then(|value| value.to_str().ok())
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_owned);

        let user_id: Uuid = sqlx::query_scalar("SELECT id FROM users WHERE auth_user_id = $1 LIMIT 1")
            .bind(auth.auth_user_id)
            .fetch_optional(&state.db)
            .await?
            .ok_or_else(|| AppError::not_found("User not found"))?;

        let resolved = if let Some(key) = &auth.api_key {
            // A key is pinned to the workspace it was created in, and a read key can only read.
            if requested.as_deref().is_some_and(|id| id != key.workspace_id.to_string()) {
                return Err(AppError::forbidden("This API key belongs to a different workspace"));
            }
            if !is_method_allowed_for_scope(&key.scope, &method) {
                return Err(AppError::forbidden("This API key is read-only"));
            }
            // Leaving the workspace switches the key off, even before it is revoked.
            membership(state, key.workspace_id, user_id)
                .await?
                .filter(|m| m.is_active)
                .ok_or_else(|| AppError::forbidden("Workspace membership required"))?
        } else {
            let requested_member = match requested.as_deref().and_then(|id| Uuid::parse_str(id).ok()) {
                Some(workspace_id) => membership(state, workspace_id, user_id).await?.filter(|m| m.is_active),
                None => None,
            };
            match requested_member {
                Some(member) => member,
                // No (usable) workspace header: fall back to the caller's first workspace.
                None => sqlx::query_as(
                    "SELECT workspace_id, role::text AS role, is_active FROM workspace_members
                     WHERE user_id = $1 AND is_active = true ORDER BY joined_at LIMIT 1",
                )
                .bind(user_id)
                .fetch_optional(&state.db)
                .await?
                .ok_or_else(|| AppError::forbidden("Workspace membership required"))?,
            }
        };

        let role = parse_role(&resolved.role)?;
        if !is_write_allowed_for_role(role, &method, &path) {
            return Err(AppError::forbidden("You have read-only access to this workspace"));
        }

        let ws = Ws { auth_user_id: auth.auth_user_id, user_id, workspace_id: resolved.workspace_id, role, api_key: auth.api_key };
        parts.extensions.insert(ws.clone());
        Ok(ws)
    }
}

impl Ws {
    /// Rejects the request unless the role has `permission`.
    pub fn require(&self, permission: crate::permissions::Permission) -> Result<(), AppError> {
        if crate::permissions::can(Some(self.role), permission) {
            Ok(())
        } else {
            Err(AppError::forbidden("You don't have permission to do that in this workspace"))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    #[test]
    fn generated_keys_have_the_expected_shape() {
        let generated = generate_api_key();
        assert!(is_api_key_format(&generated.key));
        assert_eq!(generated.prefix, &generated.key[..10]);
        assert_eq!(generated.hash, hash_api_key(&generated.key));
        assert_eq!(generated.hash.len(), 64);
        assert_ne!(generate_api_key().key, generated.key);
    }

    #[test]
    fn hashing_is_sha256_hex() {
        assert_eq!(hash_api_key("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    #[test]
    fn reads_bearer_keys_only() {
        let key = format!("orb_{}", "a".repeat(40));
        assert_eq!(read_api_key_from_header(Some(&format!("Bearer {key}"))), Some(key.as_str()));
        assert_eq!(read_api_key_from_header(Some(&format!("bearer   {key}"))), Some(key.as_str()));
        assert_eq!(read_api_key_from_header(Some("Bearer session")), None);
        assert_eq!(read_api_key_from_header(Some(&format!("Basic {key}"))), None);
        assert_eq!(read_api_key_from_header(Some(&format!("orb_{}", "a".repeat(39)))), None);
        assert_eq!(read_api_key_from_header(None), None);
    }

    #[test]
    fn scope_and_usability_rules() {
        assert!(is_method_allowed_for_scope("read", "GET"));
        assert!(!is_method_allowed_for_scope("read", "POST"));
        assert!(is_method_allowed_for_scope("write", "DELETE"));

        let now = Utc::now();
        assert_eq!(api_key_unusable_reason(Some(now), None, now), Some("revoked"));
        assert_eq!(api_key_unusable_reason(None, Some(now), now), Some("expired"));
        assert_eq!(api_key_unusable_reason(None, Some(now + Duration::hours(1)), now), None);

        assert!(should_record_last_used(None, now));
        assert!(!should_record_last_used(Some(now - Duration::seconds(30)), now));
        assert!(should_record_last_used(Some(now - Duration::seconds(60)), now));

        assert!(is_path_blocked_for_api_keys("/api/api-keys"));
        assert!(is_path_blocked_for_api_keys("/api/auth/session"));
        assert!(!is_path_blocked_for_api_keys("/api/tasks"));
    }
}
