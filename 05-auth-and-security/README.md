# Module 05: Authentication, Authorization, and Security

> Anyone can read the menu. Only the chef gets into the kitchen.

## The Story

Your bookstore API stores real data in PostgreSQL now. Business is picking up. But then you check the logs and notice something alarming: someone just deleted your entire book catalog with a single `DELETE` request. No login, no credentials — just a curl command anyone could run.

Right now, your API is like a bank vault with the door wide open. It doesn't matter how solid the vault is if anyone can walk in. You need two things: a way to know WHO is making requests (authentication) and a way to control WHAT they're allowed to do (authorization).

Think of it like a hotel. At the front desk (login), you prove your identity and get a room key (JWT token). The key opens your room but not the staff-only areas. An admin key opens everything. And the key expires at checkout time — you can't use yesterday's key.

## What You'll Build

A complete authentication system layered on top of your existing API:

```
           Client Request
                │
                ▼
┌───────────────────────────┐
│     POST /api/auth/login  │  → Returns JWT token
│  POST /api/auth/register  │  → Creates new user
└───────────────────────────┘

        Subsequent Requests
                │
     Authorization: Bearer <token>
                │
                ▼
┌───────────────────────────┐
│    requireAuth middleware  │  Verifies JWT, attaches user to req
└──────────────┬────────────┘
               │
               ▼
┌───────────────────────────┐
│   requireRole('admin')    │  Checks user.role === 'admin'
└──────────────┬────────────┘
               │
               ▼
┌───────────────────────────┐
│   Route Handler           │  Only reached if auth passes
│   (create/delete book)    │
└───────────────────────────┘

Public routes (GET /api/books) skip the auth middleware entirely.
```

## Core Concepts

### 1. Password Hashing with bcrypt
Never store plain text passwords. If your database is breached, attackers get every user's password. bcrypt is a one-way hash function that's deliberately slow — each hash takes ~100ms, making brute-force attacks impractical.

```typescript
// Hashing (during registration)
const hash = await bcrypt.hash('mypassword', 10); // 10 salt rounds

// Comparing (during login)
const isValid = await bcrypt.compare('mypassword', hash); // true
```

### 2. JWT (JSON Web Tokens)
A JWT is a signed string that contains a payload (user ID, role, expiration). The server creates it on login; the client sends it with every subsequent request. The server can verify the signature without hitting the database.

The tradeoff: JWTs are stateless (no DB lookup needed), but you can't revoke them until they expire. That's why `expiresIn: '1h'` matters.

### 3. Authentication vs Authorization
- **Authentication (AuthN)**: "Who are you?" — Verified by the JWT signature
- **Authorization (AuthZ)**: "What can you do?" — Checked by the role in the JWT payload

### 4. Middleware Composition
Express middleware can be chained. This lets you compose security checks:
```typescript
// Only authenticated admins can create books
bookRouter.post('/', requireAuth, requireRole('admin'), createBookHandler);
```

### 5. Security Best Practices
- Never return password hashes in API responses
- Use the same error message for "user not found" and "wrong password" (prevents username enumeration)
- Always set token expiration
- Store JWT secrets in environment variables, never in code

## Prerequisites

- Module 04 completed (PostgreSQL + Drizzle)
- Docker Desktop running
- Node.js 20+

## Getting Started

```bash
# Install dependencies (includes bcrypt and jsonwebtoken)
make setup
```

The users table schema is already provided in `before/db/schema.ts`.

## Your Task

You need to create four new files in the `before/` directory:

1. **`services/user.service.ts`** — Implement:
   - `getUserByUsername(username)` — query the users table
   - `createUser(username, password)` — hash password with bcrypt, insert user, return WITHOUT the password hash

2. **`controllers/auth.controller.ts`** — Implement:
   - `registerHandler` — validate input, check for duplicates (409), create user (201)
   - `loginHandler` — validate credentials, compare with bcrypt, return JWT token

3. **`middlewares/auth.ts`** — Implement:
   - `requireAuth` — extract Bearer token, verify with jwt.verify, attach to req.user
   - `requireRole(role)` — factory function that checks req.user.role

4. **`routes/auth.routes.ts`** — Wire up:
   - `POST /register` → registerHandler
   - `POST /login` → loginHandler

5. **Update `routes/book.routes.ts`** — Protect POST and DELETE with `requireAuth` + `requireRole('admin')`

6. **Update `index.ts`** — Import and mount the auth router at `/api/auth`

Skeleton files with TODO comments are provided to guide you.

## Testing Your Solution

```bash
npm run start:before

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Login to get a token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Use the token to create a book (will fail — testuser is a customer, not admin)
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Book","author":"Author","pages":100,"published":"2024"}'
```

Run the automated tests:
```bash
make test
```

## Common Mistakes

1. **Returning the password hash**: If your register endpoint returns the full user object, the hash leaks to the client. Always destructure it out before responding.

2. **Forgetting `next()` in middleware**: If your `requireAuth` middleware verifies the token but doesn't call `next()`, the request hangs forever and never reaches the route handler.

3. **Different error messages for auth failures**: Saying "user not found" vs "wrong password" separately lets attackers enumerate valid usernames. Always use one generic message.

## What's Next

Your API is secure and persistent. But how do you prove it actually works? In **Module 06**, you'll build professional integration tests using Testcontainers — spinning up isolated PostgreSQL instances for every test run.

*Hint: If you're stuck, check the completed code in `after/` or run `make solution`.*
