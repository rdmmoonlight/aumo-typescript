mod analytics;
mod config;
mod queue;

use anyhow::{Context, Result};
use axum::{routing::get, Router};
use deadpool_postgres::Pool;
use redis::AsyncCommands;
use std::net::SocketAddr;
use tokio::signal;
use tokio_util::sync::CancellationToken;
use tower_http::cors::CorsLayer;
use tracing::{error, info, warn};
use tracing_subscriber::EnvFilter;

use analytics::transaction::{
    get_daily_analytics, get_monthly_analytics, process_transaction_analytics, TransactionEventData,
};
use config::{create_postgres_pool, init_env};
use queue::{mark_job_completed, mark_job_failed, JobPayload};

#[tokio::main]
async fn main() -> Result<()> {
    init_env();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let db_pool = create_postgres_pool()?;
    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".into());
    let client = redis::Client::open(redis_url)?;
    let mut redis_conn = client.get_multiplexed_async_connection().await?;

    // --- 1. SPAWN AXUM HTTP SERVER (READ API) ---
    let app_pool = db_pool.clone();
    tokio::spawn(async move {
        let app = Router::new()
            .route("/analytics/daily", get(get_daily_analytics))
            .route("/analytics/monthly", get(get_monthly_analytics))
            .layer(CorsLayer::permissive())
            .with_state(app_pool);

        let port: u16 = std::env::var("PORT")
            .unwrap_or_else(|_| "3001".into())
            .parse()
            .unwrap_or(3001);

        let addr = SocketAddr::from(([0, 0, 0, 0], port));
        info!("Axum Analytics API server listening on http://{}", addr);

        if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
            if let Err(e) = axum::serve(listener, app).await {
                error!("Axum server error: {:?}", e);
            }
        } else {
            error!("Gagal melakukan bind TCP listener pada port {}", port);
        }
    });

    // --- 2. WORKER REDIS LOOP ---
    info!("Rust Worker started. Listening for jobs from Redis...");

    let queue_name = "default";
    let wait_queue = format!("bull:{}:wait", queue_name);

    let cancel_token = CancellationToken::new();
    let cancel_token_clone = cancel_token.clone();

    tokio::spawn(async move {
        shutdown_signal().await;
        warn!("Shutdown signal received. Stopping worker loop gracefully...");
        cancel_token_clone.cancel();
    });

    loop {
        tokio::select! {
            _ = cancel_token.cancelled() => {
                info!("Worker loop stopped. Cleaning up resources...");
                break;
            }
            result = redis_conn.brpop::<_, Option<(String, String)>>(&wait_queue, 2.0) => {
                if let Ok(Some((_, raw_payload))) = result {
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
                            let _ = mark_job_completed(&mut redis_conn, queue_name, &job_id, "{\"status\":\"ok\"}").await;
                        }
                        Err(e) => {
                            error!("Job ID [{}] failed: {:?}", job_id, e);
                            let _ = mark_job_failed(&mut redis_conn, queue_name, &job_id, &e.to_string()).await;
                        }
                    }
                }
            }
        }
    }

    info!("Rust Worker shut down cleanly.");
    Ok(())
}

async fn process_job(payload: &JobPayload, db_pool: &Pool) -> Result<()> {
    match payload.name.as_str() {
        "transaction-analytics" => {
            let event: TransactionEventData = serde_json::from_value(payload.data.clone())
                .context("Gagal memparsing payload transaction-analytics")?;
            process_transaction_analytics(&event, db_pool).await?;
        }
        _ => {
            info!("Unhandled job type: {}", payload.name);
        }
    }
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c().await.expect("Failed to install Ctrl+C handler");
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