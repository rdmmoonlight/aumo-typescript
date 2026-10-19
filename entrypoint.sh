#!/bin/sh
set -eu

# Render menyuntikkan PORT (default 10000). Nginx memakai port itu;
# Go (8080) dan Nest (5000) hanya mendengarkan di 127.0.0.1/internal.
PUBLIC_PORT="${PORT:-10000}"
sed "s/__PORT__/${PUBLIC_PORT}/" /etc/nginx/templates/gateway.conf > /etc/nginx/http.d/default.conf
nginx -t

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
