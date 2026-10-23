# syntax=docker/dockerfile:1.4
# Build context: root repo. Standalone Web (Next.js Static Export) + .NET API via Nginx

# STAGE 1: Build Next.js (SSG / Static Export)
FROM node:24-alpine AS builder-web
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV NEXT_PUBLIC_API_URL=/api

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/next/package.json apps/next/
COPY libs/logger/package.json libs/logger/

# Menggunakan --ignore-scripts agar prepare script tidak berjalan saat install
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --ignore-scripts --filter "@app/next..."

COPY . .

# Build Next.js tanpa pre-post scripts
RUN pnpm --config.enable-pre-post-scripts=false --filter "@app/next..." build

# STAGE 2: Build .NET
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS builder-dotnet
WORKDIR /src
COPY dotnet/ ./
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet publish Aumo.Accounting.Api/Aumo.Accounting.Api.csproj \
    -c Release \
    -r linux-musl-x64 \
    --self-contained \
    -p:PublishTrimmed=true \
    -p:InvariantGlobalization=true \
    -o /out

# STAGE 3: Final Image Runner
FROM node:24-alpine AS runner

# 1. Install Nginx, Supervisord, dan Runtime Dependencies .NET untuk Alpine (musl)
RUN apk add --no-cache \
    nginx \
    supervisor \
    libstdc++ \
    libgcc \
    icu-libs \
    krb5-libs \
    libintl

ENV NODE_ENV=production \
    ENV=production \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=true

WORKDIR /app

# 2. Copy artifacts
COPY --from=builder-dotnet /out /app/dotnet
COPY --from=builder-web /app/apps/next/out /usr/share/nginx/html

# 3. Copy Nginx & Supervisor Configs
COPY nginx.conf /etc/nginx/templates/gateway.conf
COPY nest_proxy.conf /etc/nginx/nest_proxy.conf
COPY supervisord.conf /etc/supervisord.conf
COPY entrypoint.sh /entrypoint.sh

# 4. Beri izin eksekusi pada biner .NET dan script entrypoint
RUN rm -f /etc/nginx/http.d/default.conf && \
    chmod +x /entrypoint.sh && \
    chmod -R +x /app/dotnet

EXPOSE 10000
CMD ["/entrypoint.sh"]
