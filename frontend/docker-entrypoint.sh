#!/bin/sh
set -e

# Use VITE_API_URL if set, otherwise BACKEND_URL, otherwise default for Docker Compose
: "${VITE_API_URL:=${BACKEND_URL:-http://backend:8080}}"
export BACKEND_URL="$VITE_API_URL"

echo "Configuring nginx with BACKEND_URL: $BACKEND_URL"

# Substitute environment variables in nginx config template
# Only substitute BACKEND_URL, preserve nginx variables like $uri, $host, etc.
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
