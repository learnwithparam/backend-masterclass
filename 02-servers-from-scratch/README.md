# Module 02: Servers from Scratch

> A server is just a program that never stops listening.

## The Story

Think about what happens when you type a URL into your browser. Your browser sends a message across the internet that says, roughly, "Hey, give me the thing at this address." On the other end, a program — a server — is sitting there, waiting. It hears the request, figures out what you're asking for, and sends something back.

That's it. That's the whole magic of the internet. There's no special hardware, no mysterious black box. A server is just a program running on a computer that says: "I'm listening on port 3000. Send me requests, and I'll respond."

In Module 01, you built a tool that processes data from files. Now imagine thousands of people need that data at the same time. You can't email them each a JSON file. Instead, you run a server that anyone can query whenever they want. That's the shift from batch processing to serving — and it's the foundation of every backend.

## What You'll Build

A minimal HTTP server with a health check endpoint — the smallest possible "proof of life" that your server is running and responding.

```
 Browser / curl / Postman
         │
         │  GET /health
         ▼
┌─────────────────────┐
│   Express Server    │
│   (port 3000)       │
│                     │
│  /health → 200 OK   │
│  { status: "ok" }   │
│                     │
│  /anything-else     │
│  → 404 Not Found    │
└─────────────────────┘
```

## Core Concepts

### 1. What is a Port?
Your computer can run many servers at once. Ports are how the OS tells them apart. When you say "listen on port 3000," you're claiming that address. If another program is already using port 3000, you'll get an error — just like two shops can't have the same street address.

Common ports: 80 (HTTP), 443 (HTTPS), 3000 (development), 5432 (PostgreSQL), 6379 (Redis).

### 2. Express.js: HTTP Made Simple
Express is a thin wrapper around Node's built-in HTTP server. Raw Node.js requires you to manually parse URLs, headers, and bodies. Express does all of that and gives you a clean API:

```typescript
const app = express();

// When someone sends GET /health, run this function
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

Every Express route has the same shape: a method (`get`, `post`, `delete`), a path (`/health`), and a handler function that receives the request and sends a response.

### 3. Testing with Supertest
How do you test a server without actually starting it and making HTTP calls? Supertest. It takes your Express app and simulates HTTP requests in-memory — no port binding, no network overhead. This is how professional backend teams write tests.

```typescript
import supertest from 'supertest';
const request = supertest(app);

const response = await request.get('/health');
expect(response.status).toBe(200);
```

### 4. Server Lifecycle Management
A server that starts but can't stop is a problem — especially in tests. If Jest finishes but the server is still holding the port open, the process hangs. That's why we export `startServer()` and `stopServer()` functions.

## Prerequisites

- Module 01 completed
- Node.js 20+

## Getting Started

```bash
# Install dependencies
make setup

# Open the skeleton
# before/index.ts
```

## Your Task

Open `before/index.ts` and:

1. **Create a health check route** — `app.get('/health', ...)` that returns `{ status: "ok" }` as JSON

2. **Implement `startServer`** — call `app.listen(port)` and store the server reference so it can be stopped later

3. **Test it manually** — start the server and visit `http://localhost:3000/health` in your browser

## Testing Your Solution

Start your server to test in a browser:
```bash
npm run start:before
# Visit http://localhost:3000/health
```

Run the automated test suite:
```bash
make test
```

The tests verify:
- `GET /health` returns status 200 with `{ status: "ok" }`
- Unknown routes return 404 (Express does this automatically)

## Common Mistakes

1. **Forgetting to store the server reference**: `app.listen()` returns a `Server` object. If you don't save it, you can't call `.close()` later, and your tests will hang.

2. **Using `res.send()` instead of `res.json()`**: `res.send('ok')` returns a plain string. The test expects JSON: `{ status: "ok" }`. Always use `res.json()` when returning structured data.

3. **Port already in use**: If you see `EADDRINUSE`, another process is using port 3000. Either kill it (`lsof -i :3000`) or use a different port.

## What's Next

You've got a server that responds to one route. But real APIs have dozens of endpoints, organized into logical groups, with validation, logging, and error handling. In **Module 03**, you'll build a complete REST API with a layered architecture: routes, controllers, services, and middleware.

*Hint: If you're stuck, check the solution in `after/index.ts` or run `make solution`.*
