use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

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

pub async fn mark_job_completed(
    conn: &mut redis::aio::MultiplexedConnection,
    queue_name: &str,
    job_id: &str,
    return_value: &str,
) -> Result<()> {
    let now = get_current_millis().to_string();
    let script = redis::Script::new(COMPLETE_JOB_SCRIPT);
    let _: i32 = script
        .key(format!("bull:{}:active", queue_name))
        .key(format!("bull:{}:completed", queue_name))
        .key(format!("bull:{}:{}", queue_name, job_id))
        .arg(job_id)
        .arg(return_value)
        .arg(now)
        .invoke_async(conn)
        .await?;

    Ok(())
}

pub async fn mark_job_failed(
    conn: &mut redis::aio::MultiplexedConnection,
    queue_name: &str,
    job_id: &str,
    failed_reason: &str,
) -> Result<()> {
    let now = get_current_millis().to_string();
    let script = redis::Script::new(FAIL_JOB_SCRIPT);
    let _: i32 = script
        .key(format!("bull:{}:active", queue_name))
        .key(format!("bull:{}:failed", queue_name))
        .key(format!("bull:{}:{}", queue_name, job_id))
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