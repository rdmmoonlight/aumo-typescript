use anyhow::Result;
use redis::AsyncCommands;
use tracing::{info, error};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".into());
    let client = redis::Client::open(redis_url)?;
    let mut conn = client.get_multiplexed_async_connection().await?;

    info!("Rust Worker started. Listening for jobs...");

    loop {
        // Menggunakan BRPOP (mirip pola BullMQ waiting)
        let result: Option<(String, String)> = conn
            .brpop("bull:default:wait", 5.0)
            .await?;

        if let Some((_, job_data)) = result {
            match process_job(&job_data).await {
                Ok(_) => info!("Job processed successfully"),
                Err(e) => error!("Job failed: {:?}", e),
            }
        }
    }
}

async fn process_job(data: &str) -> Result<()> {
    // Parsing job JSON dari NestJS
    // Contoh: {"name": "generate-report", "data": {...}}
    info!("Processing job: {}", data);
    // TODO: dispatch ke handler spesifik
    Ok(())
  }
