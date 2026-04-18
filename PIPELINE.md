# CI/CD Pipeline

This document explains the ShipForge GitHub Actions pipeline: what each job does,
why it's structured that way, how to configure it, and how to debug failures.

---

## Overview

The pipeline lives at `.github/workflows/ci-cd.yml` and runs automatically:

| Trigger | What runs |
|---------|-----------|
| Push to `main` | All 4 jobs: lint → build → push to Docker Hub → health check |
| Pull request to `main` | Jobs 1–3 only: lint → build (no push, no health check) |

```
Push to main
│
├─ [1] lint-backend   ──────┐
│   Syntax check + prisma   │
│   validate                ├─── [3] build ──── [4] health-check
├─ [2] lint-frontend        │     Docker        Integration
│   tsc --noEmit + eslint  ─┘     build +        test with
│                                  push           Python script
│
Pull request → jobs 1 + 2 + 3 only (no push, no health-check)
```

---

## Job Details

### Job 1 — `lint-backend`

**What it does:**

1. Installs backend npm dependencies (with `npm ci` — reproducible, uses lockfile)
2. Runs `node --check` on every `.js` file in the backend — catches syntax errors without starting the server
3. Runs `npx prisma validate` — confirms the Prisma schema is syntactically correct and all relations are valid

**Why syntax check instead of a full linter?**

The project doesn't have ESLint configured on the backend. Rather than adding a linter with zero config and getting false positives, `node --check` catches the real breaking errors (syntax) that would cause the Docker build to fail at runtime. If you add ESLint later, replace this step with `npm run lint`.

**Working directory:** `backend/`

---

### Job 2 — `lint-frontend`

**What it does:**

1. Installs frontend npm dependencies
2. Runs `npx tsc --noEmit` — runs the TypeScript compiler across all `.tsx`/`.ts` files without emitting JavaScript output, catching type errors the same way `npm run build` would
3. Runs `npm run lint --if-present` — runs ESLint if it's configured (the `--if-present` flag makes this optional so the job doesn't fail if no lint script exists)

**Working directory:** `frontend/`

---

### Job 3 — `build`

**Runs after:** both lint jobs pass

**What it does:**

1. Sets up Docker Buildx — enables layer caching, multi-platform support
2. Logs into Docker Hub (skipped on pull requests from forks where secrets are unavailable)
3. Builds the backend Docker image from `backend/Dockerfile`
4. Builds the frontend Docker image from `frontend/Dockerfile` with `NEXT_PUBLIC_API_URL` baked in

**Image tags pushed:**

| Tag | When | Usage |
|-----|------|-------|
| `garvg4278/shipforge-backend:latest` | Every push to `main` | `docker compose pull` always gets newest |
| `garvg4278/shipforge-backend:<sha>` | Every push to `main` | Pinpoint rollback to any specific commit |
| `garvg4278/shipforge-frontend:latest` | Every push to `main` | Same |
| `garvg4278/shipforge-frontend:<sha>` | Every push to `main` | Same |

**On pull requests:** images are built but **not pushed**. This proves the Dockerfile works without wasting Docker Hub push quota or contaminating `latest` with unmerged code.

**Layer caching:**

```yaml
cache-from: type=registry,ref=garvg4278/shipforge-backend:buildcache
cache-to:   type=registry,ref=garvg4278/shipforge-backend:buildcache,mode=max
```

On a cold build (no cache), the backend takes ~90s. With cache, unchanged layers (OS, npm install) are reused — typical rebuild time after a code change drops to ~15s.

---

### Job 4 — `health-check`

**Runs after:** build job pushes images
**Skipped on:** pull requests

**What it does:**

