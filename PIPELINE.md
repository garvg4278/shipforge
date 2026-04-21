# CI/CD Pipeline — Jenkins

ShipForge uses **Jenkins** running in Docker as its CI/CD server. The pipeline
is defined in `Jenkinsfile` at the project root and uses Docker to build and
push images to Docker Hub on every push to `main`.

---

## Pipeline Overview

```
Push to main
│
├─ Stage 1: Checkout
├─ Stage 2: Lint — Backend      (node --check + prisma validate)
├─ Stage 3: Lint — Frontend     (tsc --noEmit)
├─ Stage 4: Build — Backend     (docker build)
├─ Stage 5: Build — Frontend    (docker build)
├─ Stage 6: Push Images         (docker push → Docker Hub)   ← main only
├─ Stage 7: Health Check        (docker compose up + Python script)
└─ Post:    Cleanup             (always — tears down stack, prunes images)
```

Stages 6 and 7 only run on the `main` branch. On feature branches, only
lint and build stages run (verifies the code compiles without pushing anything).

---

## Running Jenkins

Jenkins runs as a Docker container defined in `jenkins/docker-compose.yml`.
It is **completely separate** from the application's `docker-compose.yml`.

### Start Jenkins

```bash
cd jenkins
docker compose up -d
```

First startup takes 2–3 minutes while plugins install. Watch progress:

```bash
docker compose logs -f
# Wait for: "Jenkins is fully up and running"
```

Open **http://localhost:8080**

Default login: `admin` / `admin123`
**Change this password immediately** after first login.

### Stop Jenkins

```bash
cd jenkins
docker compose down        # keeps build history (jenkins_data volume)
docker compose down -v     # deletes all data including job history
```

---

## First-Time Setup After Starting Jenkins

### Step 1 — Add Docker Hub credentials

1. Go to **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**
2. Fill in:
   - **Kind:** Username with password
   - **Username:** `garvg4278`
   - **Password:** your Docker Hub access token *(not your login password —
     create one at hub.docker.com → Account Settings → Security → New Token)*
   - **ID:** `dockerhub-credentials` ← must match this exactly
   - **Description:** Docker Hub — garvg4278
3. Click **Create**

### Step 2 — Create the pipeline job

1. Click **New Item**
2. Enter name: `shipforge`
3. Select **Pipeline** → click OK
4. Under **Build Triggers**, tick **Poll SCM** and enter `H/5 * * * *`
   *(or configure a GitHub webhook — see Webhooks section below)*
5. Under **Pipeline**, select **Pipeline script from SCM**
6. **SCM:** Git
7. **Repository URL:** `https://github.com/garvg4278/shipforge-fullstack.git`
8. **Branch:** `*/main`
9. **Script Path:** `Jenkinsfile`
10. Click **Save**

### Step 3 — Run the pipeline

Click **Build Now** to trigger the first run manually.
The pipeline will run through all stages and show results in Blue Ocean.

---

## Pipeline Files

| File | Purpose |
|------|---------|
| `Jenkinsfile` | Pipeline definition (stages, steps, post actions) |
| `jenkins/docker-compose.yml` | Runs the Jenkins server container |
| `jenkins/plugins.txt` | Plugins installed on first Jenkins startup |
| `jenkins/casc.yml` | Jenkins config as code (admin user, tools, security) |

---

## Jenkinsfile Stage Details

### Stage 2 — Lint: Backend
Runs `node --check` on every `.js` file (excludes `node_modules` and Prisma
migrations). Also runs `npx prisma validate` with a dummy `DATABASE_URL` —
this only reads the schema file, no live database needed.

### Stage 3 — Lint: Frontend
Runs `npx tsc --noEmit` — TypeScript compiler in check-only mode. This catches
all type errors across every `.tsx` and `.ts` file without emitting JS output.

**Note:** `next lint` (ESLint) is intentionally skipped. Next.js 16 has a
confirmed bug where it reads the `npm_lifecycle_event` environment variable as
a directory path, causing `Invalid project directory` errors regardless of how
the command is invoked. TypeScript type-checking enforces code correctness.

### Stage 6 — Push Images
Only runs on the `main` branch. Uses the `dockerhub-credentials` stored in
Jenkins to authenticate with Docker Hub. Pushes two tags per image:
- `:latest` — always the newest build
- `:<git-sha>` — pinned to exact commit for rollbacks

### Stage 7 — Health Check
Writes a fresh `.env` with a randomly generated `JWT_SECRET`, starts the full
application stack with `docker compose up -d`, waits for `GET /api/health` to
return HTTP 200, then runs `backend/scripts/health_check.py` which validates
5 endpoints. Tears down the stack in the `post { always }` block.

---

## GitHub Webhook (optional — faster than polling)

Instead of polling every 5 minutes, configure a webhook so GitHub notifies
Jenkins instantly on every push:

1. Your Jenkins must be publicly accessible (or use ngrok for local dev)
2. GitHub repo → **Settings → Webhooks → Add webhook**
3. **Payload URL:** `http://YOUR_JENKINS_IP:8080/github-webhook/`
4. **Content type:** `application/json`
5. **Events:** Just the push event
6. In Jenkins job → **Build Triggers** → tick **GitHub hook trigger for GITScm polling**

---

## Debugging a Failed Build

1. Click the failed build number in Jenkins
2. Click **Console Output** to see the full log
3. The `post { failure }` block automatically dumps `docker compose logs` for
   backend, db, and frontend — look for these in the console output
4. Common failure causes:
   - Docker Hub push fails → check `dockerhub-credentials` are correct
   - Health check timeout → check `docker compose logs backend` output in the log
   - TypeScript errors → look at the `Lint: Frontend` stage output

---

## Docker Images

Built and pushed by the pipeline on every successful `main` branch build:

| Image | Tag |
|-------|-----|
| `garvg4278/shipforge-backend` | `:latest` and `:<git-sha>` |
| `garvg4278/shipforge-frontend` | `:latest` and `:<git-sha>` |