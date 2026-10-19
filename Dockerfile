# ==========================================
# STAGE 1: Build Go App
# ==========================================
FROM golang:1.22-alpine AS builder-go
WORKDIR /build
COPY services/auth/go.mod services/auth/go.sum ./
RUN go mod download
COPY services/auth/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o go-auth-app ./cmd/server/main.go

# ==========================================
# STAGE 2: Build NestJS App
# ==========================================
FROM node:20-alpine AS builder-nest
WORKDIR /build/nest
COPY nest/package*.json ./
RUN npm ci
COPY nest/ ./
RUN npm run build

# ==========================================
# STAGE 3: Final Production Image
# ==========================================
FROM node:20-alpine AS runner

# Install Nginx & Supervisord
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Copy binary Go
COPY --from=builder-go /build/go-auth-app /app/go-auth-app

# Copy artifact NestJS & dependencies
COPY --from=builder-nest /build/nest/dist /app/nest/dist
COPY --from=builder-nest /build/nest/node_modules /app/nest/node_modules
COPY --from=builder-nest /build/nest/package.json /app/nest/package.json

# Copy configurations
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]