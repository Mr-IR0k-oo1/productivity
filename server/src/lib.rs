//! Orbit API. One axum router serves the web app (standalone server or a Vercel function)
//! and the desktop app (started in-process by Tauri).
//!
//! There is no login: every request runs as the built-in local user, or as the owner of an
//! API key when the request carries `Authorization: Bearer orb_…`.

pub mod config;
pub mod context;
pub mod db;
#[cfg(feature = "embedded")]
pub mod embedded;
pub mod error;
pub mod lib_util;
pub mod permissions;
pub mod routes;
pub mod scrum;
pub mod task_metadata;
pub mod workspace_settings;

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use axum::extract::Request;
use axum::http::{header, HeaderValue, Method};
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::Router;
use sqlx::PgPool;
use tokio::sync::RwLock;
use tower_http::cors::{AllowOrigin, CorsLayer};
use uuid::Uuid;

pub use config::Config;

/// Shared by every request.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub config: Arc<Config>,
    /// The local user's auth id, looked up once (see `context::resolve_local_auth_user_id`).
    pub local_auth_user: Arc<RwLock<Option<Uuid>>>,
}

impl AppState {
    pub fn new(db: PgPool, config: Config) -> Self {
        Self { db, config: Arc::new(config), local_auth_user: Arc::new(RwLock::new(None)) }
    }

    /// Where uploaded files are kept.
    pub fn uploads_dir(&self) -> PathBuf {
        self.config.data_dir.join("uploads")
    }
}

/// The full API, mounted under `/api`.
pub fn router(state: AppState) -> Router {
    let cors = cors_layer(&state.config);

    Router::new()
        .route("/", axum::routing::get(|| async { axum::Json(serde_json::json!({ "ok": true, "service": "Orbit API" })) }))
        .nest("/api", routes::api_router())
        .fallback(|| async { error::AppError::not_found("Not found") })
        .layer(middleware::from_fn(log_request))
        .layer(cors)
        .with_state(state)
}

/// Only the configured web origin and the desktop shell may call the API from a browser.
/// The API has no login, so a permissive policy would let any website read local data.
fn cors_layer(config: &Config) -> CorsLayer {
    let origins: Vec<HeaderValue> = config.allowed_origins.iter().filter_map(|origin| origin.parse().ok()).collect();

    CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_credentials(true)
        .allow_methods([Method::GET, Method::HEAD, Method::POST, Method::PUT, Method::PATCH, Method::DELETE, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::HeaderName::from_static("x-workspace-id")])
}

/// One JSON line per request, like the previous API's logger.
async fn log_request(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let path = request.uri().path().to_owned();
    let started = Instant::now();
    let response = next.run(request).await;

    tracing::info!(
        target: "orbit::request",
        method = %method,
        path = %path,
        status = response.status().as_u16(),
        ms = started.elapsed().as_millis() as u64,
    );

    response
}
