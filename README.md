<div align="center">
  <h1>💳 PayFlow</h1>
  <p><strong>Production-grade Payment Gateway Simulator — Stripe-like API built with Java 21 + Next.js</strong></p>

  [![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=flat&logo=springboot)](https://spring.io/projects/spring-boot)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
  [![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk)](https://openjdk.org)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat&logo=postgresql)](https://postgresql.org)
  [![Kafka](https://img.shields.io/badge/Apache_Kafka-7.6-231F20?style=flat&logo=apachekafka)](https://kafka.apache.org)
  [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://docker.com)
</div>

---

## Overview

**PayFlow** is a full-stack, portfolio-grade payment gateway simulator that mirrors the architecture and feature set of real-world payment processors like Stripe and Adyen. Built to demonstrate enterprise Java backend engineering and modern frontend design.

### Why PayFlow?

| Feature | Details |
|---|---|
| **Idempotent Payments** | Safe retry with idempotency key deduplication |
| **Fraud Detection** | Real-time risk scoring engine with auto-block |
| **Event Streaming** | Kafka-powered async payment event pipeline |
| **WebSocket Notifications** | Live payment status updates via STOMP/SockJS |
| **Redis Caching** | Multi-tier caching with configurable TTLs |
| **Circuit Breaker** | Resilience4j fault tolerance with fallbacks |
| **Rate Limiting** | Bucket4j token-bucket per IP per endpoint |
| **Full Audit Trail** | Every action logged to immutable audit table |
| **JWT + Refresh Tokens** | Stateless auth with automatic token rotation |
| **Role-based Access** | ADMIN / USER with method-level security |
| **OpenAPI Docs** | Full Swagger UI at `/api/swagger-ui.html` |

---

## Tech Stack

### Backend
- **Java 21** — Virtual threads, records, pattern matching
- **Spring Boot 3.2** — Auto-configuration, actuator, devtools
- **Spring Security** — JWT filter chain, method security
- **Spring Data JPA** — Hibernate 6, Flyway migrations
- **PostgreSQL 16** — JSONB, UUID, advanced indexing
- **Redis 7** — Caching, session management
- **Apache Kafka** — Event streaming, async processing
- **WebSocket / STOMP** — Real-time notifications
- **Resilience4j** — Circuit breaker, retry, rate limiter
- **Bucket4j** — Token bucket rate limiting
- **MapStruct** — Type-safe DTO mapping
- **SpringDoc OpenAPI** — Swagger UI generation

### Frontend
- **Next.js 14** — App Router, Server Components
- **TypeScript** — Strict mode, full type safety
- **Tailwind CSS** — Custom dark fintech design system
- **Recharts** — Revenue and status charts
- **Zustand** — Lightweight client state management
- **React Hook Form + Zod** — Schema-validated forms
- **Axios** — Interceptor-based HTTP with auto token refresh
- **STOMP.js / SockJS** — WebSocket client

### Infrastructure
- **Docker + Docker Compose** — Full local stack
- **GitHub Actions** — CI/CD pipeline
- **Railway / Render** — Backend deployment
- **Vercel** — Frontend deployment

---

## Quick Start

### Prerequisites
- Java 21+, Maven 3.9+
- Node.js 20+, npm
- Docker + Docker Compose

### Option A — Full Docker Stack (Recommended)

```bash
git clone https://github.com/youruser/payflow.git
cd payflow

# Start everything (Postgres, Redis, Kafka, Backend, Frontend)
docker compose up -d

# View logs
docker compose logs -f backend

# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/api
# Swagger UI: http://localhost:8080/api/swagger-ui.html
```

### Option B — Local Development

**1. Start infrastructure only:**
```bash
docker compose up -d postgres redis zookeeper kafka
```

**2. Run backend:**
```bash
cd backend
cp src/main/resources/application.yml src/main/resources/application-local.yml
# Edit application-local.yml with your local settings
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**3. Run frontend:**
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local
npm install
npm run dev
```

---

## Environment Variables

### Backend (Railway / Render)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://host/payflow` |
| `DATABASE_USERNAME` | DB username | `payflow_user` |
| `DATABASE_PASSWORD` | DB password | `secret` |
| `REDIS_HOST` | Redis hostname | `redis.internal` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password (if set) | `redispass` |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker | `kafka:29092` |
| `JWT_SECRET` | HS512 secret (min 64 chars) | `payflow-super-secret...` |
| `JWT_ACCESS_EXPIRY` | Access token TTL (ms) | `900000` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL (ms) | `604800000` |
| `CORS_ALLOWED_ORIGINS` | Frontend URL | `https://payflow.vercel.app` |

### Frontend (Vercel)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://payflow.railway.app/api` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `wss://payflow.railway.app/api/ws` |

---

## API Reference

Base URL: `/api/v1`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new account |
| `POST` | `/auth/login` | Login, receive JWT pair |
| `POST` | `/auth/refresh` | Rotate access token |
| `POST` | `/auth/logout` | Revoke refresh tokens |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/payments` | Create payment |
| `GET` | `/payments` | List with filter/pagination |
| `GET` | `/payments/{id}` | Get payment details |
| `POST` | `/payments/{id}/refund` | Full or partial refund |
| `GET` | `/payments/{id}/refunds` | List refunds for payment |

### Analytics (Admin)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/overview` | Revenue, counts, charts |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/users` | List all users |
| `GET` | `/admin/payments` | All payments |
| `GET` | `/admin/fraud-flags` | Fraud detection flags |
| `PUT` | `/admin/fraud-flags/{id}/review` | Review a fraud flag |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users/me` | Current user profile |
| `PUT` | `/users/me` | Update profile |
| `POST` | `/users/me/api-key` | Generate API key |

Full interactive docs: `http://localhost:8080/api/swagger-ui.html`

---

## Deployment

### Backend — Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Create new project
cd backend
railway init

# Add services: PostgreSQL, Redis
# (create in Railway dashboard)

# Set environment variables in Railway dashboard, then:
railway up
```

### Backend — Render

1. Create new **Web Service** pointing to `/backend`
2. Build command: `mvn clean package -DskipTests`
3. Start command: `java -jar target/payflow-backend-*.jar`
4. Add environment variables in dashboard

### Frontend — Vercel

```bash
cd frontend
npx vercel

# Or connect GitHub repo to Vercel dashboard
# Set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL in Vercel settings
```

---

## Database Schema

```
users ──────────────────────────────────────────────────────
  id (UUID PK), email, password_hash, first/last_name,
  role (ADMIN|USER), status, api_key, last_login_at

payments ───────────────────────────────────────────────────
  id (UUID PK), payment_reference, user_id (FK),
  amount, currency, status, payment_method,
  idempotency_key (unique), processing_fee, net_amount,
  risk_score, ip_address, webhook_url

refunds ────────────────────────────────────────────────────
  id (UUID PK), refund_reference, payment_id (FK),
  amount, status, reason, gateway_refund_id

transactions ───────────────────────────────────────────────
  id (UUID PK), transaction_reference, user_id (FK),
  payment_id (FK), type (PAYMENT|REFUND|FEE), amount

notifications ──────────────────────────────────────────────
  id (UUID PK), user_id (FK), type, title, message, read

audit_logs ─────────────────────────────────────────────────
  id (UUID PK), user_id (FK), action, entity_type,
  entity_id, description, ip_address, created_at

fraud_flags ────────────────────────────────────────────────
  id (UUID PK), payment_id (FK), risk_level, risk_score,
  flags (JSONB), auto_blocked, reviewed
```

---

## Project Structure

```
payflow/
├── backend/                       # Spring Boot application
│   ├── src/main/java/com/payflow/
│   │   ├── config/                # Security, Redis, Kafka, WS configs
│   │   ├── controller/            # REST controllers (v1)
│   │   ├── dto/                   # Request/Response DTOs
│   │   ├── entity/                # JPA entities
│   │   ├── enums/                 # Domain enumerations
│   │   ├── event/                 # Kafka events + consumer
│   │   ├── exception/             # Global exception handler
│   │   ├── filter/                # JWT + Rate limit filters
│   │   ├── repository/            # Spring Data repositories
│   │   ├── security/              # JWT service, UserDetails
│   │   ├── service/               # Business logic interfaces + impls
│   │   └── util/                  # Reference generators
│   ├── src/main/resources/
│   │   ├── db/migration/          # Flyway SQL migrations
│   │   └── application.yml        # Configuration
│   ├── src/test/                  # Unit + integration tests
│   └── Dockerfile
│
├── frontend/                      # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── auth/                  # Login, Register
│   │   ├── dashboard/             # Main dashboard
│   │   ├── payments/              # Payments list + detail
│   │   ├── analytics/             # Charts & KPIs (Admin)
│   │   ├── admin/                 # Admin panel
│   │   └── profile/               # User settings
│   ├── components/
│   │   ├── charts/                # Recharts wrappers
│   │   ├── dashboard/             # Dashboard-specific UI
│   │   ├── layout/                # Sidebar + top bar
│   │   ├── payments/              # Payment table, modal
│   │   └── ui/                    # Skeletons, toast
│   ├── hooks/                     # useAuth, usePayments, useWebSocket
│   ├── lib/                       # axios, auth utils, cn utils
│   ├── store/                     # Zustand authStore
│   ├── types/                     # TypeScript interfaces
│   └── Dockerfile
│
├── docker-compose.yml             # Full stack compose
├── .github/workflows/ci.yml      # GitHub Actions pipeline
└── README.md
```

---

## Resume Description

> **PayFlow — Full-Stack Payment Gateway Simulator** | Java 21 · Spring Boot · Next.js · PostgreSQL · Kafka · Redis
>
> Architected and built a production-grade payment processing platform simulating Stripe's core infrastructure. Implemented idempotent payment APIs with real-time fraud detection (risk scoring engine with auto-block), Kafka event streaming for async payment processing, and WebSocket notifications for live status updates. Backend features JWT authentication with refresh token rotation, Redis multi-tier caching, Resilience4j circuit breakers, and Bucket4j rate limiting. Frontend built with Next.js 14 App Router, featuring a dark-theme fintech dashboard with revenue charts, paginated transaction tables, and admin fraud management. Full Docker Compose stack with CI/CD via GitHub Actions, deployable to Railway (backend) and Vercel (frontend).

---

## License

MIT — free to use, extend, and add to your portfolio.
