# ShipForge — Full-Stack Logistics Platform

A complete, production-ready logistics shipment management system.

```
shipforge-fullstack/
├── frontend/    Next.js 16 + TypeScript + CSS Modules
└── backend/     Node.js + Express + PostgreSQL + Prisma + JWT
```

---

## Quick Start (Local Development — No Docker)

### Step 1 — Start PostgreSQL
Either install PostgreSQL locally or use Docker for just the DB:
```bash
docker run -d --name shipforge_db \
  -e POSTGRES_USER=shipforge \
  -e POSTGRES_PASSWORD=shipforge_dev \
  -e POSTGRES_DB=shipforge \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 2 — Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and generate a JWT_SECRET:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

npm install
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed          # creates admin@shipforge.com / Admin@123!
npm run dev              # runs on http://localhost:5000
```

### Step 3 — Setup Frontend
```bash
cd frontend
# .env.local already points to http://localhost:5000/api

npm install
npm run dev              # runs on http://localhost:3000
```

### Step 4 — Open the app
- **App:** http://localhost:3000
- **API:** http://localhost:5000/api/health
- **Prisma Studio:** `cd backend && npm run db:studio`

---

## Quick Start (Docker — Full Stack)

```bash
# 1. Copy and configure env
cp .env.example .env
# Edit .env — set a strong JWT_SECRET

# 2. Start everything
docker compose up -d

# 3. Seed the admin account
docker compose exec backend node prisma/seed.js

# 4. Open http://localhost:3000
```

---

## Default Credentials (after seeding)

| Role  | Email                   | Password    |
|-------|-------------------------|-------------|
| Admin | admin@shipforge.com     | Admin@123!  |
| User  | Register at /signup     | Your choice |

**Change the admin password after first login.**

---

## Application Routes

| Route       | Access        | Description                        |
|-------------|---------------|------------------------------------|
| `/login`    | Public        | Sign in                            |
| `/signup`   | Public        | Create user account                |
| `/dashboard`| USER + ADMIN  | Create orders, view own shipments  |
| `/admin`    | ADMIN only    | All shipments, status updates, delete, create admins |

---

## API Endpoints Summary

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

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Next.js 16, TypeScript, CSS Modules           |
| Backend    | Node.js, Express.js                           |
| Database   | PostgreSQL 16                                 |
| ORM        | Prisma 5                                      |
| Auth       | JWT + bcryptjs                                |
| Security   | Helmet, CORS, express-rate-limit              |
| Logging    | Winston + Morgan                              |
| DevOps     | Docker, Docker Compose                        |
