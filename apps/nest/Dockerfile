# ==========================================
# Stage 1: Build Stage (Context: Root Repo)
# ==========================================
FROM node:24-alpine AS builder

# Membaca versi pnpm eksplisit dari field "packageManager" di package.json
RUN corepack enable && corepack prepare

WORKDIR /app

# Copy manifes monorepo
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/nest/package.json ./apps/nest/

RUN pnpm install --frozen-lockfile

COPY . .

# Build spesifik target service Nest
RUN pnpm --filter @apps/nest build

# Isolasi dependency produksi
RUN pnpm --filter @apps/nest deploy --prod /app/pruned

# ==========================================
# Stage 2: Production Stage
# ==========================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

USER node

COPY --chown=node:node --from=builder /app/pruned/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/apps/nest/dist ./dist
COPY --chown=node:node --from=builder /app/apps/nest/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]