# ==========================================
# Stage 1: Build Stage
# ==========================================
FROM node:24 AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

RUN pnpm build

# ==========================================
# Stage 2: Production Stage (Node.js Runtime)
# ==========================================
FROM node:24 AS runner

WORKDIR /app

ENV NODE_ENV=production

# Menjalankan sebagai non-root user demi keamanan
USER node

# Copy hasil build dan manifest
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]
