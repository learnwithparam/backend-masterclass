# Module 11: Ship It (Docker, CI/CD, and Production)

> Code that only runs on your laptop isn't software. Software runs in production.

## The Story

Your microservices work perfectly — on your machine. But deploying them requires a ritual: open three terminals, start PostgreSQL, start Redis, run the Order Service, run the Inventory Service, remember to set the right environment variables, hope that your teammate has the same Node.js version...

When a new developer joins the team, they spend half a day setting up the project. When you deploy to a server, you SSH in, `git pull`, install dependencies, compile TypeScript, and pray nothing breaks. If the server crashes at 3 AM, you get paged and repeat the process.

Docker solves the "works on my machine" problem. You define *exactly* what your service needs — Node.js version, dependencies, compiled code — in a Dockerfile. Anyone can run it with `docker compose up`. Same on your laptop, same on your coworker's machine, same on the production server.

CI/CD (Continuous Integration / Continuous Deployment) solves the "I hope nobody broke anything" problem. Every time code is pushed, GitHub Actions automatically runs your type checker and test suite. If anything fails, the pull request is blocked. No broken code reaches production.

## What You'll Build

A fully containerized, CI/CD-enabled deployment:

```
┌──────────────────────────────────────────────────────┐
│  docker compose up                                    │
│                                                       │
│  ┌──────────┐  ┌──────────┐                          │
│  │ Postgres │  │  Redis   │  Infrastructure          │
│  │  :5432   │  │  :6379   │  (healthchecks)          │
│  └────┬─────┘  └────┬─────┘                          │
│       │              │                                │
│  ┌────┴──────────────┴────┐  ┌────────────────────┐  │
│  │    Order Service       │  │ Inventory Service   │  │
│  │    :3000               │  │ :4000               │  │
│  │    (multi-stage build) │  │ (multi-stage build) │  │
│  └────────────────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  GitHub Actions CI                                    │
│                                                       │
│  push/PR → npm ci → tsc --noEmit → npm test          │
│                                                       │
│  ✅ Pass → merge allowed                              │
│  ❌ Fail → merge blocked                              │
└──────────────────────────────────────────────────────┘
```

## Core Concepts

### 1. Multi-Stage Docker Builds

A naive Dockerfile installs TypeScript, devDependencies, and source code in the production image. That's wasteful — production only needs compiled JavaScript and production dependencies.

Multi-stage builds solve this:

```dockerfile
# Stage 1: BUILD — heavy image with TypeScript compiler
FROM node:20-alpine AS builder
COPY . .
RUN npm ci          # All dependencies (including devDeps)
RUN npm run build   # Compile TypeScript → JavaScript

# Stage 2: RUN — minimal image with only what's needed
FROM node:20-alpine AS runner
COPY package*.json ./
RUN npm ci --omit=dev           # Production deps only
COPY --from=builder /app/dist . # Just the compiled JS
USER node                       # Non-root for security
CMD ["node", "dist/index.js"]
```

The build stage might be 500MB. The runtime stage is 50-100MB. Production images are small, fast to deploy, and have a smaller attack surface.

### 2. Docker Compose Orchestration

Docker Compose defines your entire system in one file:

```yaml
services:
  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]

  order-service:
    build: ./order-service
    depends_on:
      db:
        condition: service_healthy  # Wait until DB is READY
```

Key features:
- **`depends_on` + `service_healthy`**: Services start in the right order. The Order Service waits until PostgreSQL's healthcheck passes, not just until the container starts.
- **Container networking**: Services reference each other by name (`db`, `redis`), not by IP address.
- **Named volumes**: `db_data` persists PostgreSQL data across container restarts.

### 3. CI/CD with GitHub Actions

Continuous Integration runs automatically on every push:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

steps:
  - run: npm ci           # Reproducible install
  - run: npx tsc --noEmit # Catch type errors
  - run: npm test          # Catch logic errors
