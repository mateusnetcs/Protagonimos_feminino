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
/app/scripts/init-db.sh
echo '=== INICIANDO NODE ==='
exec node server.js
