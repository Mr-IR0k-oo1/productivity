//! Standalone Orbit API for the web app and local development.
//!
//! Uses DATABASE_URL when set; otherwise starts the embedded Postgres server under
//! ORBIT_DATA_DIR (default `.orbit-data`). Listens on API_HOST:API_PORT (127.0.0.1:8787).

use anyhow::Context;
use orbit_server::embedded::EmbeddedPostgres;
use orbit_server::{db, router, AppState, Config};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    let config = Config::from_env()?;

    let embedded = match &config.database_url {
        Some(_) => None,
        None => Some(EmbeddedPostgres::start(&config.data_dir).await?),
    };
    let url = config.database_url.clone().or_else(|| embedded.as_ref().map(|pg| pg.url().to_owned())).expect("a database URL");
    let pool = db::prepare(&url).await?;

    let address = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&address).await.with_context(|| format!("could not listen on {address}"))?;
    tracing::info!(
        "Orbit API running on http://{address} ({})",
        if embedded.is_some() { "embedded database" } else { "external database" }
    );

    axum::serve(listener, router(AppState::new(pool, config)))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;

    if let Some(pg) = embedded {
        pg.stop().await?;
    }
    Ok(())
}
