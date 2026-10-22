# syntax=docker/dockerfile:1.4
# Build context: root repo. Go + Nest + Next.js + .NET di belakang Nginx

# STAGE 1: Build Go Auth
FROM golang:1.22-alpine AS builder-go
WORKDIR /build
COPY services/auth/go.mod services/auth/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
COPY services/auth/ ./
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o go-auth-app ./cmd/server

# STAGE 2: Build NestJS
FROM node:24-alpine AS builder-nest
WORKDIR /app
RUN npm install -g pnpm@12.14.0

# Matikan pemblokiran build scripts pnpm
ENV PNPM_CONFIG_IGNORE_BUILDS=false

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/nest/package.json apps/nest/
COPY apps/api/package.json apps/api/
COPY libs/contracts/package.json libs/contracts/
COPY libs/logger/package.json libs/logger/
COPY libs/sdk/package.json libs/sdk/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter "@app/nest..."
COPY . .
RUN pnpm --filter "@app/nest..." build
RUN pnpm --filter @app/nest deploy --prod /app/pruned

# STAGE 3: Build Next.js (SSG / Static Export)
FROM node:24-alpine AS builder-web
WORKDIR /app
RUN npm install -g pnpm@12.14.0
ENV NEXT_PUBLIC_API_URL=/api
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/next/package.json apps/next/
COPY libs/contracts/package.json libs/contracts/
COPY libs/logger/package.json libs/logger/
COPY libs/sdk/package.json libs/sdk/

# Menggunakan --no-frozen-lockfile agar pnpm v10 tidak memblokir unrs-resolver
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile --filter "@app/next..."

COPY . .
RUN --mount=type=cache,id=nextjs,target=/app/apps/next/.next/cache \
    pnpm --filter "@app/next..." build

# STAGE 4: Build .NET
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS builder-dotnet
WORKDIR /src
COPY dotnet/ ./
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet publish Aumo.Accounting.Api/Aumo.Accounting.Api.csproj \
    -c Release \
    -r linux-musl-x64 \
    --self-contained true \
    -p:PublishTrimmed=true \
    -p:InvariantGlobalization=true \
    -o /out

# STAGE 5: Final image
FROM node:24-alpine AS runner
RUN apk add --no-cache nginx supervisor libstdc++ libgcc

ENV NODE_ENV=production \
    ENV=production

WORKDIR /app

COPY --from=builder-go /build/go-auth-app /app/go-auth-app
COPY --from=builder-nest /app/pruned/node_modules /app/nest/node_modules
COPY --from=builder-nest /app/apps/nest/dist /app/nest/dist
COPY --from=builder-nest /app/apps/nest/package.json /app/nest/package.json
COPY --from=builder-web /app/apps/next/out /usr/share/nginx/html
COPY --from=builder-dotnet /out /app/dotnet

COPY nginx.conf /etc/nginx/templates/gateway.conf
COPY nest_proxy.conf /etc/nginx/nest_proxy.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY entrypoint.sh /entrypoint.sh
RUN rm -f /etc/nginx/http.d/default.conf && chmod +x /entrypoint.sh

EXPOSE 10000
CMD ["/entrypoint.sh"]
