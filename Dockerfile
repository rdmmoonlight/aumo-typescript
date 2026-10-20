# syntax=docker/dockerfile:1
# Build context: root repo. Menjalankan Go auth + NestJS + Web di belakang Nginx
# dalam satu container (Render hanya mengekspos satu port: $PORT).

# ==========================================
# STAGE 1: Build Go Auth
# ==========================================
FROM golang:1.22-alpine AS builder-go
WORKDIR /build
COPY services/auth/go.mod services/auth/go.sum ./
RUN go mod download
COPY services/auth/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o go-auth-app ./cmd/server

# ==========================================
# STAGE 2: Build NestJS (apps/nest) + libs
# ==========================================
FROM node:24-alpine AS builder-nest
WORKDIR /app
RUN npm install -g pnpm@12.14.0

# Manifest dulu agar layer install ter-cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/nest/package.json apps/nest/
COPY apps/api/package.json apps/api/
COPY libs/contracts/package.json libs/contracts/
COPY libs/logger/package.json libs/logger/
COPY libs/sdk/package.json libs/sdk/
RUN pnpm install --frozen-lockfile --filter "@app/nest..."

COPY . .
# "..." membangun dependensi (libs/logger) lebih dulu, lalu Nest
RUN pnpm --filter "@app/nest..." build
RUN pnpm --filter @app/nest deploy --prod /app/pruned

# ==========================================
# STAGE 3: Build Web (@app/analog)
# ==========================================
FROM node:24-alpine AS builder-web
WORKDIR /app
RUN npm install -g pnpm@12.14.0

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/analog/package.json apps/analog/
COPY libs/contracts/package.json libs/contracts/
COPY libs/logger/package.json libs/logger/
COPY libs/sdk/package.json libs/sdk/
RUN pnpm install --frozen-lockfile --filter "@app/analog..."

COPY . .
RUN pnpm --filter "@app/analog..." build

# ==========================================
# STAGE 4: Final image
# ==========================================
FROM node:24-alpine AS runner
RUN apk add --no-cache nginx supervisor

ENV NODE_ENV=production \
    ENV=production

WORKDIR /app

COPY --from=builder-go /build/go-auth-app /app/go-auth-app

COPY --from=builder-nest /app/pruned/node_modules /app/nest/node_modules
COPY --from=builder-nest /app/apps/nest/dist /app/nest/dist
COPY --from=builder-nest /app/apps/nest/package.json /app/nest/package.json

# Salin static assets Analog ke direktori web root Nginx
COPY --from=builder-web /app/apps/analog/dist/client /usr/share/nginx/html

COPY nginx.conf /etc/nginx/templates/gateway.conf
COPY nest_proxy.conf /etc/nginx/nest_proxy.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY entrypoint.sh /entrypoint.sh
RUN rm -f /etc/nginx/http.d/default.conf && chmod +x /entrypoint.sh

EXPOSE 10000

CMD ["/entrypoint.sh"]