1. Writes a fresh `.env` file with a randomly generated `JWT_SECRET` for this run
2. Pulls the images that were just pushed in Job 3
3. Runs `docker compose up -d` — spins up the full stack: PostgreSQL + backend + frontend
4. Polls `/api/health` every 3 seconds for up to 90 seconds until the backend is healthy
5. Runs `backend/scripts/health_check.py` — checks 5 things (see [health check](#health-check-script))
6. Dumps container logs on failure so you can debug without SSHing into the runner
7. Tears down the stack with `docker compose down -v` (cleanup even if step 5 fails)

**Why run this in CI?**

Building a Docker image passing lint doesn't mean the application actually boots correctly. This job proves:
- The backend can connect to PostgreSQL
- Prisma migrations run cleanly
- The API accepts and rejects requests correctly
- The health endpoint shape matches what the Docker healthcheck expects

---

## Health Check Script

`backend/scripts/health_check.py` — a zero-dependency Python script.

**Checks performed:**

| Check | What it validates |
|-------|------------------|
| Environment Variables | `DATABASE_URL` and `JWT_SECRET` are set; JWT is ≥32 chars; DB URL looks like PostgreSQL |
| API Health Endpoint | `GET /api/health` returns `200` with `success:true` and an `uptime` field |
| Auth System | `POST /api/auth/login` with bad creds returns `401` (proves DB is connected and auth middleware is active) |
| 404 Handler | A nonexistent route returns `404` with `{success: false, message: ...}` (confirms app.js catch-all is active) |
| Response Latency | Average of 3 pings to `/api/health` is under 300ms |

**Run it manually:**

```bash
# While Docker stack is running
python3 backend/scripts/health_check.py

# Against a remote host
python3 backend/scripts/health_check.py --host api.yourdomain.com --port 5000 --skip-env

# Machine-readable output (for monitoring tools)
python3 backend/scripts/health_check.py --json

# Strict latency threshold (e.g. 100ms)
python3 backend/scripts/health_check.py --warn-ms 100
```

**Exit codes:** `0` = all passed · `1` = one or more failed

---

## Required GitHub Secrets

Go to your repository → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value | How to get it |
|--------|-------|---------------|
| `DOCKER_USERNAME` | `garvg4278` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your access token | Docker Hub → Account Settings → Security → New Access Token (use Read/Write scope) |

> Use an **access token**, not your Docker Hub password. Tokens can be revoked without changing your password.

---

## Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

If you push two commits in quick succession, the pipeline for the first commit is automatically cancelled when the second starts. This prevents 10-minute old deploys from overwriting a newer one.

---

## Migrating from the Old Workflow

The previous `docker.yml` had one job that did everything in sequence. The new `ci-cd.yml` replaces it. To switch:

```bash
# Delete the old workflow
rm .github/workflows/docker.yml

# The new file is already at .github/workflows/ci-cd.yml
# Add it, commit, and push:
git add .github/workflows/ci-cd.yml
git rm .github/workflows/docker.yml
git commit -m "ci: replace single-job workflow with multi-stage pipeline"
git push
```

The old workflow will stop triggering once it's deleted from the repository.

---

## Debugging a Failed Run

1. **Click the failed job** in the GitHub Actions tab to see step-level output
2. **Lint failure** — look at the `node --check` or `tsc --noEmit` output; it prints the exact file and line number
3. **Build failure** — look at the Docker build step; usually a missing file, bad Dockerfile syntax, or `npm ci` failure
4. **Health check failure** — the "Show container logs on failure" step automatically dumps `docker compose logs backend` and `docker compose logs db` — look for Prisma migration errors or connection refused messages

### Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `DOCKER_USERNAME` not found | Secret not configured | Add it in Settings → Secrets |
| `npm ci` fails | `package-lock.json` out of sync | Run `npm install` locally and commit the updated lockfile |
| Health check: connection refused | Backend didn't start in 90s | Check backend logs; likely a migration error or wrong `DATABASE_URL` |
| `prisma validate` fails | Schema has a broken relation | Fix `prisma/schema.prisma` and run `npx prisma validate` locally first |
| TypeScript errors in CI but not locally | Different `tsconfig.json` or `strict` mode | Run `npx tsc --noEmit` locally to reproduce |

---

## Adding a New Check to the Pipeline

To add a step (e.g. run tests once you write them):

```yaml
# In the lint-backend job, add after the Prisma validate step:
- name: Run backend tests
  run: npm test
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/test_db
```

Keep lint jobs fast (< 60s) and save slower things (integration tests, load tests) for separate jobs that run in parallel.