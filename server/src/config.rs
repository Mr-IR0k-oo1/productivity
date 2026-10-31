use std::path::PathBuf;

use anyhow::{bail, Context};

/// Settings read from the environment (and `.env.local` / `.env` outside production).
#[derive(Debug, Clone)]
pub struct Config {
    /// External Postgres. When unset, the embedded server is used (`embedded` feature).
    pub database_url: Option<String>,
    /// Embedded database and uploads live here.
    pub data_dir: PathBuf,
    /// Browser origins allowed to call the API (CORS).
    pub allowed_origins: Vec<String>,
    pub host: String,
    pub port: u16,
}

/// Origins the Tauri webview loads the app from (macOS/Linux and Windows).
const DESKTOP_ORIGINS: [&str; 3] = ["tauri://localhost", "http://tauri.localhost", "https://tauri.localhost"];

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        if std::env::var("NODE_ENV").as_deref() != Ok("production") && std::env::var("VERCEL").is_err() {
            // Same precedence as Next.js: .env.local wins over .env; real env vars win over both.
            let _ = dotenvy::from_filename(".env.local");
            let _ = dotenvy::from_filename(".env");
        }

        let database_url = read("DATABASE_URL");
        if let Some(url) = &database_url {
            validate_database_url(url)?;
        }

        let app_url = resolve_app_url();
        let mut allowed_origins = vec![app_url];
        allowed_origins.extend(DESKTOP_ORIGINS.iter().map(|origin| (*origin).to_owned()));
        if let Some(extra) = read("ORBIT_ALLOWED_ORIGINS") {
            allowed_origins.extend(extra.split(',').map(str::trim).filter(|o| !o.is_empty()).map(str::to_owned));
        }

        let port = match read("API_PORT") {
            Some(value) => value.parse().with_context(|| format!("API_PORT must be a port number, got {value:?}"))?,
            None => 8787,
        };

        Ok(Self {
            database_url,
            data_dir: PathBuf::from(read("ORBIT_DATA_DIR").unwrap_or_else(|| ".orbit-data".to_owned())),
            allowed_origins,
            // Loopback only by default: the API has no login.
            host: read("API_HOST").unwrap_or_else(|| "127.0.0.1".to_owned()),
            port,
        })
    }
}

fn read(name: &str) -> Option<String> {
    std::env::var(name).ok().map(|v| v.trim().to_owned()).filter(|v| !v.is_empty())
}

fn is_localhost(url: &str) -> bool {
    ["//localhost", "//127.0.0.1", "//0.0.0.0"].iter().any(|host| url.contains(host))
}

/// APP_URL, or NEXT_PUBLIC_APP_URL when APP_URL is a localhost leftover in a deployed environment.
fn resolve_app_url() -> String {
    let app_url = read("APP_URL");
    let public_url = read("NEXT_PUBLIC_APP_URL");

    let url = match (app_url, public_url) {
        (Some(app), Some(public)) if is_localhost(&app) && !is_localhost(&public) => public,
        (Some(app), _) => app,
        (None, Some(public)) => public,
        (None, None) => "http://localhost:3000".to_owned(),
    };

    url.trim_end_matches('/').to_owned()
}

fn validate_database_url(url: &str) -> anyhow::Result<()> {
    if url.to_ascii_lowercase().starts_with("database_url=") {
        bail!("DATABASE_URL must be value-only (remove the DATABASE_URL= prefix)");
    }
    if (url.starts_with('"') && url.ends_with('"')) || (url.starts_with('\'') && url.ends_with('\'')) {
        bail!("DATABASE_URL must not be wrapped in quotes");
    }
    if !(url.starts_with("postgres://") || url.starts_with("postgresql://")) {
        bail!("DATABASE_URL must be a postgres:// connection URL");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_malformed_database_urls() {
        assert!(validate_database_url("postgres://u:p@host/db").is_ok());
        assert!(validate_database_url("postgresql://u:p@host/db").is_ok());
        assert!(validate_database_url("DATABASE_URL=postgres://u@h/db").is_err());
        assert!(validate_database_url("\"postgres://u@h/db\"").is_err());
        assert!(validate_database_url("mysql://u@h/db").is_err());
    }

    #[test]
    fn detects_localhost_urls() {
        assert!(is_localhost("http://localhost:3000"));
        assert!(is_localhost("http://127.0.0.1:3000"));
        assert!(!is_localhost("https://orbit.example.com"));
    }
}
