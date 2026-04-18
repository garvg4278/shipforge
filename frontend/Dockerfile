# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
# Install node_modules only. Cached separately from the source code so that
# a code change doesn't re-run npm ci.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Only copy manifests so the layer is cached until these files change
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder
# Compile the Next.js app. NEXT_PUBLIC_API_URL is baked into the JS bundle at
# build time — pass the real backend URL via the build-arg.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept the API URL as a build argument so docker compose / CI can inject it
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Bring in node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source — .dockerignore excludes node_modules, .next, .env files
COPY . .

# next build also runs tsc. Skip ESLint during the Docker build — it's already
# enforced in CI (the lint-frontend job). Failing here for a lint warning would
# prevent valid deployments.
RUN npm run build -- --no-lint || npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3 — runner (minimal production image)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root user — never run production containers as root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the standalone server output (set by `output: 'standalone'` in next.config.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# Copy public assets if they exist (Next.js serves these as-is)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Health check — lets Docker and docker compose know when the container is ready
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]