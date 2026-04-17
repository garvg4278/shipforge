# 🚀 ShipForge — Full-Stack Logistics Platform

A **production-ready logistics shipment management system** built with modern full-stack technologies and fully containerized using Docker.

---

## 📦 Project Structure

```
shipforge-fullstack/
├── frontend/    Next.js 16 + TypeScript
├── backend/     Node.js + Express + Prisma + PostgreSQL
└── docker-compose.yml
```

---

## ⚡ One-Command Setup (Recommended)

Run the entire application using Docker:

```bash
docker compose up
```

---

## ⚠️ First-Time Setup (Required Once)

Before running the app on a new machine:

```bash
cp .env.example .env
```

👉 This creates required environment variables.

---

## 🌐 Access the Application

| Service  | URL                              |
| -------- | -------------------------------- |
| Frontend | http://localhost:3000            |
| Backend  | http://localhost:5000/api        |
| Health   | http://localhost:5000/api/health |

---

## 🔐 Default Credentials

| Role  | Email                                             | Password   |
| ----- | ------------------------------------------------- | ---------- |
| Admin | [admin@shipforge.com](mailto:admin@shipforge.com) | Admin@123! |

> ⚠️ Change the admin password after first login.

---

## 🧠 What Happens Automatically

When you run:

```bash
docker compose up
```

The system will:

* ✅ Start PostgreSQL database
* ✅ Run Prisma migrations
* ✅ Seed admin user automatically
* ✅ Start backend server
* ✅ Start frontend

👉 No manual setup required after `.env` creation.

---

## 🛠 Local Development (Without Docker)

### 1. Start PostgreSQL (Docker)

```bash
docker run -d --name shipforge_db \
  -e POSTGRES_USER=shipforge \
  -e POSTGRES_PASSWORD=shipforge_dev \
  -e POSTGRES_DB=shipforge \
  -p 5432:5432 \
  postgres:16-alpine
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://shipforge:shipforge_dev@localhost:5432/shipforge
JWT_SECRET=your_secret_key
```

Then:

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔗 Application Routes

| Route      | Access     | Description      |
| ---------- | ---------- | ---------------- |
| /login     | Public     | Login            |
| /signup    | Public     | Register         |
| /dashboard | User/Admin | Manage shipments |
| /admin     | Admin only | Admin panel      |

---

## 📡 API Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/user/profile

POST   /api/shipments
GET    /api/shipments
GET    /api/shipments/:id

GET    /api/admin/shipments
PATCH  /api/admin/shipments/:id/status
DELETE /api/admin/shipments/:id

GET    /api/health
```

---

## 🧰 Tech Stack

| Layer    | Technology             |
| -------- | ---------------------- |
| Frontend | Next.js 16, TypeScript |
| Backend  | Node.js, Express       |
| Database | PostgreSQL             |
| ORM      | Prisma                 |
| Auth     | JWT + bcrypt           |
| DevOps   | Docker, Docker Compose |

---

## 🐳 Docker Images

This project is fully containerized and available via Docker Hub:

* Frontend: `garvg4278/shipforge-frontend`
* Backend: `garvg4278/shipforge-backend`

---

## 📌 Key Features

* 🔐 Authentication (JWT)
* 📦 Shipment Management
* 👤 Role-based Access (Admin/User)
* 🐳 Fully Dockerized
* ⚡ One-command startup
* 🧱 Clean architecture

---

## 🚀 Deployment (Coming Next)

This project is ready for:

* 🌍 Cloud deployment (AWS / Render)
* 🔐 HTTPS setup
* ⚙️ CI/CD pipelines

---

## 👨‍💻 Author

Garv Gupta

---

## ⭐ If you like this project

Give it a star ⭐ on GitHub!
