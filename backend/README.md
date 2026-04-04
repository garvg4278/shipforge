# ShipForge Backend API

Production-grade REST API for the ShipForge logistics platform. Built with Node.js, Express, PostgreSQL, Prisma ORM, JWT authentication, and role-based access control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Logging | Winston + Morgan |
| Security | Helmet, CORS, express-rate-limit |
| DevOps | Docker, Docker Compose |

---

## Project Structure

```
backend/
├── controllers/          # Route handlers (thin — delegate to services)
│   ├── authController.js
│   ├── userController.js
│   ├── shipmentController.js
│   └── adminController.js
├── routes/               # Express routers
│   ├── index.js          # Central registration point
│   ├── auth.js
│   ├── user.js
│   ├── shipments.js
│   └── admin.js
├── middleware/           # Express middleware
│   ├── auth.js           # requireAuth, requireAdmin
│   ├── validate.js       # express-validator result handler
│   ├── errorHandler.js   # Global error catcher
│   └── rateLimiter.js    # Global + auth-specific limiters
├── services/             # Business logic (all DB queries live here)
│   ├── authService.js
│   └── shipmentService.js
├── prisma/
│   ├── schema.prisma     # Database schema + enums
│   └── seed.js           # Creates initial admin account
├── utils/
│   ├── apiResponse.js    # Standardised JSON response helpers
│   ├── helpers.js        # generateOrderId, metrics, pagination
│   ├── jwt.js            # sign / verify / extract token
│   └── validators.js     # All express-validator rule chains
├── config/
│   ├── env.js            # Validated env loader (fails fast)
│   ├── prisma.js         # Singleton Prisma client
│   └── logger.js         # Winston logger (dev: pretty, prod: JSON)
├── app.js                # Express app factory
├── server.js             # Entry point with graceful shutdown
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

### Auth Endpoints

#### POST `/api/auth/signup`
Register a new user account.

**Body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "Password123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { "id": "...", "name": "Rahul Sharma", "email": "...", "role": "USER" },
    "token": "eyJ..."
  }
}
```

#### POST `/api/auth/login`
Authenticate and receive a JWT.

**Body:**
```json
{
  "email": "rahul@example.com",
  "password": "Password123"
}
```

---

### User Endpoints

#### GET `/api/user/profile` `🔒 Auth`
Returns the authenticated user's profile.

---

### Shipment Endpoints (User)

#### POST `/api/shipments` `🔒 Auth`
Create a new shipment order.

**Body:**
```json
{
  "shipmentDate": "2026-04-10",
  "deliveryType": "EXPRESS",
  "fragile": true,
  "insured": false,
  "sender": {
    "name": "Rahul Sharma",
    "address": "45 MG Road",
    "city": "Mumbai",
    "pincode": "400001"
  },
  "receiver": {
    "name": "Priya Mehta",
    "address": "12 Brigade Road",
    "city": "Bangalore",
    "pincode": "560001"
  },
  "packages": [
    {
      "name": "Electronics Box",
      "weight": 2.5,
      "length": 30,
      "width": 20,
      "height": 15,
      "declaredValue": 25000
    }
  ]
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "orderId": "LGX-M7X3K2-A1B2",
    "status": "PENDING",
    "deliveryType": "EXPRESS",
    "fragile": true,
    "insured": false,
    "sender": { "name": "Rahul Sharma", "city": "Mumbai", ... },
    "receiver": { "name": "Priya Mehta", "city": "Bangalore", ... },
    "packages": [...],
    "totalPackages": 1,
    "totalWeight": 2.5,
    "totalDeclaredValue": 25000,
    "createdAt": "2026-04-03T..."
  }
}
```

#### GET `/api/shipments` `🔒 Auth`
Get your own shipments (paginated).

**Query params:** `page`, `limit`, `status`, `deliveryType`

#### GET `/api/shipments/:id` `🔒 Auth`
Get a single shipment you own.

---

### Admin Endpoints

#### GET `/api/admin/shipments` `🔒 Admin`
Get all shipments across all users.

