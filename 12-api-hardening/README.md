# Module 12: API Hardening

> "A production API without rate limiting is an API waiting to be abused."

## The Story

The bookstore is growing fast. Your catalog page loads all 5,000 books at once — the browser freezes for 3 seconds. A scraper is hammering your API at 100 requests per second, slowing things down for real users. Marketing wants customers to see book cover images. It's time to harden your API for the real world.

## What You'll Build

- **Cursor-based pagination** — Efficiently page through thousands of books
- **Rate limiting** — Protect your API from abuse with `express-rate-limit`
- **File uploads** — Handle book cover images with `multer`
- **API versioning** — Future-proof your endpoints with `/api/v1/`
- **Input validation** — Validate query params and request bodies with Zod

## Architecture

```
Client Request
    │
    ▼
Rate Limiter ──── Too fast? → 429 Too Many Requests
    │
    ▼
Auth Middleware ── No token? → 401 Unauthorized
    │
    ▼
Zod Validation ── Bad input? → 400 Bad Request
    │
    ▼
Controller ────── Business logic
    │
    ▼
Service Layer ─── Database queries (cursor pagination)
    │
    ▼
Response ─────── { data: [...], nextCursor: 42, hasMore: true }
```

## Key Concepts

### Cursor vs Offset Pagination
- **OFFSET**: `SELECT * FROM books OFFSET 10000 LIMIT 20` — DB reads and skips 10,000 rows. O(n).
- **CURSOR**: `SELECT * FROM books WHERE id > 42 LIMIT 20` — DB jumps to id=42 via index. O(1).
- Trade-off: No "jump to page 50" with cursors, but infinite scroll doesn't need that.

### Rate Limiting
- Prevents a single client from monopolizing server resources
- Different limits for different endpoints (auth = stricter)
- Returns `429 Too Many Requests` with `Retry-After` header

### File Uploads with Multer
- Never trust client filenames (path traversal attacks)
- Validate MIME types before saving
- Set size limits to prevent memory exhaustion

## Prerequisites

- Module 05 (Auth & Security) completed
- Docker Desktop running

## Your Task

1. Add `coverUrl` column to the books schema
2. Implement cursor-based pagination in `book.service.ts`
3. Configure `multer` with safe filenames and file type validation
4. Add rate limiting middleware with appropriate limits
5. Wire up the versioned routes under `/api/v1/`

## Testing

```bash
make setup    # Install deps, start DB
make solution # Run the solution
make smoke    # Run E2E smoke tests
make test     # Run integration tests
```

## Common Mistakes

1. **Using OFFSET for infinite scroll** — Gets slower with every page. Use cursor.
2. **Trusting req.file.originalname** — Attackers can upload `../../etc/passwd`. Generate your own filenames.
3. **Forgetting rate limit on auth endpoints** — Brute-force attacks need strict throttling.
4. **Not validating query params** — `?limit=DROP TABLE` shouldn't reach your database.

## What's Next

Module 13 adds real-time WebSocket support — live stock updates when books are purchased.
