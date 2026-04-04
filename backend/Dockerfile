# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install only production dependencies first (layer cache optimization)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: Builder (Prisma generate) ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Install ALL deps (including dev) so prisma CLI is available
RUN npm ci && npm cache clean --force

COPY prisma ./prisma
RUN npx prisma generate

# ── Stage 3: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 shipforge

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy generated Prisma client from builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy app source
COPY --chown=shipforge:nodejs . .

# Remove dev files from production image
RUN rm -rf .env.example *.md

# Create logs directory with correct permissions
RUN mkdir -p logs && chown -R shipforge:nodejs logs

USER shipforge

EXPOSE 5000

# Healthcheck for Docker / orchestrators
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
