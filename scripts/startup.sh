#!/bin/sh
set -e
echo '=== STARTUP ==='
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:3000}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-secret-change-me}"
if [ -z "$APP_URL" ] || [ "$APP_URL" = '${NEXTAUTH_URL}' ]; then
  export APP_URL="$NEXTAUTH_URL"
fi
echo "NEXTAUTH_URL=$NEXTAUTH_URL"
echo "APP_URL=$APP_URL"
# Init do MySQL em background para não segurar a porta 3000 (evita 504 no proxy enquanto espera DB)
echo '=== INIT DB EM BACKGROUND (log: /tmp/jornada-init-db.log) ==='
nohup /app/scripts/init-db.sh > /tmp/jornada-init-db.log 2>&1 &
echo '=== INICIANDO NODE ==='
exec node server.js
