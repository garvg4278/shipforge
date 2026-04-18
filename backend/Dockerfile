# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
# Install production dependencies only. Cached until package-lock.json changes.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# --omit=dev skips nodemon and other devDependencies from the production image
RUN npm ci --omit=dev --prefer-offline

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder
# Needs devDependencies (prisma CLI) to generate the Prisma client.
# The generated client is then copied into the runner stage.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL — required by the Prisma query engine on Debian/slim images
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Install all deps here (includes prisma CLI in devDependencies)
RUN npm ci --prefer-offline

COPY . .

# Generate the Prisma client into node_modules/@prisma and node_modules/.prisma
RUN npx prisma generate

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3 — runner (minimal production image)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL — required by the Prisma query engine at runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user — never run production containers as root
RUN groupadd --system --gid 1001 nodejs \
    && useradd  --system --uid 1001 --gid nodejs shipforge

# Copy production node_modules (no devDeps) from the deps stage
COPY --from=deps    --chown=shipforge:nodejs /app/node_modules ./node_modules

# Copy the generated Prisma client from the builder stage (replaces the stub in deps)
COPY --from=builder --chown=shipforge:nodejs /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder --chown=shipforge:nodejs /app/node_modules/@prisma  ./node_modules/@prisma

# Copy application source
COPY --chown=shipforge:nodejs . .

# Create logs directory with correct ownership
RUN mkdir -p logs && chown shipforge:nodejs logs

USER shipforge

EXPOSE 5000

# Health check — Docker and docker compose use this to determine readiness.
# curl hits the /api/health endpoint defined in routes/index.js.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD curl -sf http://localhost:5000/api/health || exit 1

# Run migrations first (idempotent — safe to run on every start),
# then seed the admin account (seed.js checks for existence before inserting),
# then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node server.js"]