# ShipForge — Logistics Platform

A full-stack logistics shipment management system. Create orders, track packages,
and manage deliveries through a clean web interface backed by a production-ready API.

[![Backend Image](https://img.shields.io/docker/v/garvg4278/shipforge-backend?label=backend&logo=docker)](https://hub.docker.com/r/garvg4278/shipforge-backend)
[![Frontend Image](https://img.shields.io/docker/v/garvg4278/shipforge-frontend?label=frontend&logo=docker)](https://hub.docker.com/r/garvg4278/shipforge-frontend)

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/garvg4278/shipforge-fullstack.git
cd shipforge-fullstack

# 2. Create environment file
cp .env.example .env
# Edit .env — generate a JWT_SECRET:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Run
docker compose up
```

Open **http://localhost:3000** — everything is running.

Default admin: `admin@shipforge.com` / `Admin@123!`
> Change this password immediately after first login.

---

## Project Structure

```
shipforge-fullstack/
├── Jenkinsfile                  ← CI/CD pipeline definition
├── docker-compose.yml           ← Application stack (db + backend + frontend)
├── jenkins/
│   ├── docker-compose.yml       ← Runs Jenkins itself
│   ├── plugins.txt              ← Jenkins plugins installed on startup
│   └── casc.yml                 ← Jenkins config as code
├── frontend/                    Next.js 16 · TypeScript · CSS Modules
│   ├── app/                     Pages: login, signup, dashboard, admin
│   ├── components/              OrderForm, LivePreview, ShipmentList, etc.
│   ├── context/AuthContext.tsx  JWT auth state
│   ├── hooks/useShipments.ts    Data fetching hook
│   └── lib/api.ts               Typed API client
├── backend/                     Node.js · Express · Prisma · PostgreSQL
│   ├── controllers/             Route handlers
│   ├── routes/                  Express routers
│   ├── middleware/              requireAuth, requireAdmin, validate, etc.
│   ├── services/                Business logic + DB queries
│   ├── prisma/                  Schema, migrations, seed
│   └── scripts/
│       └── health_check.py      Python health check script
├── DEPLOYMENT.md                Deployment guide
└── PIPELINE.md                  Jenkins CI/CD pipeline docs
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 16 |
| Frontend language | TypeScript | 5 |
| Frontend styling | CSS Modules | — |
| Backend runtime | Node.js | 20 |
| Backend framework | Express.js | 4 |
| Database | PostgreSQL | 15 |
| ORM | Prisma | 5 |
| Auth | JWT + bcryptjs | — |
| Security | Helmet, CORS, express-rate-limit | — |
| Logging | Winston + Morgan | — |
| Containers | Docker + Docker Compose | — |
| CI/CD | Jenkins | LTS |

---

## Application Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Sign in |
| `/signup` | Public | Register |
| `/dashboard` | USER + ADMIN | Create orders, view history |
| `/admin` | ADMIN only | All shipments, status updates, admin management |

---

## API Reference

**Base URL:** `http://localhost:5000/api`

All protected endpoints require: `Authorization: Bearer <token>`

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/user/profile

POST   /api/shipments
GET    /api/shipments
GET    /api/shipments/:id

GET    /api/admin/shipments
GET    /api/admin/shipments/:id
PATCH  /api/admin/shipments/:id/status
DELETE /api/admin/shipments/:id
POST   /api/admin/create-admin

GET    /api/health
```

---

## CI/CD Pipeline

ShipForge uses **Jenkins** for CI/CD. The pipeline is defined in `Jenkinsfile`
at the project root.

**Stages on every commit:**
1. Checkout
2. Lint Backend (syntax check + Prisma validate)
3. Lint Frontend (TypeScript type-check)
4. Build Backend Docker image
5. Build Frontend Docker image

**Additional stages on `main` branch only:**

6. Push images to Docker Hub
7. Integration health check (full stack boot + Python script)

**Start Jenkins:**
```bash
cd jenkins
docker compose up -d
# Open http://localhost:8080  (admin / admin123)
```

See [PIPELINE.md](./PIPELINE.md) for full setup instructions.

---

## Development Commands

### Backend
```bash
cd backend
npm run dev          # start with auto-reload
npm run db:studio    # Prisma Studio at http://localhost:5555
npm run db:seed      # create admin@shipforge.com / Admin@123!
```

### Frontend
```bash
cd frontend
npm run dev          # Next.js dev server at http://localhost:3000
npm run build        # production build
```

### Health Check
```bash
python3 backend/scripts/health_check.py
python3 backend/scripts/health_check.py --json
```

---

## Docker Images

| Image | Docker Hub |
|-------|-----------|
| Backend | `garvg4278/shipforge-backend:latest` |
| Frontend | `garvg4278/shipforge-frontend:latest` |

---

## Author

**Garv Gupta**