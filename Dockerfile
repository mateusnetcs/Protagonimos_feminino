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

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/database ./database

# mysql2 e bcryptjs para os scripts de init (standalone pode não incluí-los)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./package-lock.json*
RUN npm install --omit=dev mysql2 bcryptjs

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "echo '=== Aguardando MySQL ===' && node scripts/wait-for-mysql.js && echo '=== Inicializando banco ===' && node scripts/setup-database.js && echo '=== Criando admin ===' && node scripts/seed-admin.js && echo '=== Iniciando app ===' && exec node server.js"]
