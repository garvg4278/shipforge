# ShipForge — Logistics Platform

A full-stack logistics shipment management system. Create orders, track packages, and manage deliveries through a clean web interface backed by a production-ready API.

[![CI/CD Pipeline](https://github.com/garvg4278/shipforge-fullstack/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/garvg4278/shipforge-fullstack/actions/workflows/ci-cd.yml)
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

Default admin login: `admin@shipforge.com` / `Admin@123!`
> Change this password immediately after first login.

---

## What It Does

ShipForge gives two types of users a purpose-built interface:

**Customers** can sign up, log in, and create shipment orders. Each order includes sender and receiver addresses, one or more packages with dimensions and declared value, and delivery options (Standard or Express). Orders get a unique ID (e.g. `LGX-M7X3-AB12`) and appear in a live preview as you type.

**Admins** see all orders from all customers. They can update shipment status through its lifecycle (Pending → Processing → Shipped → Out for Delivery → Delivered), delete orders, and create additional admin accounts.

---

## Project Structure

```
shipforge-fullstack/
├── frontend/                   Next.js 16 · TypeScript · CSS Modules
│   ├── app/
│   │   ├── login/              Public login page
│   │   ├── signup/             Public registration page
│   │   ├── dashboard/          User order form + shipment history
│   │   └── admin/              Admin control panel
│   ├── components/
│   │   ├── OrderForm/          Two-panel shipment creation form
│   │   ├── LivePreview/        Real-time order preview (right panel)
│   │   ├── ShipmentList/       Expandable shipment cards
│   │   ├── StatusBadge/        Colour-coded status indicators
│   │   └── ui/                 InputField, AddressBlock, FormSection, etc.
│   ├── context/AuthContext.tsx  JWT auth state (login/logout/rehydrate)
│   ├── hooks/useShipments.ts   Shipment data fetching hook
│   └── lib/api.ts              Typed API client for all endpoints
│
├── backend/                    Node.js · Express · Prisma · PostgreSQL
│   ├── controllers/            Route handlers (auth, user, shipment, admin)
│   ├── routes/                 Express routers (auth, user, shipments, admin)
│   ├── middleware/             requireAuth, requireAdmin, validate, errorHandler
│   ├── services/               Business logic + all DB queries
│   ├── utils/                  apiResponse, jwt, helpers, validators
│   ├── config/                 env.js, prisma.js, logger.js
│   ├── prisma/
│   │   ├── schema.prisma       Database schema (User, Shipment, Address, Package)
│   │   ├── migrations/         Version-controlled schema migration history
│   │   └── seed.js             Creates default admin account on first run
│   └── scripts/
│       └── health_check.py     Operational health check script (Python 3)
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml           Multi-stage CI/CD pipeline
│
├── docker-compose.yml          Full stack: PostgreSQL + backend + frontend
├── DEPLOYMENT.md               Complete deployment guide (local, Docker, cloud)
└── PIPELINE.md                 CI/CD pipeline explanation and debugging guide
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | Next.js | 16 |
| Frontend language | TypeScript | 5 |
| Frontend styling | CSS Modules | — |
| Backend runtime | Node.js | 20 |
| Backend framework | Express.js | 4 |
| Database | PostgreSQL | 15 |
| ORM | Prisma | 5 |
| Authentication | JWT + bcryptjs | — |
| Security | Helmet, CORS, express-rate-limit | — |
| Logging | Winston + Morgan | — |
| Containers | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |

---

## Application Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Sign in to your account |
| `/signup` | Public | Create a new customer account |
| `/dashboard` | USER + ADMIN | Create orders; view your shipment history |
| `/admin` | ADMIN only | View all shipments; update status; delete; create admins |

The root `/` redirects automatically: unauthenticated → `/login`, user → `/dashboard`, admin → `/admin`.

---

## API Reference

**Base URL:** `http://localhost:5000/api`

All protected endpoints require: `Authorization: Bearer <token>`

### Auth

```
POST /api/auth/signup     Create a new user account
POST /api/auth/login      Authenticate and receive a JWT
```

### User

```
GET  /api/user/profile    Get the logged-in user's profile
```

### Shipments (user's own data only)

```
POST /api/shipments         Create a new shipment order
GET  /api/shipments         List your shipments  ?page=1&limit=20&status=PENDING
GET  /api/shipments/:id     Get one of your shipments by ID
```

### Admin (all users' data)

```
GET    /api/admin/shipments              All shipments  ?search=LGX&status=SHIPPED
GET    /api/admin/shipments/:id          Any shipment by ID
PATCH  /api/admin/shipments/:id/status   Update status  body: { "status": "SHIPPED" }
DELETE /api/admin/shipments/:id          Delete a shipment
POST   /api/admin/create-admin           Create a new admin account
```

### Health

```
GET /api/health     Returns service status, version, and uptime — no auth required
```

---

## Database Schema

Four tables managed by Prisma:

```
users
  id · name · email (unique) · password (bcrypt hash) · role (USER|ADMIN) · createdAt

shipments
  id · orderId (unique, LGX-xxxx) · userId (→ users) · shipmentDate · deliveryType
  fragile · insured · status · createdAt

addresses
  id · shipmentId (→ shipments) · type (SENDER|RECEIVER) · name · address · city · pincode

packages
  id · shipmentId (→ shipments) · name · weight · length · width · height · declaredValue
```

Migrations live in `backend/prisma/migrations/`. Prisma runs them automatically on startup (`prisma migrate deploy`).

---

## Development Commands

### Backend

```bash
cd backend

npm run dev              # start with nodemon (auto-reload)
npm run db:studio        # open Prisma Studio at http://localhost:5555
npm run db:seed          # create admin@shipforge.com / Admin@123!
npm run db:migrate       # run pending migrations (production)
npx prisma migrate dev   # create + run a new migration (development)
```

### Frontend

```bash
cd frontend

npm run dev     # start Next.js dev server at http://localhost:3000
npm run build   # production build (also type-checks)
npm run lint    # run ESLint
```

### Health Check

```bash
# Run against the local Docker stack
python3 backend/scripts/health_check.py

# Run against any environment
python3 backend/scripts/health_check.py --host api.yourdomain.com --port 5000 --skip-env

# Machine-readable output
python3 backend/scripts/health_check.py --json
```

---

## CI/CD Pipeline

Every push to `main` runs a four-stage pipeline automatically:

1. **Lint (backend)** — Node.js syntax check on all JS files + Prisma schema validation
2. **Lint (frontend)** — TypeScript type-check (`tsc --noEmit`) + ESLint
3. **Build** — Docker images built and pushed to Docker Hub with `latest` and `<git-sha>` tags
4. **Health check** — Full stack booted in CI; Python health check script validates all endpoints

Stages 3 and 4 are skipped on pull requests (build-only, no push, no integration test).

See [PIPELINE.md](./PIPELINE.md) for the full breakdown and debugging guide.

---

## Docker Images

Built and published automatically on every push to `main`:

| Image | Docker Hub |
|-------|-----------|
| Backend | `garvg4278/shipforge-backend:latest` |
| Frontend | `garvg4278/shipforge-frontend:latest` |

Each push also tags by commit SHA for pinned rollbacks:
`garvg4278/shipforge-backend:4c3eb11`

---

## Deployment

Full instructions for every environment in [DEPLOYMENT.md](./DEPLOYMENT.md):

- Local development (no Docker)
- Docker Compose (recommended)
- Production VPS with Nginx
- Render.com (free tier)
- Vercel + Railway (frontend/backend split)

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with issuer/audience claims + 7-day expiry
- DB user-existence check on every protected request
- Rate limiting: 100 req/15min globally, 10 req/15min on auth endpoints
- Helmet.js sets `X-Content-Type-Options`, `X-Frame-Options`, and other secure headers
- CORS whitelist configurable via `CORS_ORIGIN` env var
- Input validation with express-validator on every endpoint
- Timing-safe login (always runs bcrypt.compare even for nonexistent users)

---

## Author

**Garv Gupta**

---

*Give it a ⭐ on GitHub if you found it useful.*