```

Why `npm ci` instead of `npm install`? `npm ci` uses exact versions from `package-lock.json`, ensuring CI and your laptop use identical dependencies. `npm install` can resolve to different versions.

### 4. Security Best Practices

- **Non-root user**: `USER node` in the Dockerfile. If the Node.js process is compromised, the attacker has limited permissions.
- **`npm ci --omit=dev`**: Production images don't include test frameworks, TypeScript, or other dev tools that could be exploited.
- **`.dockerignore`**: Prevents `node_modules`, `.env`, and other sensitive files from being copied into the image.
- **Environment variables**: Secrets like `JWT_SECRET` and `DATABASE_URL` are injected at runtime via Docker Compose, never baked into the image.

### 5. Production vs Development

| Aspect | Development | Production |
|--------|-------------|------------|
| TypeScript | `tsx` (JIT compile) | `tsc` → `node` (pre-compiled) |
| Dependencies | All (dev + prod) | Production only |
| Node.js user | Your user | `node` (non-root) |
| Environment | `.env` file | Docker Compose env vars |
| Startup | `npm run dev` | `docker compose up` |

## Prerequisites

- Module 10 completed
- Docker Desktop running
- Node.js 20+

## Getting Started

Because everything is containerized, you need exactly **one command**:

```bash
make run-prod
```

This builds both Docker images, starts PostgreSQL, Redis, Order Service, and Inventory Service — all with proper healthchecks and networking.

### Viewing Logs

```bash
make logs
```

Watch what happens when you hit the API:

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' | jq -r .token)

# Place an order
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId":1,"quantity":2}'
```

You'll see the Order Service log the domain event and the Inventory Service react instantly.

### Tearing It Down

```bash
make clean
```

## Your Task

The `before/` directory contains the microservices from Module 10 without any Docker or CI/CD configuration. Your job is to:

1. **Create Order Service Dockerfile** (`after/order-service/Dockerfile`):
   - Stage 1 (builder): Install all deps, compile TypeScript
   - Stage 2 (runner): Production deps only, compiled JS, non-root user

2. **Create Inventory Service Dockerfile** (`after/inventory-service/Dockerfile`):
   - Same multi-stage pattern

3. **Create `docker-compose.yml`**:
   - PostgreSQL with healthcheck
   - Redis with healthcheck
   - Order Service depending on both with `service_healthy`
   - Inventory Service depending on both with `service_healthy`
   - Environment variables for DATABASE_URL, REDIS_URL, JWT_SECRET

4. **Create CI pipeline** (`.github/workflows/ci.yml`):
   - Trigger on push to main and pull requests
   - Install dependencies with `npm ci`
   - Run `tsc --noEmit` for type checking
   - Run `npm test` for integration tests

## Common Mistakes

1. **Forgetting healthchecks**: Without `condition: service_healthy`, Docker Compose starts services as soon as the container is created — but PostgreSQL takes a few seconds to accept connections. Your Node.js service crashes on startup with "connection refused."

2. **Including devDependencies in production**: If you use `npm install` instead of `npm ci --omit=dev` in the runtime stage, TypeScript, Jest, and other dev tools bloat your image and increase the attack surface.

3. **Running as root**: The default Docker user is root. If an attacker exploits a vulnerability in your Node.js app, they have root access to the container. Always use `USER node`.

## Congratulations!

You've built a complete backend system from scratch:

```
Module 01: CLI basics and Zod validation
Module 02: HTTP servers with Express
Module 03: REST API with layered architecture
Module 04: PostgreSQL with Drizzle ORM
Module 05: Authentication with JWT and bcrypt
Module 06: Professional testing with Testcontainers
Module 07: Background jobs with BullMQ
Module 08: Redis caching with cache-aside pattern
Module 09: Domain-Driven Design with pure functions
Module 10: Microservices with event-driven architecture
Module 11: Production deployment with Docker and CI/CD
```

From a simple JSON parser to a containerized, event-driven, CI/CD-enabled microservices system. Every concept builds on the last, and every module solves a real problem you'll face in production.
