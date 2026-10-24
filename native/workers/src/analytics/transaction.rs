use anyhow::{Context, Result};
use axum::{extract::State, Json};
use chrono::NaiveDate;
use deadpool_postgres::Pool;
use rust_decimal::prelude::FromPrimitive;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::info;

#[derive(Serialize, Deserialize, Debug)]
pub struct TransactionEventData {
    pub date: String, // Format: "YYYY-MM-DD"
    pub amount: f64,
}

// --- WORKER HANDLER (UPSERT STATISTIK) ---

pub async fn process_transaction_analytics(
    data: &TransactionEventData,
    db_pool: &Pool,
) -> Result<()> {
    let client = db_pool
        .get()
        .await
        .context("Gagal mengambil koneksi Postgres dari pool")?;

    // Parse String tanggal ke chrono::NaiveDate
    let date_val = NaiveDate::parse_from_str(&data.date, "%Y-%m-%d")
        .context("Format tanggal tidak valid, gunakan YYYY-MM-DD")?;

    let year: i32 = date_val.format("%Y").to_string().parse()?;
    let month: i32 = date_val.format("%m").to_string().parse()?;

    // Konversi f64 ke Decimal agar selaras dengan kolom NUMERIC PostgreSQL
    let amount_dec = Decimal::from_f64(data.amount).unwrap_or_default();

    // 1. Upsert Harian ke schema analytics
    let query_daily = r#"
        INSERT INTO analytics.daily_transactions (date, total_transactions, total_volume, updated_at)
        VALUES ($1, 1, $2, NOW())
        ON CONFLICT (date) DO UPDATE SET
            total_transactions = analytics.daily_transactions.total_transactions + 1,
            total_volume = analytics.daily_transactions.total_volume + EXCLUDED.total_volume,
            updated_at = NOW();
    "#;

    client
        .execute(query_daily, &[&date_val, &amount_dec])
        .await
        .context("Gagal memperbarui analytics.daily_transactions")?;

    // 2. Upsert Bulanan ke schema analytics
    let query_monthly = r#"
        INSERT INTO analytics.monthly_transactions (year, month, total_transactions, total_volume, updated_at)
        VALUES ($1, $2, 1, $3, NOW())
        ON CONFLICT (year, month) DO UPDATE SET
            total_transactions = analytics.monthly_transactions.total_transactions + 1,
            total_volume = analytics.monthly_transactions.total_volume + EXCLUDED.total_volume,
            updated_at = NOW();
    "#;

    client
        .execute(query_monthly, &[&year, &month, &amount_dec])
        .await
        .context("Gagal memperbarui analytics.monthly_transactions")?;

    info!(
        "Berhasil memperbarui statistik transaksi harian & bulanan tanggal {} (Nominal: {})",
        data.date, data.amount
    );

    Ok(())
}

// --- AXUM HTTP READ HANDLERS ---

/// GET /analytics/daily
pub async fn get_daily_analytics(State(pool): State<Pool>) -> Result<Json<Value>, String> {
    let client = pool.get().await.map_err(|e| e.to_string())?;

    let rows = client
        .query(
            "SELECT date::TEXT, total_transactions, total_volume FROM analytics.daily_transactions ORDER BY date DESC LIMIT 30",
            &[],
        )
        .await
        .map_err(|e| e.to_string())?;

    let result: Vec<Value> = rows
        .iter()
        .map(|row| {
            let total_vol: Decimal = row.get("total_volume");
            json!({
                "date": row.get::<_, String>("date"),
                "total_transactions": row.get::<_, i64>("total_transactions"),
                "total_volume": total_vol.to_string()
            })
        })
        .collect();

    Ok(Json(json!({ "data": result })))
}

/// GET /analytics/monthly
pub async fn get_monthly_analytics(State(pool): State<Pool>) -> Result<Json<Value>, String> {
    let client = pool.get().await.map_err(|e| e.to_string())?;

    let rows = client
        .query(
            "SELECT year, month, total_transactions, total_volume FROM analytics.monthly_transactions ORDER BY year DESC, month DESC LIMIT 12",
            &[],
        )
        .await
        .map_err(|e| e.to_string())?;

    let result: Vec<Value> = rows
        .iter()
        .map(|row| {
            let total_vol: Decimal = row.get("total_volume");
            json!({
                "year": row.get::<_, i32>("year"),
                "month": row.get::<_, i32>("month"),
                "total_transactions": row.get::<_, i64>("total_transactions"),
                "total_volume": total_vol.to_string()
            })
        })
        .collect();

    Ok(Json(json!({ "data": result })))
}

// --- UNIT TESTS ---

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{create_postgres_pool, init_env};

    async fn setup_test_db() -> Pool {
        init_env();
        let pool = create_postgres_pool().expect("Gagal membuat DB pool untuk testing");

        let client = pool.get().await.expect("Gagal mengambil koneksi DB");
        client
            .batch_execute(
                r#"
                CREATE SCHEMA IF NOT EXISTS analytics;
                CREATE TABLE IF NOT EXISTS analytics.daily_transactions (
                    date DATE PRIMARY KEY,
                    total_transactions BIGINT NOT NULL DEFAULT 0,
                    total_volume NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS analytics.monthly_transactions (
                    year INT NOT NULL,
                    month INT NOT NULL,
                    total_transactions BIGINT NOT NULL DEFAULT 0,
                    total_volume NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    PRIMARY KEY (year, month)
                );
                "#,
            )
            .await
            .expect("Gagal membuat skema tabel test");

        pool
    }

    #[tokio::test]
    async fn test_process_transaction_analytics_success() {
        let pool = setup_test_db().await;

        let test_event = TransactionEventData {
            date: "2026-10-24".to_string(),
            amount: 150000.0,
        };

        let result = process_transaction_analytics(&test_event, &pool).await;
        assert!(result.is_ok(), "Proses analytics gagal: {:?}", result.err());

        let date_val = NaiveDate::parse_from_str(&test_event.date, "%Y-%m-%d").unwrap();

        let client = pool.get().await.unwrap();
        let row_daily = client
            .query_one(
                "SELECT total_transactions, total_volume FROM analytics.daily_transactions WHERE date = $1",
                &[&date_val],
            )
            .await
            .expect("Gagal mengambil data daily_transactions");

        let total_tx: i64 = row_daily.get("total_transactions");
        let total_vol: Decimal = row_daily.get("total_volume");

        assert_eq!(total_tx, 1);
        assert_eq!(total_vol, Decimal::from_f64(150000.0).unwrap());

        let row_monthly = client
            .query_one(
                "SELECT total_transactions, total_volume FROM analytics.monthly_transactions WHERE year = 2026 AND month = 10",
                &[],
            )
            .await
            .expect("Gagal mengambil data monthly_transactions");

        let monthly_tx: i64 = row_monthly.get("total_transactions");
        let monthly_vol: Decimal = row_monthly.get("total_volume");

        assert_eq!(monthly_tx, 1);
        assert_eq!(monthly_vol, Decimal::from_f64(150000.0).unwrap());
    }

    #[tokio::test]
    async fn test_invalid_date_format_should_fail() {
        let pool = setup_test_db().await;

        let invalid_event = TransactionEventData {
            date: "invalid-date".to_string(),
            amount: 50000.0,
        };

        let result = process_transaction_analytics(&invalid_event, &pool).await;
        assert!(result.is_err());
    }
}