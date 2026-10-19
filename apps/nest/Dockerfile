# ==========================================
# Stage 1: Build Stage (Context: Root Repo)
# ==========================================
FROM node:24-alpine AS builder

# 1. Tentukan working directory terlebih dahulu
WORKDIR /app

# 2. Copy file manifest root yang berisi field "packageManager"
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

COPY libs/logger/package.json libs/logger/

# 3. Baru jalankan corepack prepare setelah package.json tersedia
RUN corepack enable && corepack prepare

# 4. Copy package.json milik aplikasi Nest & packages shared (jika ada)
COPY apps/nest/package.json ./apps/nest/

# 5. Install seluruh dependency workspace
RUN pnpm install --frozen-lockfile

# 6. Copy seluruh source code repositori
COPY . .

# 7. Build spesifik aplikasi Nest
RUN pnpm --filter @app/nest build

# 8. Isolasi dependency produksi
RUN pnpm --filter @app/nest deploy --prod /app/pruned

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
