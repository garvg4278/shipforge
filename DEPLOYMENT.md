# Deployment Guide

This document covers every way to run ShipForge — from a laptop to a cloud VM.
All commands use the actual config values in this repository.

---

## Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Local Development](#local-development)
4. [Docker (Recommended)](#docker-recommended)
5. [Production Server (VPS / Cloud VM)](#production-server-vps--cloud-vm)
6. [Render.com (Free Tier)](#rendercom-free-tier)
7. [Vercel + Railway (Frontend/Backend Split)](#vercel--railway-frontendbackend-split)
8. [Health Verification](#health-verification)
9. [Upgrading](#upgrading)
10. [Rollback](#rollback)

---

## Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Docker Desktop | Latest | Runs the full stack with one command |
| Node.js | 18 or higher | Required for local development without Docker |
| PostgreSQL | 15 or higher | Only needed if running without Docker |
| Python | 3.9 or higher | For the health check script |
| Git | Any | Cloning and pulling updates |

---

## Environment Variables

The project has **two** `.env` files:

| File | Used by | Contains |
|------|---------|----------|
| `.env` (root) | `docker-compose.yml` | `DATABASE_URL`, `JWT_SECRET` |
| `backend/.env` | Local dev / `npm run dev` | All backend vars (PORT, CORS, etc.) |

### Root `.env` (for Docker)

Copy the example and fill in the two required values:

```bash
cp .env.example .env
```

Minimum required content:

```env
DATABASE_URL=postgresql://shipforge:shipforge_dev@db:5432/shipforge
JWT_SECRET=<generate with command below>
```

Generate a secure `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Backend `.env` (for local dev)

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://shipforge:shipforge_dev@localhost:5432/shipforge
JWT_SECRET=<same 64-char hex string as above>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

> **Never commit `.env` files.** They are already in `.gitignore`.
> The root `.gitignore` covers `**/.env` — both the root and backend `.env` are protected.

---

## Local Development

No Docker required. You need Node.js 18+ and a running PostgreSQL instance.

### 1. Start a PostgreSQL container (if you don't have PostgreSQL installed locally)

```bash
docker run -d \
  --name shipforge_db \
  -e POSTGRES_USER=shipforge \
  -e POSTGRES_PASSWORD=shipforge_dev \
  -e POSTGRES_DB=shipforge \
  -p 5432:5432 \
  postgres:15
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

npm install
npx prisma migrate dev --name init   # creates all tables
npm run db:seed                       # creates admin@shipforge.com / Admin@123!
npm run dev                           # starts on http://localhost:5000
```

### 3. Set up the frontend (new terminal)

```bash
cd frontend
# .env.local is already committed and points to http://backend:5000/api
# For local dev, the URL is http://localhost:5000/api — override if needed:
# echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

npm install
npm run dev      # starts on http://localhost:3000
```

### 4. Verify

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000/api |
| Health | http://localhost:5000/api/health |
| Prisma Studio | `cd backend && npm run db:studio` → http://localhost:5555 |

---

## Docker (Recommended)

The fastest way to run the full stack with a single command.

### First time on a new machine

```bash
# 1. Clone
git clone https://github.com/garvg4278/shipforge-fullstack.git
cd shipforge-fullstack

# 2. Create .env
cp .env.example .env
# Edit .env — set JWT_SECRET to a 64-char random hex string

# 3. Start everything
docker compose up
```

This automatically:
- Starts PostgreSQL on port `5432`
- Runs all Prisma migrations
- Seeds the admin account (`admin@shipforge.com` / `Admin@123!`)
- Starts the backend API on port `5000`
- Starts the Next.js frontend on port `3000`

### Run in the background

```bash
docker compose up -d

# Follow logs
docker compose logs -f

# Follow one service
docker compose logs -f backend
```

### Stop

```bash
docker compose down          # stop containers, keep DB volume
docker compose down -v       # stop containers AND delete DB data
```

### Pull latest images from Docker Hub

```bash
docker compose pull
docker compose up -d
```

Images are published to Docker Hub automatically by the CI pipeline on every push to `main`:
- `garvg4278/shipforge-backend:latest`
- `garvg4278/shipforge-frontend:latest`

---

## Production Server (VPS / Cloud VM)

For deployment to a DigitalOcean Droplet, AWS EC2, or any Ubuntu 22.04 VM.

### One-time server setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### Deploy ShipForge

```bash
# Clone the repository
git clone https://github.com/garvg4278/shipforge-fullstack.git
cd shipforge-fullstack

# Create production .env
cp .env.example .env
nano .env   # set JWT_SECRET and optionally change POSTGRES_PASSWORD

# Start
docker compose up -d

# Check status
docker compose ps
docker compose logs backend --tail 20
```

### Keep it running after server restart

```bash
# Add --restart unless-stopped to each service (already set in Dockerfile CMD)
# Or enable Docker to start on boot:
sudo systemctl enable docker
```

### Nginx reverse proxy (optional but recommended for production)

Install Nginx and point it to the containers:

```nginx
# /etc/nginx/sites-available/shipforge
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/shipforge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Add HTTPS with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Render.com (Free Tier)

### Deploy the backend as a Web Service

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repository
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npx prisma migrate deploy && node server.js`
4. Add environment variables (from `backend/.env.example`)
5. Create a **PostgreSQL** database on Render and copy the connection string into `DATABASE_URL`

### Deploy the frontend as a Static Site

1. New → Static Site
2. Connect the same repository
3. Set:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `frontend/.next`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api`

---

## Vercel + Railway (Frontend/Backend Split)

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set in Vercel dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_API_URL = https://your-railway-backend.up.railway.app/api
```

### Backend → Railway

1. New project → Deploy from GitHub repo
2. Set **Root Directory** to `backend`
3. Add all variables from `backend/.env.example`
4. Railway auto-detects Node.js and runs `npm start`
5. Add a PostgreSQL plugin from the Railway dashboard

---

## Health Verification

After any deployment, run the health check script to validate everything is working:

```bash
# Against local Docker stack
python3 backend/scripts/health_check.py

# Against a remote server
python3 backend/scripts/health_check.py --host your-server.com --port 5000 --skip-env

# JSON output (for monitoring/alerting integrations)
python3 backend/scripts/health_check.py --json | jq .

# Against a production Render/Railway deployment
python3 backend/scripts/health_check.py \
  --host your-backend.onrender.com \
  --port 443 \
  --skip-env
```

The script checks:
1. Environment variables are set and valid
2. `GET /api/health` returns `200` with correct shape
3. `POST /api/auth/login` returns `401` (auth system + DB reachable)
4. `GET /api/unknown-route` returns `404` JSON (error handler active)
5. Average latency across 3 pings is under 300ms

Exit code `0` means all checks passed. Exit code `1` means at least one failed.

---

## Upgrading

```bash
# Pull the latest code
git pull origin main

# Pull the latest Docker images
docker compose pull

# Restart with zero-downtime (compose handles it)
docker compose up -d --no-build

# If the schema changed, migrations run automatically on backend startup
# (the Dockerfile CMD runs: npx prisma migrate deploy && node server.js)
```

---

## Rollback

Every push to `main` creates two Docker tags:
- `garvg4278/shipforge-backend:latest` — always the newest
- `garvg4278/shipforge-backend:<git-sha>` — pinned to a specific commit

To roll back to a previous commit:

```bash
# Find the commit SHA you want to roll back to
git log --oneline -10

# Edit docker-compose.yml — replace 'latest' with the specific SHA
# backend:
#   image: garvg4278/shipforge-backend:4c3eb11

docker compose up -d
```

Or use git revert to create a proper rollback commit:

```bash
git revert HEAD
git push origin main
# CI will build and push a new 'latest' image from the reverted code
```