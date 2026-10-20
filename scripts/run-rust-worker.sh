#!/usr/bin/env bash
set -e

cd native/workers
cargo build --release
REDIS_URL=${REDIS_URL:-redis://127.0.0.1:6379} \
RUST_LOG=info \
./target/release/aumo-workers
