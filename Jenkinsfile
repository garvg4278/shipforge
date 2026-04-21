// Jenkinsfile
// ShipForge — Declarative CI/CD Pipeline
//
// Stages:
//   1. Checkout          — clone the repo
//   2. Lint: Backend     — node --check + prisma validate
//   3. Lint: Frontend    — tsc --noEmit (no next lint — bypassed entirely)
//   4. Build: Backend    — docker build backend image
//   5. Build: Frontend   — docker build frontend image
//   6. Push Images       — push both images to Docker Hub (main branch only)
//   7. Health Check      — start full stack, run Python health check script
//   8. Cleanup           — tear down stack (always runs)
//
// Jenkins credentials required (Manage Jenkins → Credentials):
//   dockerhub-credentials   — Username/Password — Docker Hub login
//
// Environment variables configured in Jenkins or set below:
//   DOCKER_REGISTRY         — defaults to docker.io
//   BACKEND_IMAGE           — garvg4278/shipforge-backend
//   FRONTEND_IMAGE          — garvg4278/shipforge-frontend

pipeline {

    agent any

    // ── Global environment ────────────────────────────────────────────────────
    environment {
        BACKEND_IMAGE  = 'garvg4278/shipforge-backend'
        FRONTEND_IMAGE = 'garvg4278/shipforge-frontend'
        NODE_VERSION   = '20'
        IMAGE_TAG      = "${env.GIT_COMMIT?.take(7) ?: 'latest'}"
    }

    // ── Build options ─────────────────────────────────────────────────────────
    options {
        // Keep only the last 10 builds — prevents disk fill
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Fail the entire build if it runs longer than 30 minutes
        timeout(time: 30, unit: 'MINUTES')
        // Don't run concurrent builds on the same branch
        disableConcurrentBuilds()
        // Add timestamps to every log line
        timestamps()
        // Colour terminal output
        ansiColor('xterm')
    }

    // ── Trigger ───────────────────────────────────────────────────────────────
    triggers {
        // Poll SCM every 5 minutes as fallback if webhooks aren't configured
        pollSCM('H/5 * * * *')
    }

    stages {

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 1 — Checkout
        // ─────────────────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Commit: ${env.GIT_COMMIT}"
                echo "Build:  #${env.BUILD_NUMBER}"
                checkout scm
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 2 — Lint: Backend
        // Syntax-checks every .js file and validates the Prisma schema.
        // No database required — prisma validate only reads the schema file.
        // ─────────────────────────────────────────────────────────────────────
        stage('Lint: Backend') {
            steps {
                dir('backend') {
                    sh '''
                        echo "=== Installing backend dependencies ==="
                        npm ci

                        echo "=== Syntax-checking all JS files ==="
                        find . \
                            -name "*.js" \
                            ! -path "./node_modules/*" \
                            ! -path "./prisma/migrations/*" \
                            -print0 | xargs -0 node --check
                        echo "All JS files passed syntax check."

                        echo "=== Validating Prisma schema ==="
                        DATABASE_URL="postgresql://ci:ci@localhost:5432/ci" \
                            npx prisma validate
                        echo "Prisma schema is valid."
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 3 — Lint: Frontend
        // TypeScript type-check only.
        // ESLint via next lint is skipped entirely — it has a known bug in
        // Next.js 16 where it reads npm_lifecycle_event as a directory path.
        // Type safety is fully enforced by tsc --noEmit.
        // ─────────────────────────────────────────────────────────────────────
        stage('Lint: Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        echo "=== Installing frontend dependencies ==="
                        npm ci

                        echo "=== TypeScript type-check ==="
                        npx tsc --noEmit
                        echo "TypeScript check passed."
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 4 — Build: Backend Docker image
        // ─────────────────────────────────────────────────────────────────────
        stage('Build: Backend') {
            steps {
                sh '''
                    echo "=== Building backend Docker image ==="
                    docker build \
                        -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                        -t ${BACKEND_IMAGE}:latest \
                        ./backend
                    echo "Backend image built: ${BACKEND_IMAGE}:${IMAGE_TAG}"
                '''
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 5 — Build: Frontend Docker image
        // NEXT_PUBLIC_API_URL is baked into the JS bundle at build time.
        // ─────────────────────────────────────────────────────────────────────
        stage('Build: Frontend') {
            steps {
                sh '''
                    echo "=== Building frontend Docker image ==="
                    docker build \
                        --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000/api \
                        -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                        -t ${FRONTEND_IMAGE}:latest \
                        ./frontend
                    echo "Frontend image built: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                '''
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 6 — Push images to Docker Hub
        // Only runs on the main branch. Uses the 'dockerhub-credentials'
        // credential stored in Jenkins credential store.
        // ─────────────────────────────────────────────────────────────────────
        stage('Push Images') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "=== Logging in to Docker Hub ==="
                        echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin

                        echo "=== Pushing backend image ==="
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest

                        echo "=== Pushing frontend image ==="
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:latest

                        echo "=== Logging out ==="
                        docker logout
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // STAGE 7 — Health Check
        // Starts the full stack with docker compose and runs the Python health
        // check script against it. Only runs after a successful image push
        // (i.e. on the main branch). Uses a fresh random JWT_SECRET each run.
        // ─────────────────────────────────────────────────────────────────────
        stage('Health Check') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    echo "=== Writing CI environment file ==="
                    JWT=$(python3 -c "import secrets; print(secrets.token_hex(64))")
                    cat > .env <<EOF
POSTGRES_USER=shipforge
POSTGRES_PASSWORD=shipforge_ci
POSTGRES_DB=shipforge
DATABASE_URL=postgresql://shipforge:shipforge_ci@db:5432/shipforge
JWT_SECRET=${JWT}
NODE_ENV=production
PORT=5000
CORS_ORIGIN=http://localhost:3000
EOF

                    echo "=== Starting full stack ==="
                    docker compose up -d

                    echo "=== Waiting for backend to become healthy ==="
                    for i in $(seq 1 30); do
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
                            http://localhost:5000/api/health 2>/dev/null || echo "000")
                        if [ "$STATUS" = "200" ]; then
                            echo "Backend healthy after $((i * 3))s (HTTP 200)"
                            break
                        fi
                        echo "  attempt $i/30 — HTTP $STATUS, retrying in 3s..."
                        sleep 3
                        if [ $i -eq 30 ]; then
                            echo "Backend did not become healthy in 90s"
                            docker compose logs backend --tail 60
                            exit 1
                        fi
                    done

                    echo "=== Running Python health check ==="
                    python3 backend/scripts/health_check.py \
                        --host     localhost \
                        --port     5000 \
                        --skip-env \
                        --timeout  15 \
                        --warn-ms  800
                '''
            }
        }

    } // end stages

    // ── Post-build actions ────────────────────────────────────────────────────
    post {

        always {
            echo "=== Tearing down stack ==="
            sh 'docker compose down -v --remove-orphans 2>/dev/null || true'

            echo "=== Cleaning up local Docker images ==="
            sh '''
                docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG}  2>/dev/null || true
                docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} 2>/dev/null || true
                docker image prune -f 2>/dev/null || true
            '''
        }

        success {
            echo "Pipeline completed successfully."
            echo "Images pushed:"
            echo "  ${BACKEND_IMAGE}:${IMAGE_TAG}"
            echo "  ${FRONTEND_IMAGE}:${IMAGE_TAG}"
        }

        failure {
            echo "Pipeline FAILED — dumping container logs for diagnosis:"
            sh '''
                echo "=== backend logs ==="
                docker compose logs backend --tail 100 2>/dev/null || true
                echo "=== db logs ==="
                docker compose logs db --tail 40 2>/dev/null || true
                echo "=== frontend logs ==="
                docker compose logs frontend --tail 40 2>/dev/null || true
            '''
        }

        unstable {
            echo "Pipeline completed with warnings."
        }

    }

}