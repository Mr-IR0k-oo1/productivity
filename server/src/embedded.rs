//! A private Postgres server for the desktop app and local development, used when
//! DATABASE_URL is not set. The first start downloads the Postgres binaries into the data
//! directory; later starts reuse them and the existing data.

use std::path::Path;

use anyhow::Context;
use postgresql_embedded::{PostgreSQL, Settings, VersionReq};
use rand::distr::{Alphanumeric, SampleString};

const DATABASE_NAME: &str = "orbit";

/// Keeps the server running; it is stopped when this is dropped.
pub struct EmbeddedPostgres {
    server: PostgreSQL,
    url: String,
}

impl EmbeddedPostgres {
    pub async fn start(data_dir: &Path) -> anyhow::Result<Self> {
        let root = std::path::absolute(data_dir.join("postgres")).context("invalid ORBIT_DATA_DIR")?;
        std::fs::create_dir_all(&root).with_context(|| format!("could not create {}", root.display()))?;

        let settings = Settings {
            version: VersionReq::parse("=17").expect("valid version requirement"),
            installation_dir: root.join("install"),
            data_dir: root.join("data"),
            password_file: root.join(".pgpass"),
            password: stored_password(&root)?,
            host: "127.0.0.1".to_owned(),
            temporary: false,
            timeout: Some(std::time::Duration::from_secs(60)),
            ..Settings::default()
        };

        let mut server = PostgreSQL::new(settings);
        server.setup().await.context("could not install the embedded Postgres server")?;
        server.start().await.context("could not start the embedded Postgres server")?;

        if !server.database_exists(DATABASE_NAME).await? {
            server.create_database(DATABASE_NAME).await?;
        }

        let url = server.settings().url(DATABASE_NAME);
        tracing::info!(dir = %root.display(), "embedded Postgres ready");
        Ok(Self { server, url })
    }

    pub fn url(&self) -> &str {
        &self.url
    }

    pub async fn stop(self) -> anyhow::Result<()> {
        self.server.stop().await.context("could not stop the embedded Postgres server")
    }
}

/// The superuser password is chosen once and kept next to the data, since the data
/// directory is initialised with it.
fn stored_password(root: &Path) -> anyhow::Result<String> {
    let path = root.join("password");
    if let Ok(existing) = std::fs::read_to_string(&path) {
        let existing = existing.trim();
        if !existing.is_empty() {
            return Ok(existing.to_owned());
        }
    }

    let password = Alphanumeric.sample_string(&mut rand::rng(), 32);
    std::fs::write(&path, &password).with_context(|| format!("could not write {}", path.display()))?;
    Ok(password)
}
