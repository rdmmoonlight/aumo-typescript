use anyhow::{Context, Result};
use deadpool_postgres::{Config, ManagerConfig, Pool, RecyclingMethod, Runtime};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::signal;
use tokio_postgres::NoTls;
use tokio_util::sync::CancellationToken;
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;

// --- LUA SCRIPTS UNTUK ATOMIC ACK/NACK BULLMQ ---
const COMPLETE_JOB_SCRIPT: &str = r#"
    local active_key = KEYS[1]
    local completed_key = KEYS[2]
    local job_key = KEYS[3]
    local job_id = ARGV[1]
    local return_value = ARGV[2]
    local timestamp = ARGV[3]

    redis.call('LREM', active_key, 1, job_id)
    redis.call('ZADD', completed_key, timestamp, job_id)
    redis.call('HSET', job_key, 'finishedOn', timestamp, 'returnvalue', return_value)
    return 1
"#;

const FAIL_JOB_SCRIPT: &str = r#"
    local active_key = KEYS[1]
    local failed_key = KEYS[2]
    local job_key = KEYS[3]
    local job_id = ARGV[1]
    local failed_reason = ARGV[2]
    local timestamp = ARGV[3]

    redis.call('LREM', active_key, 1, job_id)
    redis.call('ZADD', failed_key, timestamp, job_id)
    redis.call('HSET', job_key, 'finishedOn', timestamp, 'failedReason', failed_reason)
    return 1
"#;

#[derive(Serialize, Deserialize, Debug)]
pub struct JobPayload {
    pub id: Option<String>,
    pub name: String,
    pub data: serde_json::Value,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AnalyticsData {
    pub user_id: String,
    pub action: String,
    pub timestamp: i64,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().or_else(|_| EnvFilter::try_new("info")))
        .init();

    // 1. Setup Postgres Connection Pool
    let db_pool = create_postgres_pool()?;

    // 2. Setup Redis Connection
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".into());
    let client = redis::Client::open(redis_url)?;
    let mut redis_conn = client.get_multiplexed_async_connection().await?;

    info!("Rust Worker started. Listening for jobs from Redis...");

    let queue_name = "default";
    let wait_queue = format!("bull:{}:wait", queue_name);

    // 3. Setup Cancellation Token untuk Graceful Shutdown
    let cancel_token = CancellationToken::new();
    let cancel_token_clone = cancel_token.clone();

    // Spawn task background untuk mendengarkan sinyal shutdown dari OS (Ctrl+C / SIGTERM)
    tokio::spawn(async move {
        shutdown_signal().await;
        warn!("Shutdown signal received. Stopping worker loop gracefully...");
        cancel_token_clone.cancel();
    });

    // 4. Main Worker Loop dengan pemicu CancellationToken
    loop {
        tokio::select! {
            // Ketika sinyal cancel aktif, hentikan loop
            _ = cancel_token.cancelled() => {
                info!("Worker loop stopped. Cleaning up resources...");
                break;
            }
            // Tetap menjalankan BRPOP seperti biasa
            result = redis_conn.brpop::<_, Option<(String, String)>>(&wait_queue, 2.0) => {
                match result {
                    Ok(Some((_, raw_payload))) => {
                        let payload: JobPayload = match serde_json::from_str(&raw_payload) {
                            Ok(p) => p,
                            Err(e) => {
                                error!("Gagal memparsing JSON payload dari Redis: {:?}", e);
                                continue;
                            }
                        };

                        let job_id = payload.id.clone().unwrap_or_else(|| "unknown".into());

                        match process_job(&payload, &db_pool).await {
                            Ok(_) => {
                                info!("Job ID [{}] processed successfully", job_id);
                                if let Err(err) = mark_job_completed(&mut redis_conn, queue_name, &job_id, "{\"status\":\"ok\"}").await {
                                    error!("Gagal memperbarui status COMPLETED di Redis untuk job [{}]: {:?}", job_id, err);
                                }
                            }
                            Err(e) => {
                                error!("Job ID [{}] failed: {:?}", job_id, e);
                                if let Err(err) = mark_job_failed(&mut redis_conn, queue_name, &job_id, &e.to_string()).await {
                                    error!("Gagal memperbarui status FAILED di Redis untuk job [{}]: {:?}", job_id, err);
                                }
                            }
                        }
                    }
                    Ok(None) => {
                        // Timeout normal dari BRPOP, tidak ada job
                    }
                    Err(e) => {
                        error!("Error fetching job from Redis: {:?}", e);
                    }
                }
            }
        }
    }

    info!("Rust Worker shut down cleanly.");
    Ok(())
}

/// Helper function untuk mendengarkan sinyal Ctrl+C (SIGINT) dan SIGTERM (Docker/K8s)
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}

async fn process_job(payload: &JobPayload, db_pool: &Pool) -> Result<()> {
    match payload.name.as_str() {
        "analytics-event" | "generate-report" => {
            let analytics: AnalyticsData = serde_json::from_value(payload.data.clone())
                .context("Gagal memparsing detail field 'data'")?;

            save_analytics_to_db(&analytics, db_pool).await?;
        }
        _ => {
            info!("Unhandled job type: {}", payload.name);
        }
    }

    Ok(())
}

async fn save_analytics_to_db(event: &AnalyticsData, db_pool: &Pool) -> Result<()> {
    let client = db_pool
        .get()
        .await
        .context("Gagal mengambil koneksi Postgres dari pool")?;

    let rows_affected = client
        .execute(
            "INSERT INTO analytics_logs (user_id, action, created_at) VALUES ($1, $2, to_timestamp($3))",
            &[&event.user_id, &event.action, &(event.timestamp as f64)],
        )
        .await
        .context("Gagal mengeksekusi INSERT ke PostgreSQL")?;

    info!("Saved analytics event for user_id: {}. Rows inserted: {}", event.user_id, rows_affected);

    Ok(())
}

async fn mark_job_completed(
    conn: &mut redis::aio::MultiplexedConnection,
    queue_name: &str,
    job_id: &str,
    return_value: &str,
) -> Result<()> {
    let now = get_current_millis().to_string();
    let active_key = format!("bull:{}:active", queue_name);
    let completed_key = format!("bull:{}:completed", queue_name);
    let job_key = format!("bull:{}:{}", queue_name, job_id);

    let script = redis::Script::new(COMPLETE_JOB_SCRIPT);
    let _: i32 = script
        .key(&active_key)
        .key(&completed_key)
        .key(&job_key)
        .arg(job_id)
        .arg(return_value)
        .arg(now)
        .invoke_async(conn)
        .await?;

    Ok(())
}

async fn mark_job_failed(
    conn: &mut redis::aio::MultiplexedConnection,
    queue_name: &str,
    job_id: &str,
    failed_reason: &str,
) -> Result<()> {
    let now = get_current_millis().to_string();
    let active_key = format!("bull:{}:active", queue_name);
    let failed_key = format!("bull:{}:failed", queue_name);
    let job_key = format!("bull:{}:{}", queue_name, job_id);

    let script = redis::Script::new(FAIL_JOB_SCRIPT);
    let _: i32 = script
        .key(&active_key)
        .key(&failed_key)
        .key(&job_key)
        .arg(job_id)
        .arg(failed_reason)
        .arg(now)
        .invoke_async(conn)
        .await?;

    Ok(())
}

fn get_current_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn create_postgres_pool() -> Result<Pool> {
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

    let pool = cfg
        .create_pool(Some(Runtime::Tokio1), NoTls)
        .context("Gagal membuat deadpool-postgres pool")?;

    Ok(pool)
}