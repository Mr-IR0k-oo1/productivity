//! There is no login: every request runs as the local user. The UI asks for the session
//! only to learn that user's id.

use axum::response::Response;
use axum::routing::get;
use axum::Router;
use serde_json::json;

use crate::context::Auth;
use crate::lib_util::ok;
use crate::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/session", get(session))
}

async fn session(auth: Auth) -> Response {
    ok(json!({ "authUserId": auth.auth_user_id }))
}
