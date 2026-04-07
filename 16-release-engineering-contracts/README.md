# Module 16: Release Engineering, Contracts, and Resilience

> "A feature is not done when it works once. It is done when it can be released, documented, and survived in production."

## The Story

The bookstore API already works in dev. Now the team needs the boring but essential pieces that make a release safe: a repeatable deploy path, a published contract, and a way to rehearse failures before users see them.

## What You'll Build

- **Release engineering** - multi-stage Docker, health checks, and rollback-friendly deployment artifacts
- **Contract-first API publishing** - a documented OpenAPI surface for consumers
- **Load and failure drills** - a lightweight load harness and a deliberate 503 failure mode you can rehearse
- **Production API basics** - cursor pagination, rate limiting, uploads, and versioning remain in place

## Why this matters

Deployment isn't just "ship the code." It is:
- a reproducible image build
- a known runtime contract
- a way to validate behavior before promotion
- a rollback path when the blast radius gets bigger than expected

## Architecture

```
Build -> Docker image -> Healthcheck -> Load check -> Publish contract
   │                          │                │             │
   ├── Rollback-ready tags    ├── /health     ├── /load     ├── /openapi.json
   │                          │                │             │
   └── same artifact in prod  └── deployment gate            └── consumer contract
```

## Key Concepts

### Release Engineering
- Use a multi-stage Dockerfile so the runtime image is small and reproducible
- Keep health checks in compose so a bad image does not get promoted silently
- Ship with a rollback plan: a previous tag, the same config, and a known-good DB migration order

### Contract-First APIs
- Publish the API shape before clients integrate with it
- Keep `/openapi.json` and `/docs` available so consumers can validate against the live contract
- Add tests that fail when the contract drifts

### Load + Failure Drills
- Run a small load harness against the hot path before a release
- Simulate a controlled 503 to make sure the failure path is visible and recoverable
- Rehearse the bad day before the bad day happens

## Prerequisites

- Module 05 (Auth & Security) completed
- Docker Desktop running

## Testing

```bash
make setup
make smoke
make test
make load:test
```

## Common Mistakes

1. **Promoting an image without a healthcheck** - You learn the deployment is broken only after traffic moves.
2. **Shipping a contract without publishing it** - Consumers reverse engineer your API and drift starts immediately.
3. **Treating load tests as optional** - The first real traffic spike becomes your test suite.
4. **Never rehearsing failure** - If you only test the happy path, the rollback path is fantasy.

## What This Module Adds

1. Release engineering and deployment strategy
2. Contract-first API design and OpenAPI publishing
3. Load testing and failure-injection drills
