#!/usr/bin/env bash
set -euo pipefail

HOST="${FRONTEND_HOST:-127.0.0.1}"
PORT="${FRONTEND_PORT:-5000}"

echo "Building production frontend assets..."
npm run build

# Static preview of the built assets. Public testnet deployments should put an
# nginx or equivalent reverse proxy in front of the dist/ output.
while true; do
    echo "Serving built frontend assets on ${HOST}:${PORT}..."
    npm run preview -- --host "${HOST}" --port "${PORT}" --strictPort
    echo "Frontend static server stopped. Restarting in 5 seconds..."
    sleep 5
done
