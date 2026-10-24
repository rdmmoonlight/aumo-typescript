use anyhow::{Context, Result};
use deadpool_postgres::{Config, ManagerConfig, Pool, RecyclingMethod, Runtime};
use rustls::RootCertStore;
use tokio_postgres_rustls::MakeRustlsConnect;

pub fn init_env() {
    dotenvy::dotenv().ok();
}

pub fn create_postgres_pool() -> Result<Pool> {
    // Setup Root Certificates menggunakan webpki-roots
    let mut root_store = RootCertStore::empty();
    root_store.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());

    let tls_config = rustls::ClientConfig::builder()
        .with_root_certificates(root_store)
        .with_no_client_auth();

    let tls = MakeRustlsConnect::new(tls_config);

    if let Ok(db_url) = std::env::var("DATABASE_URL") {
        // Membersihkan query params (misal ?sslmode=require) agar parser tokio_postgres tidak error
        let clean_url = db_url.split('?').next().unwrap_or(&db_url);

        let tokio_config: tokio_postgres::Config = clean_url
            .parse()
            .context("DATABASE_URL di .env tidak valid")?;

        let mut cfg = Config::new();
        if let Some(host) = tokio_config.get_hosts().first() {
            match host {
                tokio_postgres::config::Host::Tcp(h) => cfg.host = Some(h.clone()),
                #[cfg(unix)]
                tokio_postgres::config::Host::Unix(u) => {
                    cfg.host = Some(u.to_string_lossy().into_owned())
                }
            }
        }
        if let Some(user) = tokio_config.get_user() {
            cfg.user = Some(user.to_string());
        }
        if let Some(password) = tokio_config.get_password() {
            cfg.password = Some(String::from_utf8_lossy(password).to_string());
        }
        if let Some(dbname) = tokio_config.get_dbname() {
            cfg.dbname = Some(dbname.to_string());
        }
        if let Some(port) = tokio_config.get_ports().first() {
            cfg.port = Some(*port);
        }

        cfg.manager = Some(ManagerConfig {
            recycling_method: RecyclingMethod::Fast,
        });

        return cfg
            .create_pool(Some(Runtime::Tokio1), tls)
            .context("Gagal membuat deadpool-postgres pool dari DATABASE_URL dengan TLS");
    }

    // Fallback variabel individual
    let mut cfg = Config::new();
    cfg.host = Some(std::env::var("PGHOST").unwrap_or_else(|_| "127.0.0.1".into()));
    cfg.user = Some(std::env::var("PGUSER").unwrap_or_else(|_| "postgres".into()));
    cfg.password = Some(std::env::var("PGPASSWORD").unwrap_or_else(|_| "postgres".into()));
    cfg.dbname = Some(std::env::var("PGDATABASE").unwrap_or_else(|_| "aumo".into()));
    cfg.manager = Some(ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    });

    cfg.create_pool(Some(Runtime::Tokio1), tls)
        .context("Gagal membuat deadpool-postgres pool dari env vars individual")
}