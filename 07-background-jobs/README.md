# Module 07: Background Jobs (Message Queues)

> Never make a customer wait for work that can happen later.

## The Story

Black Friday at your bookstore. Orders are pouring in — 500 per minute. Each order needs a confirmation email, a PDF invoice, and an inventory update with the supplier. That's three network calls per order, each taking 1-3 seconds.

If you do all this inside the API request handler, customers wait 5-10 seconds for their order to process. Your server can only handle 10 concurrent requests, so the other 490 customers get timeouts. The site goes down. Revenue stops.

The fix is simple in concept: do the minimum work synchronously (save the order to the database), then hand off everything else to a background process. The API responds in 50ms with "got your order, we'll email you soon." A separate worker process picks up the heavy work from a queue and grinds through it at its own pace.

This is how every serious backend works — Amazon, Stripe, Shopify. The API is fast because it doesn't do the heavy lifting. The queue is the buffer. The worker is the muscle.

## What You'll Build

An order processing system with asynchronous background jobs:

```
Customer places order
       │
       ▼
┌──────────────────────┐     ┌─────────────┐
│   API Server         │────>│   Redis      │
│                      │     │   Queue      │
│ 1. Save order (DB)   │     └──────┬───────┘
│ 2. Add job to queue  │            │
│ 3. Return 202        │     ┌──────▼───────┐
│    "Order received"  │     │   Worker     │
└──────────────────────┘     │   Process    │
                             │              │
   50ms response time        │ 1. Send email│
                             │ 2. Gen PDF   │
                             │ 3. Update DB │
                             │    → completed│
                             └──────────────┘
                              Runs separately
                              Takes 3+ seconds
```

## Core Concepts

### 1. Why 202 Accepted?
HTTP 201 means "created and done." HTTP 202 means "received, processing will happen later." This status code tells the client: "Your request is valid, we saved it, but the full result isn't ready yet." The client can poll the order status endpoint to check progress.

### 2. BullMQ: Production Job Queues
BullMQ is built on Redis and handles the hard parts of background processing:
- **Retries**: If a job fails (email service down), BullMQ retries it automatically
- **Concurrency**: Process N jobs at once across multiple workers
- **Delays**: Schedule jobs for later (send reminder email in 24 hours)
- **Priorities**: VIP orders get processed before regular ones

### 3. Two-Process Architecture
The API server and the worker are separate Node.js processes:
- **API server** (`index.ts`): Fast — saves to DB, adds to queue, responds
- **Worker** (`worker.ts`): Slow — picks up jobs, does heavy work, updates DB

Why separate? If the worker crashes on a bad PDF, the API keeps running. You can also scale them independently: 1 API server + 5 workers during peak hours.

### 4. Graceful Degradation
What if Redis goes down? The API should still accept orders. The order is saved to PostgreSQL (durable). The background job can be dispatched later when Redis recovers. The try/catch around queue.add() is critical.

### 5. Lazy Initialization
The Redis connection and queue are created on first use, not at import time. This lets tests override `process.env.REDIS_URL` before any connection is attempted.

## Prerequisites

- Module 06 completed
- Docker Desktop running (PostgreSQL + Redis)
- Node.js 20+

## Getting Started

```bash
# Starts PostgreSQL + Redis, installs deps, pushes schema
make setup
```

## Your Task

Three files in `before/` need implementation:

1. **`queue.ts`** — Configure the BullMQ queue:
   - Parse `REDIS_URL` from environment
   - Create connection options with retry strategy
   - Create a named queue ('OrderConfirmations')

2. **`worker.ts`** — Build the background worker:
   - Create a BullMQ Worker listening to 'OrderConfirmations'
   - For each job: simulate heavy work (3s delay), then update order status to 'completed'
   - Handle failures and add graceful shutdown

3. **`services/order.service.ts`** — Wire up the order flow:
   - Save the order to PostgreSQL with status 'pending'
   - Dispatch a background job via the queue
   - Wrap queue dispatch in try/catch for resilience

## Running It

You need two terminals:

**Terminal 1 — API Server:**
```bash
make solution
```

**Terminal 2 — Background Worker:**
```bash
make solution-worker
```

Place an order and watch the worker pick it up:
```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' | jq -r .token)

# Place an order
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId":1,"quantity":2}'
```

## Testing Your Solution

The test suite intentionally sets Redis to an unavailable URL to verify graceful degradation:

```bash
make test
```

## Common Mistakes

1. **Not wrapping queue.add() in try/catch**: If Redis is down and the queue dispatch throws, the entire request fails — even though the order was already saved to the database.

2. **Forgetting `maxRetriesPerRequest: null`**: BullMQ workers use blocking Redis commands that wait indefinitely. If you set a retry limit, the worker falsely reports connection failures.

3. **Running worker and API in the same process**: They should be separate processes. The worker does slow, blocking work. If it's in the same process as the API, it steals CPU time from request handling.

## What's Next

Your API is fast because heavy work happens in the background. But database queries are still the bottleneck for read-heavy endpoints. In **Module 08**, you'll add a Redis cache layer that makes repeated reads instant.

*Hint: If you're stuck, check the completed code in `after/` or run `make solution`.*
