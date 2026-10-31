//! HTTP routes, mounted under `/api`. Response shapes match the previous TypeScript API:
//! `{ "data": … }` on success and `{ "error": "…" }` on failure, with camelCase fields.

use axum::Router;

use crate::AppState;

// pub mod api_keys;
// pub mod attachments;
pub mod auth;
// pub mod calendar;
// pub mod comments;
// pub mod flowcharts;
pub mod health;
// pub mod ideas;
pub mod models;
// pub mod notifications;
// pub mod profile;
// pub mod projects;
// pub mod reports;
// pub mod search;
// pub mod settings;
// pub mod sprints;
// pub mod subtasks;
// pub mod tags;
// pub mod tasks;
// pub mod time;
pub mod workspace;

pub fn api_router() -> Router<AppState> {
    Router::new()
        .nest("/health", health::router())
        .nest("/auth", auth::router())
        .nest("/workspace", workspace::router())
        // .nest("/settings", settings::router())
        // .nest("/ideas", ideas::router())
        // .nest("/tasks", tasks::router())
        // .nest("/calendar", calendar::router())
        // .nest("/time", time::router())
        // .nest("/reports", reports::router())
        // .nest("/projects", projects::router())
        // .nest("/tags", tags::router())
        // .nest("/subtasks", subtasks::router())
        // .nest("/comments", comments::router())
        // .nest("/attachments", attachments::router())
        // .nest("/flowcharts", flowcharts::router())
        // .nest("/sprints", sprints::router())
        // .nest("/profile", profile::router())
        // .nest("/api-keys", api_keys::router())
        // .nest("/notifications", notifications::router())
        // .nest("/search", search::router())
}
