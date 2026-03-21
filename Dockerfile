# Build (slim para compatibilidade com mysql2 e módulos nativos)
FROM node:20-slim AS builder

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Production
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/database ./database

RUN chmod +x /app/scripts/init-db.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "echo '=== STARTUP ==='; export NEXTAUTH_URL=\"${NEXTAUTH_URL:-http://localhost:3000}\"; export NEXTAUTH_SECRET=\"${NEXTAUTH_SECRET:-secret-change-me}\"; if [ -z \"$APP_URL\" ] || [ \"$APP_URL\" = '\${NEXTAUTH_URL}' ]; then export APP_URL=\"$NEXTAUTH_URL\"; fi; echo \"NEXTAUTH_URL=$NEXTAUTH_URL\"; echo \"APP_URL=$APP_URL\"; /app/scripts/init-db.sh; echo '=== INICIANDO NODE ==='; exec node server.js 2>&1"]
