use anyhow::{Context, Result};
use deadpool_postgres::{Config, ManagerConfig, Pool, RecyclingMethod, Runtime};
use tokio_postgres::NoTls;

pub fn create_postgres_pool() -> Result<Pool> {
    let host = std::env::var("PGHOST").unwrap_or_else(|_| "127.0.0.1".into());
    let user = std::env::var("PGUSER").unwrap_or_else(|_| "postgres".into());
    let password = std::env::var("PGPASSWORD").unwrap_or_else(|_| "postgres".into());
    let dbname = std::env::var("PGDATABASE").unwrap_or_else(|_| "aumo".into());

    let mut cfg = Config::new();
    cfg.host = Some(host);
    cfg.user = Some(user);
    cfg.password = Some(password);
    cfg.dbname = Some(dbname);
    cfg.manager = Some(ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    });

    cfg.create_pool(Some(Runtime::Tokio1), NoTls)
        .context("Gagal membuat deadpool-postgres pool")
}