//! Connection pool, migrations and the first-run seed.
//!
//! Migrations are the SQL files drizzle-kit writes to `drizzle/`, embedded in the binary.
//! They are tracked in `drizzle.__drizzle_migrations` exactly as drizzle's own migrator does,
//! so databases created by the previous TypeScript API keep working, and `drizzle-kit
//! generate` can still be used to write new migrations.

use std::time::Duration;

use anyhow::Context;
use include_dir::{include_dir, Dir};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use sqlx::postgres::PgPoolOptions;
use sqlx::{AssertSqlSafe, PgPool};
use uuid::Uuid;

static MIGRATIONS: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../drizzle");

/// The built-in user every request runs as (there is no login).
pub const LOCAL_AUTH_USER_ID: Uuid = Uuid::from_u128(0x00000000_0000_4000_8000_000000000001);
pub const LOCAL_USER_EMAIL: &str = "you@orbit.local";
pub const LOCAL_WORKSPACE_SLUG: &str = "local";

/// Any fixed key works; it only has to be the same for every process sharing the database.
const MIGRATION_LOCK_KEY: i64 = 0x0_7b17_d12a;

pub async fn connect(url: &str) -> anyhow::Result<PgPool> {
    PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(10))
        .connect(url)
        .await
        .context("could not connect to Postgres")
}

#[derive(Deserialize)]
struct Journal {
    entries: Vec<JournalEntry>,
}

#[derive(Deserialize)]
struct JournalEntry {
    when: i64,
    tag: String,
}

pub struct Migration {
    pub tag: String,
    pub created_at: i64,
    pub hash: String,
    pub sql: &'static str,
}

/// The embedded migrations, in journal order.
pub fn migrations() -> anyhow::Result<Vec<Migration>> {
    let journal = MIGRATIONS
        .get_file("meta/_journal.json")
        .and_then(|file| file.contents_utf8())
        .context("drizzle/meta/_journal.json is missing")?;
    let journal: Journal = serde_json::from_str(journal).context("drizzle/meta/_journal.json is invalid")?;

    journal
        .entries
        .into_iter()
        .map(|entry| {
            let sql = MIGRATIONS
                .get_file(format!("{}.sql", entry.tag))
                .and_then(|file| file.contents_utf8())
                .with_context(|| format!("migration drizzle/{}.sql is missing", entry.tag))?;
            Ok(Migration {
                hash: hex::encode(Sha256::digest(sql.as_bytes())),
                created_at: entry.when,
                tag: entry.tag,
                sql,
            })
        })
        .collect()
}

/// Applies every migration newer than the newest one recorded, in one transaction.
pub async fn migrate(pool: &PgPool) -> anyhow::Result<()> {
    let migrations = migrations()?;
    let mut tx = pool.begin().await?;

    // Serverless cold starts can race; only one of them applies migrations.
    sqlx::query("SELECT pg_advisory_xact_lock($1)").bind(MIGRATION_LOCK_KEY).execute(&mut *tx).await?;
    sqlx::raw_sql("CREATE SCHEMA IF NOT EXISTS drizzle").execute(&mut *tx).await?;
    sqlx::raw_sql(
        "CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)",
    )
    .execute(&mut *tx)
    .await?;

    let last: Option<i64> =
        sqlx::query_scalar("SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1")
            .fetch_optional(&mut *tx)
            .await?
            .flatten();

    for migration in migrations.iter().filter(|m| last.is_none_or(|last| last < m.created_at)) {
        for statement in migration.sql.split("--> statement-breakpoint") {
            if statement.trim().is_empty() {
                continue;
            }
            sqlx::raw_sql(AssertSqlSafe(statement))
                .execute(&mut *tx)
                .await
                .with_context(|| format!("migration {} failed", migration.tag))?;
        }
        sqlx::query("INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)")
            .bind(&migration.hash)
            .bind(migration.created_at)
            .execute(&mut *tx)
            .await?;
        tracing::info!(migration = %migration.tag, "applied migration");
    }

    tx.commit().await?;
    Ok(())
}

/// A brand-new database gets the built-in user and a workspace. When users already exist,
/// the API runs as the built-in user if present, otherwise as the first user.
pub async fn seed_local_workspace(pool: &PgPool) -> anyhow::Result<()> {
    let existing: Option<Uuid> = sqlx::query_scalar("SELECT id FROM users LIMIT 1").fetch_optional(pool).await?;
    if existing.is_some() {
        return Ok(());
    }

    let mut tx = pool.begin().await?;
    let user_id: Uuid = sqlx::query_scalar(
        "INSERT INTO users (auth_user_id, email, full_name) VALUES ($1, $2, 'You') RETURNING id",
    )
    .bind(LOCAL_AUTH_USER_ID)
    .bind(LOCAL_USER_EMAIL)
    .fetch_one(&mut *tx)
    .await?;
    let workspace_id: Uuid = sqlx::query_scalar(
        "INSERT INTO workspaces (name, slug, owner_id) VALUES ('My Workspace', $1, $2) RETURNING id",
    )
    .bind(LOCAL_WORKSPACE_SLUG)
    .bind(user_id)
    .fetch_one(&mut *tx)
    .await?;
    sqlx::query("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')")
        .bind(workspace_id)
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("INSERT INTO workspace_settings (workspace_id) VALUES ($1)")
        .bind(workspace_id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    tracing::info!("created the local workspace");
    Ok(())
}

/// Connects, migrates and seeds: everything a process needs before serving requests.
pub async fn prepare(url: &str) -> anyhow::Result<PgPool> {
    let pool = connect(url).await?;
    migrate(&pool).await?;
    seed_local_workspace(&pool).await?;
    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embeds_every_journal_migration_in_order() {
        let migrations = migrations().expect("migrations load");
        assert!(!migrations.is_empty());
        assert_eq!(migrations[0].tag, "0000_init");
        assert!(migrations.windows(2).all(|pair| pair[0].created_at < pair[1].created_at));
        assert!(migrations.iter().all(|m| m.hash.len() == 64));
    }

    #[test]
    fn local_user_id_matches_the_previous_api() {
        assert_eq!(LOCAL_AUTH_USER_ID.to_string(), "00000000-0000-4000-8000-000000000001");
    }
}
