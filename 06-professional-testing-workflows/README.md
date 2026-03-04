# Module 06: Professional Testing Workflows

> If it's not tested, it's broken — you just don't know it yet.

## The Story

Your API is feature-complete. Authentication works, data persists, roles are enforced. You ship it. A week later, someone changes the Zod validation schema and accidentally breaks the login endpoint. Nobody notices until a customer reports they can't sign in.

"But it worked on my machine" is not a testing strategy. Manual testing with Postman doesn't scale — every time you change one thing, you'd need to re-test everything. What you need is automated tests that run in seconds and catch regressions before they reach production.

But here's the tricky part: your tests hit a real database. If you run them against your development database, they'll create fake users, delete real books, and leave your database in a mess. And if two developers run tests at the same time, they'll interfere with each other.

The solution? Every test run gets its own private database — a fresh PostgreSQL instance that's created before the tests start and destroyed when they finish. Zero contamination, perfect isolation. That's what Testcontainers gives you.

## What You'll Build

A complete integration test suite that spins up its own isolated PostgreSQL container, pushes the schema, runs all tests, and tears everything down.

```
Test Run Starts
      │
      ▼
┌─────────────────────────────┐
│  Testcontainers             │
│  → Start fresh PostgreSQL   │  Isolated container per test run
│  → Push Drizzle schema      │  Empty database with correct tables
│  → Set DATABASE_URL env     │  App connects to THIS container
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Dynamic Import             │
│  → Import app AFTER env     │  Ensures app uses the test DB
│    is configured            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Test Suite                 │
│  → Register users           │
│  → Login, get JWT tokens    │
│  → Test auth + CRUD         │
│  → Assert status codes      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  Cleanup                    │
│  → Close DB connections     │
│  → Stop container           │  Container + data destroyed
└─────────────────────────────┘
```

## Core Concepts

### 1. The Testing Pyramid
- **Unit Tests** (fast, many): Test a single function in isolation. "Does `createBook` generate the right ID?"
- **Integration Tests** (medium speed, some): Test how parts work together. "Does POST /api/books actually insert into the database and return 201?"
- **End-to-End Tests** (slow, few): Test the entire system. "Can a user register, login, create a book, and see it listed?"

This module focuses on integration tests — the sweet spot where you catch real bugs without the brittleness of E2E tests.

### 2. Supertest: HTTP Testing Without a Server
Supertest takes your Express `app` and simulates HTTP requests in-memory. No port binding, no network. This means tests are fast and don't conflict with running servers.

```typescript
const request = supertest(app);
const res = await request.post('/api/auth/login').send({ username, password });
expect(res.status).toBe(200);
expect(res.body.token).toBeDefined();
```

### 3. Testcontainers: Disposable Databases
Testcontainers is a library that manages Docker containers from your test code. In `beforeAll()`, it starts a fresh PostgreSQL container. In `afterAll()`, it destroys it. Every test run is completely isolated.

```typescript
const container = await new PostgreSqlContainer('postgres:15-alpine')
  .withDatabase('bookstore_test')
  .start();

process.env.DATABASE_URL = container.getConnectionUri();
```

### 4. Dynamic Imports
Your app reads `DATABASE_URL` when it initializes. But in tests, you need to set the URL BEFORE the app loads. Solution: set the env var first, then dynamically `import()` the app modules.

```typescript
// 1. Set env
process.env.DATABASE_URL = container.getConnectionUri();
// 2. THEN import (app reads env during import)
const { app } = await import('../after/index.js');
```

### 5. Test Lifecycle Hooks
- `beforeAll` — Run once: start container, push schema, create test users
- `beforeEach` — Run before each test: reset database state (clear and re-seed)
- `afterAll` — Run once: close connections, stop container

## Prerequisites

- Module 05 completed
- Docker Desktop running (Testcontainers needs Docker)
- Node.js 20+

## Getting Started

```bash
# Install dependencies (includes testcontainers)
make setup
```

## Your Task

Open `tests/api.test.ts` and study the Testcontainers setup in `beforeAll`. The infrastructure code is provided — your job is to write the test cases:

1. **Authentication Tests:**
   - `POST /api/auth/register` should return 201 and the new user (without password hash)
   - `POST /api/auth/register` with duplicate username should return 409
   - `POST /api/auth/login` should return 200 with a JWT token
   - `POST /api/auth/login` with wrong password should return 401

2. **Authorization Tests:**
   - `GET /api/books` should return 200 (public — no auth needed)
   - `POST /api/books` without a token should return 401
   - `POST /api/books` as a customer should return 403
   - `POST /api/books` as an admin should return 201
   - `DELETE /api/books/:id` as an admin should return 204

## Testing Your Solution

```bash
# Run the tests (first run may take longer to pull the Docker image)
make test
```

You should see output like:
```
PASS tests/api.test.ts
  Authentication Endpoints
    ✓ should register a new user
    ✓ should not register duplicate users
    ✓ should login an existing user
  Secured Book Endpoints
    ✓ should allow anyone to read books
    ✓ should block anonymous users from creating books
    ✓ should block customers from creating books
    ✓ should allow admins to create books
    ✓ should allow admins to delete books
```

## Common Mistakes

1. **Docker not running**: Testcontainers requires Docker Desktop to be running. If you see "Could not find a valid Docker environment," start Docker first.

2. **Importing before setting env vars**: If you `import` the app at the top of the test file (static import), it reads `DATABASE_URL` before you've set it. Use dynamic `import()` inside `beforeAll` instead.

3. **Not running tests in band**: Database tests can interfere with each other if they run in parallel. Use `--runInBand` in your jest command (already configured in package.json).

## What's Next

Your API is tested, secure, and persistent. In **Module 07**, you'll add background jobs — operations that take too long for a normal request/response cycle (like sending emails or processing images). You'll learn how to queue work and process it asynchronously with BullMQ and Redis.

*Hint: If you're stuck, check the completed code in `after/` or run `make solution`.*