**Query params:** `page`, `limit`, `status`, `deliveryType`, `userId`, `search`

#### GET `/api/admin/shipments/:id` `🔒 Admin`
Get any shipment by ID.

#### PATCH `/api/admin/shipments/:id/status` `🔒 Admin`
Update shipment status.

**Body:**
```json
{ "status": "SHIPPED" }
```

Valid statuses: `PENDING` → `PROCESSING` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED` | `CANCELLED`

#### DELETE `/api/admin/shipments/:id` `🔒 Admin`
Hard-delete a shipment and all its packages/addresses.

#### POST `/api/admin/create-admin` `🔒 Admin`
Create a new admin account.

---

## Local Setup (Without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

### Step 1 — Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/logistics-backend.git
cd logistics-backend
npm install
```

### Step 2 — Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set:
- `DATABASE_URL` pointing to your local PostgreSQL
- `JWT_SECRET` — generate a secure one:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

### Step 3 — Run database migrations
```bash
npm run db:migrate
# or for first-time local dev:
npx prisma migrate dev --name init
```

### Step 4 — Generate Prisma client
```bash
npm run db:generate
```

### Step 5 — Seed the database (creates default admin)
```bash
npm run db:seed
```
Default admin: `admin@shipforge.com` / `Admin@123!`

### Step 6 — Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

API is now running at `http://localhost:5000`

---

## Local Setup (With Docker Compose)

### Prerequisites
- Docker Desktop

### Step 1 — Configure environment
```bash
cp .env.example .env
# Set JWT_SECRET to a strong value
```

### Step 2 — Start the full stack
```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **ShipForge API** on port `5000`
- **Adminer** (database GUI) on port `8080`

### Step 3 — Run migrations + seed
```bash
# Migrations run automatically via the Dockerfile CMD
# To seed the admin:
docker compose exec api node prisma/seed.js
```

### Step 4 — Verify
```bash
curl http://localhost:5000/api/health
```

### Stop
```bash
docker compose down        # keep DB data
docker compose down -v     # also delete DB volume
```

---

## Database Management

```bash
# View schema in browser GUI
npm run db:studio

# Create a new migration after schema change
npx prisma migrate dev --name your_migration_name

# Reset DB (dev only — destroys all data)
npm run db:reset

# Push schema without migration (prototyping only)
npx prisma db push
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing JWTs (min 64 chars) |
| `PORT` | ❌ | `5000` | HTTP port |
| `NODE_ENV` | ❌ | `development` | `development` or `production` |
| `JWT_EXPIRES_IN` | ❌ | `7d` | JWT lifetime |
| `BCRYPT_ROUNDS` | ❌ | `12` | bcrypt work factor |
| `CORS_ORIGIN` | ❌ | `http://localhost:3000` | Allowed frontend origin(s) |
| `RATE_LIMIT_MAX` | ❌ | `100` | Requests per 15-min window |
| `AUTH_RATE_LIMIT_MAX` | ❌ | `10` | Auth endpoint requests per 15-min window |
| `SEED_ADMIN_EMAIL` | ❌ | `admin@shipforge.com` | Default admin email for seeder |
| `SEED_ADMIN_PASSWORD` | ❌ | `Admin@123!` | Default admin password for seeder |

---

## Security Features

- **Passwords** hashed with bcrypt (12 rounds by default)
- **Timing-attack safe** login (always compares hash even for non-existent users)
- **JWT** with issuer + audience claims validation
- **DB verification** on every request (deleted users are rejected immediately)
- **Helmet** sets secure HTTP headers
- **Rate limiting** — 100 req/15min globally, 10 req/15min on auth endpoints
- **Input validation** on every endpoint with express-validator
- **CORS** whitelist with configurable origins
- **Non-root Docker user** — runs as `shipforge` user in container
- **Prisma parameterised queries** — no raw SQL injection risk

---

## Connecting to the Frontend

In your Next.js `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Example fetch in Next.js:
```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipments`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(shipmentPayload),
});
```
