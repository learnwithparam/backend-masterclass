# Module 14: Observability

> "If you can't measure it, you can't improve it. If you can't see it, you can't fix it."

## The Story

The bookstore has been in production for a week. At 2 AM, orders start failing. You SSH in and find 10,000 lines of unstructured `console.log` output. Which are errors? When did it start? Is the database down or is Redis the problem? You can't tell. You need observability.

## What You'll Build

- **Structured JSON logging** with Pino (replacing console.log/Winston)
- **Health check endpoints** (/health for liveness, /health/ready for readiness)
- **Request correlation IDs** (X-Request-Id header generation and propagation)
- **Basic metrics** (request counts, response times, error rates)
- **Graceful shutdown** (SIGTERM handling, connection draining)

## Architecture

```
Request Flow:

  Client Request
      │
      ▼
  Request ID ────── Generate UUID or pass through X-Request-Id
      │
      ▼
  Metrics ──────── Track request count, start timer
      │
      ▼
  Logger ──────── Structured JSON: { method, url, requestId, ... }
      │
      ▼
  Route Handler
      │
      ▼
  Response ─────── Log: { status: 200, duration: 42ms, requestId: "abc" }


Health Endpoints:

  /health ────── Always 200 (liveness probe)
  /health/ready ─ Checks DB → 200 or 503 (readiness probe)
  /health/metrics ─ Request counts, p50/p95/p99 response times
```

## Key Concepts

### Structured vs Unstructured Logging
- `console.log("User logged in")` — can't search, filter, or aggregate
- `logger.info({ userId: 42, action: "login" })` — JSON, searchable, machine-readable

### Liveness vs Readiness
- **Liveness**: "Is the process running?" If no, restart it. (Kubernetes restartPolicy)
- **Readiness**: "Can it handle traffic?" If no, stop sending requests. (Load balancer health check)

### Correlation IDs
One request can generate 50 log lines across 3 services. X-Request-Id links them all together for debugging.

## Prerequisites

- Module 05 (Auth & Security) completed
- Docker Desktop running

## Your Task

1. Replace console.log with Pino structured logging
2. Add X-Request-Id middleware for correlation
3. Implement /health and /health/ready endpoints
4. Add metrics collection (request count, response times)
5. Implement graceful shutdown on SIGTERM

## Testing

```bash
make setup    # Install deps, start DB
make solution # Run the solution
make smoke    # Run E2E smoke tests
make test     # Run integration tests
```

## Common Mistakes

1. **console.log in production** — Unstructured text is useless at scale. Use structured JSON.
2. **Health check that always returns 200** — /health/ready must actually check dependencies.
3. **Missing correlation ID** — Without it, debugging distributed issues is guesswork.
4. **No graceful shutdown** — Killing the process mid-request corrupts data. Drain first.

## What's Next

This completes the backend masterclass. Your bookstore API now has authentication, testing, caching, real-time updates, and production observability. Pair with the frontend masterclass for a full-stack curriculum.
