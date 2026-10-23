#!/bin/sh
set -eu

# Render menyuntikkan PORT (default 10000). Nginx memakai port itu.
PUBLIC_PORT="${PORT:-10000}"
sed "s/__PORT__/${PUBLIC_PORT}/" /etc/nginx/templates/gateway.conf > /etc/nginx/http.d/default.conf
nginx -t

# Jalankan Nginx secara langsung di foreground tanpa supervisor
exec nginx -g 'daemon off;'
