//! Small helpers shared by the route modules.

use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{FromRequest, FromRequestParts, Request};
use axum::http::request::Parts;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::{DateTime, Utc};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Deserializer, Serialize};
use serde_json::json;
use uuid::Uuid;

use crate::error::AppError;

/// A JSON request body. Malformed bodies get a `400 { error }` like every other failure.
pub struct Body<T>(pub T);

impl<S, T> FromRequest<S> for Body<T>
where
    T: DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        match Json::<T>::from_request(req, state).await {
            Ok(Json(value)) => Ok(Body(value)),
            Err(JsonRejection::JsonDataError(error)) => Err(AppError::bad_request(format!("Invalid request: {}", error.body_text()))),
            Err(error) => Err(AppError::bad_request(error.body_text())),
        }
    }
}

/// Query-string parameters, with the same error shape as [`Body`].
pub struct QueryParams<T>(pub T);

impl<S, T> FromRequestParts<S> for QueryParams<T>
where
    T: DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        axum::extract::Query::<T>::from_request_parts(parts, state)
            .await
            .map(|axum::extract::Query(value)| QueryParams(value))
            .map_err(|error: QueryRejection| AppError::bad_request(format!("Invalid query: {}", error.body_text())))
    }
}

/// SQL assembled from fixed fragments (column lists, table names) chosen in code, never from
/// request input. User values are always bound as parameters.
pub fn sql(query: String) -> sqlx::AssertSqlSafe<String> {
    sqlx::AssertSqlSafe(query)
}

/// `{ "data": … }` with a status code.
pub fn data<T: Serialize>(status: StatusCode, value: T) -> Response {
    (status, Json(json!({ "data": value }))).into_response()
}

pub fn ok<T: Serialize>(value: T) -> Response {
    data(StatusCode::OK, value)
}

pub fn created<T: Serialize>(value: T) -> Response {
    data(StatusCode::CREATED, value)
}

pub fn no_content() -> Response {
    StatusCode::NO_CONTENT.into_response()
}

/// Parses a path id. Ids that aren't UUIDs can't exist, so they are reported as not found.
pub fn parse_id(value: &str, not_found: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(value).map_err(|_| AppError::not_found(not_found))
}

/// For PATCH bodies: distinguishes a missing field (`None`) from an explicit `null`
/// (`Some(None)`). Use with `#[serde(default, deserialize_with = "nullable")]`.
pub fn nullable<'de, T, D>(deserializer: D) -> Result<Option<Option<T>>, D::Error>
where
    T: Deserialize<'de>,
    D: Deserializer<'de>,
{
    Option::<T>::deserialize(deserializer).map(Some)
}

/// An ISO 8601 / RFC 3339 timestamp, e.g. `2026-10-31T09:00:00.000Z`.
pub fn parse_datetime(value: &str, field: &str) -> Result<DateTime<Utc>, AppError> {
    DateTime::parse_from_rfc3339(value)
        .map(|value| value.with_timezone(&Utc))
        .map_err(|_| AppError::bad_request(format!("{field} must be an ISO 8601 date-time")))
}

pub fn parse_optional_datetime(value: Option<&str>, field: &str) -> Result<Option<DateTime<Utc>>, AppError> {
    value.map(|value| parse_datetime(value, field)).transpose()
}

/// Checks a string length in characters (not bytes), like zod's `.min()` / `.max()`.
pub fn check_length(value: &str, field: &str, min: usize, max: Option<usize>) -> Result<(), AppError> {
    let length = value.chars().count();
    if length < min {
        return Err(AppError::bad_request(format!("{field} must be at least {min} characters")));
    }
    if let Some(max) = max {
        if length > max {
            return Err(AppError::bad_request(format!("{field} must be at most {max} characters")));
        }
    }
    Ok(())
}

pub fn check_range(value: i64, field: &str, min: i64, max: i64) -> Result<(), AppError> {
    if value < min || value > max {
        return Err(AppError::bad_request(format!("{field} must be between {min} and {max}")));
    }
    Ok(())
}

/// Checks that `value` is one of `allowed` (for Postgres enum columns and fixed choices).
pub fn check_choice(value: &str, field: &str, allowed: &[&str]) -> Result<(), AppError> {
    if allowed.contains(&value) {
        Ok(())
    } else {
        Err(AppError::bad_request(format!("{field} must be one of: {}", allowed.join(", "))))
    }
}

/// A loose email check (something@something.tld), like zod's `.email()`.
pub fn check_email(value: &str) -> Result<(), AppError> {
    let valid = value.split_once('@').is_some_and(|(local, domain)| {
        !local.is_empty() && !domain.starts_with('.') && domain.contains('.') && !domain.ends_with('.') && !value.contains(char::is_whitespace)
    });
    if valid {
        Ok(())
    } else {
        Err(AppError::bad_request("email must be a valid email address"))
    }
}

/// Escapes LIKE wildcards so a search for "50%" matches literally, and wraps for a contains match.
pub fn like_pattern(query: &str) -> String {
    let mut pattern = String::with_capacity(query.len() + 2);
    pattern.push('%');
    for ch in query.chars() {
        if matches!(ch, '\\' | '%' | '_') {
            pattern.push('\\');
        }
        pattern.push(ch);
    }
    pattern.push('%');
    pattern
}

pub fn status_error(status: StatusCode, message: impl Into<String>) -> AppError {
    AppError::Status(status, message.into())
}

pub const TASK_STATUSES: [&str; 4] = ["todo", "in_progress", "review", "done"];
pub const ISSUE_TYPES: [&str; 4] = ["epic", "story", "task", "bug"];
pub const MEMBER_ROLES: [&str; 4] = ["owner", "admin", "member", "viewer"];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn like_pattern_escapes_wildcards() {
        assert_eq!(like_pattern("50%"), "%50\\%%");
        assert_eq!(like_pattern("a_b"), "%a\\_b%");
        assert_eq!(like_pattern("back\\slash"), "%back\\\\slash%");
        assert_eq!(like_pattern("plain"), "%plain%");
    }

    #[test]
    fn email_check() {
        assert!(check_email("a@b.co").is_ok());
        assert!(check_email("no-at.example.com").is_err());
        assert!(check_email("a@nodot").is_err());
        assert!(check_email("a b@c.com").is_err());
    }

    #[test]
    fn length_counts_characters() {
        assert!(check_length("éé", "name", 2, Some(2)).is_ok());
        assert!(check_length("é", "name", 2, None).is_err());
    }

    #[test]
    fn nullable_distinguishes_missing_from_null() {
        #[derive(Deserialize)]
        struct Patch {
            #[serde(default, deserialize_with = "nullable")]
            value: Option<Option<String>>,
        }
        let missing: Patch = serde_json::from_str("{}").unwrap();
        let null: Patch = serde_json::from_str(r#"{"value":null}"#).unwrap();
        let set: Patch = serde_json::from_str(r#"{"value":"x"}"#).unwrap();
        assert_eq!(missing.value, None);
        assert_eq!(null.value, Some(None));
        assert_eq!(set.value, Some(Some("x".into())));
    }
}

/// A `timestamptz` that serializes like JavaScript's `Date#toJSON`:
/// `2026-10-31T09:00:00.123Z` (millisecond precision), as the previous API returned.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, sqlx::Type)]
#[sqlx(transparent)]
pub struct Ts(pub DateTime<Utc>);

impl Serialize for Ts {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&crate::task_metadata::iso(self.0))
    }
}

impl From<DateTime<Utc>> for Ts {
    fn from(value: DateTime<Utc>) -> Self {
        Ts(value)
    }
}
