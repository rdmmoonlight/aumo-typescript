# ==========================================
# STAGE 1: Build Binary
# ==========================================
FROM golang:1.22-alpine AS builder

# Install ca-certificates untuk HTTPS request & tzdata untuk timezone
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy dependency files lebih dulu untuk caching layer Docker
COPY go.mod go.sum ./
RUN go mod download

# Copy seluruh source code service auth
COPY . .

# Build binary Go (CGO disabled agar static & portable)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /app/auth-server \
    ./cmd/server

# ==========================================
# STAGE 2: Minimal Production Image (Scratch / Distroless-like)
# ==========================================
FROM alpine:3.19 AS runner

WORKDIR /app

# Copy SSL Certs dan timezone info dari builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy binary yang sudah di-build
COPY --from=builder /app/auth-server /app/auth-server

# Buat non-root user demi keamanan
RUN adduser -D -g '' appuser
USER appuser

EXPOSE 8080

ENTRYPOINT ["/app/auth-server"]