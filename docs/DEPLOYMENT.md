# PayFlow — Deployment Guide

## Table of Contents
1. [Local Development](#local-development)
2. [Backend → Railway](#backend--railway)
3. [Backend → Render](#backend--render)
4. [Frontend → Vercel](#frontend--vercel)
5. [Database Setup](#database-setup)
6. [Environment Reference](#environment-reference)

---

## Local Development

### Prerequisites
- Docker Desktop 4.x+
- Java 21+ (for backend-only dev)
- Node.js 20+ (for frontend-only dev)

### Full Stack with Docker Compose

```bash
# Clone and enter project
git clone https://github.com/youruser/payflow.git
cd payflow

# (Optional) create a .env file with overrides
cat > .env << 'ENVEOF'
JWT_SECRET=my-local-super-secret-key-minimum-64-chars-here-payflow-2024
CORS_ALLOWED_ORIGINS=http://localhost:3000
ENVEOF

# Start everything
docker compose up -d

# Check health
docker compose ps
docker compose logs backend --tail=50

# Access points:
# Frontend:    http://localhost:3000
# Backend API: http://localhost:8080/api
# Swagger:     http://localhost:8080/api/swagger-ui.html
# Kafka UI:    http://localhost:8090  (run: docker compose --profile dev up -d)
```

### Backend Only (hot-reload)

```bash
# Start infra
docker compose up -d postgres redis zookeeper kafka

# Run backend with dev profile
cd backend
mvn spring-boot:run \
  -Dspring-boot.run.profiles=default \
  -DDATABASE_URL=jdbc:postgresql://localhost:5432/payflow \
  -DDATABASE_USERNAME=payflow_user \
  -DDATABASE_PASSWORD=payflow_pass \
  -DREDIS_HOST=localhost \
  -DKAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
  -DJWT_SECRET=local-dev-secret-key-must-be-at-least-64-chars-long-for-hs512
```

### Frontend Only

```bash
cd frontend
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL to point to your running backend
npm install
npm run dev
# http://localhost:3000
```

---

## Backend → Railway

### Step 1: Create Railway Account
Go to [railway.app](https://railway.app) and sign up.

### Step 2: Create New Project

```bash
# Install CLI
npm install -g @railway/cli
railway login

# In backend directory
cd payflow/backend
railway init
# Choose "Empty project", name it "payflow"
```

### Step 3: Add PostgreSQL Service
In the Railway dashboard:
1. Click **+ New** → **Database** → **PostgreSQL**
2. Railway provides `DATABASE_URL` automatically

### Step 4: Add Redis Service
1. Click **+ New** → **Database** → **Redis**
2. Railway provides `REDIS_URL` automatically

### Step 5: Configure Kafka
For production Kafka, use **Upstash Kafka** (free tier):
1. Go to [upstash.com](https://upstash.com), create Kafka cluster
2. Copy the bootstrap server URL

### Step 6: Set Environment Variables
In Railway dashboard → your backend service → **Variables**:

```
DATABASE_URL          = (auto-set by Railway Postgres plugin)
DATABASE_USERNAME     = (auto-set)
DATABASE_PASSWORD     = (auto-set)
REDIS_HOST            = (extract from REDIS_URL)
REDIS_PORT            = 6379
REDIS_PASSWORD        = (extract from REDIS_URL)
KAFKA_BOOTSTRAP_SERVERS = your-upstash-url:9092
JWT_SECRET            = (generate: openssl rand -hex 64)
JWT_ACCESS_EXPIRY     = 900000
JWT_REFRESH_EXPIRY    = 604800000
CORS_ALLOWED_ORIGINS  = https://your-vercel-app.vercel.app
PORT                  = 8080
```

### Step 7: Deploy

```bash
cd backend
railway up
```

Or connect your GitHub repo in the Railway dashboard for auto-deployments.

### Railway Config File

Create `railway.toml` in the backend directory:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "java $JAVA_OPTS -jar app.jar"
healthcheckPath = "/api/actuator/health"
healthcheckTimeout = 120
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

---

## Backend → Render

### Step 1: Create Render Account
Go to [render.com](https://render.com) and sign up.

### Step 2: New Web Service
1. Connect your GitHub repository
2. Set **Root Directory** to `backend`
3. **Environment**: Docker
4. **Dockerfile Path**: `./Dockerfile`

### Step 3: Add PostgreSQL
1. Dashboard → **New** → **PostgreSQL**
2. Copy the Internal Database URL

### Step 4: Add Redis
1. Dashboard → **New** → **Redis**
2. Copy the Internal Redis URL

### Step 5: Environment Variables
In your Render web service → Environment:

```
DATABASE_URL          = postgresql://user:pass@host/payflow
DATABASE_USERNAME     = (from Render Postgres)
DATABASE_PASSWORD     = (from Render Postgres)
REDIS_HOST            = (from Render Redis internal URL)
REDIS_PORT            = 6379
JWT_SECRET            = (openssl rand -hex 64)
CORS_ALLOWED_ORIGINS  = https://payflow.vercel.app
```

### render.yaml (Infrastructure as Code)

```yaml
services:
  - type: web
    name: payflow-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    healthCheckPath: /api/actuator/health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: payflow-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ALLOWED_ORIGINS
        value: https://payflow.vercel.app

databases:
  - name: payflow-db
    plan: free
```

---

## Frontend → Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
cd frontend
vercel login
```

### Step 2: Deploy

```bash
vercel
# Follow prompts:
# - Link to existing project? No
# - Project name: payflow-frontend
# - Directory: ./
# - Override settings? No
```

### Step 3: Environment Variables

In Vercel Dashboard → your project → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_API_URL   = https://payflow-backend.railway.app/api
NEXT_PUBLIC_WS_URL    = wss://payflow-backend.railway.app/api/ws
```

### Step 4: Production Deploy

```bash
vercel --prod
```

Or push to `main` branch if connected to GitHub.

### vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

---

## Database Setup

Flyway handles all migrations automatically on startup.

### Manual Migration (if needed)

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check migration status
SELECT * FROM flyway_schema_history ORDER BY installed_rank;

# Reset (DANGER — dev only)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Seed Data

The V1 migration inserts a default admin user:
- **Email:** `admin@payflow.dev`
- **Password:** `Admin@123`

Change this password immediately after first login in production.

---

## Environment Reference

### Generate JWT Secret

```bash
# Linux / macOS
openssl rand -hex 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Health Check

```bash
curl https://your-backend.railway.app/api/actuator/health
# {"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"}}}
```

### Verify Deployment

```bash
# Test auth
curl -X POST https://your-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@payflow.dev","password":"Admin@123"}'

# Should return access/refresh tokens
```
