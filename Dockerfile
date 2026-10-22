# ==========================================
# Stage 1: Build Frontend, Backend & Shared
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl ca-certificates
RUN corepack enable && corepack prepare pnpm@11.13.0 --activate

# Copy monorepo configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend
COPY packages/frontend ./packages/frontend

# Build packages
RUN pnpm approve-builds --all && \
    pnpm --filter @diary/backend db:generate && \
    pnpm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl ca-certificates tzdata
RUN corepack enable && corepack prepare pnpm@11.13.0 --activate

ENV NODE_ENV=production
ENV PORT=4000

# Copy workspace package manifests & node_modules directly from builder
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/packages/backend/node_modules ./packages/backend/node_modules
COPY --from=builder /app/packages/frontend/node_modules ./packages/frontend/node_modules

# Copy build artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Persistent volumes for SQLite DB, voice notes, and backup archives
VOLUME ["/app/packages/backend/prisma", "/app/packages/backend/uploads", "/app/packages/backend/backups"]

EXPOSE 4000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
