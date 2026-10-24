# syntax=docker/dockerfile:1.4
# Build context: root repo. Standalone Web (Next.js Static Export) + .NET API + Rust Worker via Nginx & Supervisor

# =========================================================
# STAGE 1: Build Next.js (SSG / Static Export)
# =========================================================
FROM node:24-alpine AS builder-web
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
ENV NEXT_PUBLIC_API_URL=/api

# Copy berkas manifest pnpm & workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/next/package.json apps/next/
COPY libs/logger/package.json libs/logger/

# Install dependensi dengan pnpm store cache
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --ignore-scripts --filter "@app/next..."

COPY . .

# Build Next.js tanpa pre-post scripts
RUN pnpm --config.enable-pre-post-scripts=false --filter "@app/next..." build


# =========================================================
# STAGE 2: Build .NET API
# =========================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS builder-dotnet
WORKDIR /src

COPY dotnet/ ./
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet publish Accounting.Api/Accounting.Api.csproj \
    -c Release \
    -r linux-musl-x64 \
    --self-contained \
    -p:PublishTrimmed=true \
    -p:InvariantGlobalization=true \
    -o /out


# =========================================================
# STAGE 3: Build Rust Worker (Dukungan Caching & Path Rapi)
# =========================================================
FROM rust:1.80-alpine AS builder-rust
RUN apk add --no-cache musl-dev gcc

WORKDIR /app/workers

# 1. Copy manifest saja untuk mengunduh & memicu dependency compilation cache
COPY native/workers/Cargo.toml native/workers/Cargo.lock ./

# Dummy main untuk kompilasi dependensi (Agar layer ini ter-cache jika kode tidak berubah)
RUN mkdir src && \
    echo "fn main() { println!(\"dummy\"); }" > src/main.rs && \
    --mount=type=cache,id=cargo-registry,target=/usr/local/cargo/registry \
    --mount=type=cache,id=cargo-git,target=/usr/local/cargo/git \
    cargo build --release && \
    rm -rf src

# 2. Copy source code asli
COPY native/workers/src ./src

# 3. Build biner asli (touch src/main.rs agar cargo mendeteksi pembaruan file)
RUN touch src/main.rs && \
    --mount=type=cache,id=cargo-registry,target=/usr/local/cargo/registry \
    --mount=type=cache,id=cargo-git,target=/usr/local/cargo/git \
    cargo build --release


# =========================================================
# STAGE 4: Final Image Runner
# =========================================================
FROM node:24-alpine AS runner

# Install Nginx, Supervisord, ca-certificates, dan Runtime Dependencies .NET (musl)
RUN apk add --no-cache \
    nginx \
    supervisor \
    ca-certificates \
    tzdata \
    libstdc++ \
    libgcc \
    icu-libs \
    krb5-libs \
    libintl

ENV NODE_ENV=production \
    ENV=production \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=true \
    RUST_LOG=info

WORKDIR /app

# Copy hasil build dari tiap stage
COPY --from=builder-dotnet /out /app/dotnet
COPY --from=builder-rust /app/workers/target/release/workers /app/rust-worker
COPY --from=builder-web /app/apps/next/out /usr/share/nginx/html

# Copy konfigurasi
COPY nginx.conf /etc/nginx/templates/gateway.conf
COPY nest_proxy.conf /etc/nginx/nest_proxy.conf
COPY supervisord.conf /etc/supervisord.conf
COPY entrypoint.sh /entrypoint.sh

# Atur izin akses & hapus default config Nginx
RUN rm -f /etc/nginx/http.d/default.conf && \
    chmod +x /entrypoint.sh && \
    chmod -R +x /app/dotnet && \
    chmod +x /app/rust-worker

EXPOSE 10000
CMD ["/entrypoint.sh"]
