use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use chrono::Utc;
use serde_json::json;

use crate::task_metadata::iso;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(liveness)).route("/db", get(database))
}

/// Basic liveness check.
async fn liveness() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok", "ts": iso(Utc::now()) }))
}

/// Checks database connectivity.
async fn database(State(state): State<AppState>) -> Response {
    match sqlx::query("SELECT 1").execute(&state.db).await {
        Ok(_) => Json(json!({ "status": "ok", "db": "connected", "ts": iso(Utc::now()) })).into_response(),
        Err(error) => {
            tracing::error!(%error, "health: database check failed");
            (StatusCode::SERVICE_UNAVAILABLE, Json(json!({ "status": "error", "db": "unreachable" }))).into_response()
        }
    }
}
