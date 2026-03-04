# Module 08: Caching and Optimization

> The fastest database query is the one you never make.

## The Story

Your bookstore API is handling traffic well. Background jobs keep things snappy. But you notice something in the monitoring dashboard: the `GET /api/books` endpoint is responsible for 80% of all database queries. It gets called on every page load, every search, every time someone browses the catalog. And the data barely changes — maybe 5 new books a day.

You're hammering PostgreSQL with the same query thousands of times per hour, getting the same result back. Each query takes 5-50ms depending on load. Multiply that by 10,000 requests per hour and you're spending 50-500 seconds of database time per hour on identical queries.

Redis stores data in memory. Memory access is ~100 nanoseconds. Disk access is ~10 milliseconds. That's a 100,000x difference. If you cache the book list in Redis, the second request (and the 10,000th) gets served in under a millisecond. The database only gets queried once every 60 seconds.

There's a famous saying in computer science: "There are only two hard things: cache invalidation and naming things." This module teaches you how to handle both.

## What You'll Build

A caching layer that sits between your service and database:

```
GET /api/books
      │
      ▼
┌──────────────────────┐
│   Book Service       │
│                      │
│ 1. Check Redis cache │──── HIT ──→ Return instantly (~1ms)
│         │            │
│       MISS           │
│         │            │
│ 2. Query PostgreSQL  │  (~5-50ms)
│ 3. Store in Redis    │  (TTL = 60 seconds)
│ 4. Return result     │
└──────────────────────┘

POST/DELETE /api/books
      │
      ▼
┌──────────────────────┐
│ 1. Write to DB       │
│ 2. Invalidate cache  │──→ Delete all 'books:*' keys
│ 3. Return result     │
└──────────────────────┘
```

## Core Concepts

### 1. Cache-Aside Pattern (Lazy Loading)
The application manages the cache explicitly:
- **Read path**: Check cache → miss → query DB → store in cache → return
- **Write path**: Write to DB → invalidate cache

Why "aside"? The cache sits alongside the database, not in front of it. Your code decides when to read from and write to the cache. Alternative patterns (write-through, read-through) have the cache manage itself, but cache-aside gives you the most control.

### 2. TTL: Time-To-Live
Every cached value has an expiration. After 60 seconds, Redis automatically deletes it. This is your safety net — even if you forget to invalidate, stale data self-corrects within the TTL window.

```typescript
// Cache for 60 seconds
await redis.set('books:all', JSON.stringify(books), 'EX', 60);
```

Choosing TTL is a tradeoff:
- **Low TTL (10s)**: Fresher data, more DB queries
- **High TTL (3600s)**: Fewer DB queries, potentially stale data
- **60s**: A reasonable default for most APIs

### 3. Cache Key Design
Good key naming makes invalidation easy:

| Key | Stores |
|-----|--------|
| `books:all` | The full book list |
| `books:42` | Book with ID 42 |
| `books:*` | Glob pattern matching all book keys |

When a book is created or deleted, `cacheDelete('books:*')` wipes everything related to books. Simple and safe.

### 4. Cache Invalidation
When data changes, cached data becomes stale. You must invalidate (delete) the cached version so the next read fetches fresh data from the database.

The tricky cases:
- Creating a book invalidates the list cache AND potentially individual caches
- Deleting a book invalidates both individual AND list caches
- Using `books:*` glob pattern handles both at once

### 5. Graceful Degradation
If Redis goes down, your API must still work. All cache operations are wrapped in try/catch — on failure, they return null (cache miss) or silently skip, falling through to the database. Slower, but functional.

## Prerequisites

- Module 07 completed (familiar with Redis)
- Docker Desktop running
- Node.js 20+

## Getting Started

```bash
make setup
```

## Your Task

Two files in `before/` need implementation:

1. **`services/cache.service.ts`** — Implement three cache operations:
   - `cacheGet<T>(key)` — Read from Redis, parse JSON, return typed result or null
   - `cacheSet(key, value, ttl)` — Serialize to JSON, store with expiration
   - `cacheDelete(pattern)` — Find all matching keys with `redis.keys()`, delete them
   - All three must use try/catch for graceful degradation

2. **`services/book.service.ts`** — Add caching to the existing service:
   - `getAllBooks()` — Check cache first, fall back to DB, store result
   - `getBookById(id)` — Same pattern with per-book cache keys
   - `createBook()` / `deleteBook()` — Invalidate cache after writes

## Testing Your Solution

The tests verify the API works both with and without Redis:
```bash
make test
```

To see caching live with Redis:
```bash
make db-up
make solution
```

Hit `GET /api/books` twice and watch the logs:
```
🔴 CACHE MISS: books:all    ← First call: queries database
🟢 CACHE HIT: books:all     ← Second call: served from Redis
```

## Common Mistakes

1. **Forgetting to invalidate on writes**: If you create a new book but don't invalidate the cache, `GET /api/books` returns the old list until the TTL expires. Always invalidate on mutations.

2. **Using `redis.keys()` in production**: The `KEYS` command scans the entire keyspace — it's O(N) and blocks Redis. Fine for development, but in production with millions of keys, use `SCAN` instead.

3. **Not handling Redis failures**: If you call `redis.get()` without try/catch and Redis is down, the entire request fails with a 500 error. Always wrap cache operations.

## What's Next

Your API is fast, cached, and resilient. But the codebase is growing — controllers mix HTTP logic with business rules, services are getting bloated. In **Module 09**, you'll restructure everything using Domain-Driven Design and functional architecture, creating a codebase that scales with complexity.

*Hint: If you're stuck, check the completed code in `after/` or run `make solution`.*
