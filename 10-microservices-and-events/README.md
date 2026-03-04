# Module 10: Microservices and Event-Driven Architecture

> Services that talk to each other synchronously are just a distributed monolith.

## The Story

Your bookstore has grown. The Order team ships features every week, but the Inventory team moves at a different pace — they're integrating with a warehouse API that changes quarterly. In the monolith, both teams edit the same codebase. The Inventory team's warehouse integration broke the Order API last Tuesday because they changed a shared database query.

The CTO makes a call: split the monolith. The Order Service handles customers, authentication, and order placement. The Inventory Service handles stock levels and warehouse sync. They deploy independently, scale independently, and fail independently.

But how do they communicate? If the Order Service calls the Inventory Service via HTTP (`fetch('http://inventory:4000/deduct-stock')`), you've just created a distributed monolith — if the Inventory Service is down, orders fail too.

The solution is events. When an order is placed, the Order Service announces "an order was placed" to a message bus. It doesn't know or care who's listening. The Inventory Service subscribes to that announcement and deducts stock on its own schedule. If the Inventory Service is temporarily down, orders still succeed — stock is deducted when it comes back online.

This is event-driven architecture, and it's how systems like Amazon, Uber, and Netflix scale to millions of operations per second.

## What You'll Build

Two independent microservices communicating via Redis Pub/Sub:

```
Customer places order
        │
        ▼
┌────────────────────────┐
│  Order Service (:3000) │
│                        │
│  1. Validate input     │
│  2. Save to orders DB  │
│  3. Publish event ─────┼──── "OrderPlaced" ────┐
│  4. Return 202         │     (Redis Pub/Sub)    │
└────────────────────────┘                        │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │ Inventory Service (:4000)│
                                    │                          │
                                    │ Subscribes to events     │
                                    │ Deducts stock from       │
                                    │ inventory table          │
                                    │                          │
                                    │ Eventually consistent    │
                                    └─────────────────────────┘
```

## Core Concepts

### 1. Event-Driven Architecture

Instead of services calling each other directly (request/response), they communicate through events:

- **Command**: "Deduct 2 items from stock" (tells a service what to do)
- **Event**: "Order #42 was placed" (announces what happened)

Events are better for microservices because the publisher doesn't need to know who subscribes. You can add an Email Service, Analytics Service, or Fraud Detection Service later without changing the Order Service.

### 2. Redis Pub/Sub

Redis Pub/Sub is a simple message broadcasting system:

```typescript
// Publisher (Order Service)
await redis.publish('OrderPlaced', JSON.stringify({
  orderId: 42, bookId: 7, quantity: 2
}));

// Subscriber (Inventory Service)
redis.subscribe('OrderPlaced');
redis.on('message', (channel, message) => {
  const data = JSON.parse(message);
  // Deduct stock...
});
```

Key difference from BullMQ:
- **BullMQ**: Point-to-point. One producer, one consumer. Jobs are persisted and retried.
- **Pub/Sub**: Broadcast. One publisher, many subscribers. Fire-and-forget.

### 3. Eventual Consistency

In the monolith, placing an order and deducting stock happened in the same database transaction — instant consistency. In microservices, the stock is deducted milliseconds *after* the order is placed. During those milliseconds, the system is "eventually consistent."

This is the fundamental tradeoff of microservices: you give up immediate consistency for loose coupling and independent deployability. For most e-commerce systems, milliseconds of inconsistency is perfectly acceptable.

### 4. Service Data Ownership

Each service owns its own data:
- **Order Service** owns the `orders`, `books`, and `users` tables
- **Inventory Service** owns the `inventory` table

Neither service queries the other's tables directly. They share only IDs via events. If the Inventory Service needs the book title, it must maintain its own copy (or the event must include it).

### 5. Domain Events

Events are named in past tense because they describe something that already happened:
- `OrderPlaced` (not `PlaceOrder`)
- `PaymentReceived` (not `ProcessPayment`)
- `StockDepleted` (not `CheckStock`)

This naming convention makes the event's purpose immediately clear — it's a fact, not a command.

## Prerequisites

- Module 09 completed
- Docker Desktop running
- Node.js 20+

## Getting Started

```bash
make setup
```

## Your Task

The `before/` directory contains the Module 09 monolith with BullMQ job dispatch. Your job is to:

1. **Create the Event Publisher** (`events/publisher.ts`):
   - `getEventPublisher()` — lazy Redis connection with retry strategy
   - `publishDomainEvent(eventName, payload)` — serialize and publish to Redis channel
   - Wrap in try/catch for graceful degradation

2. **Refactor the Use Case** (`use-cases/order/place-order.ts`):
   - Replace `import { getOrderQueue }` with `import { publishDomainEvent }`
   - Replace `queue.add('sendConfirmationEmail', ...)` with `publishDomainEvent('OrderPlaced', ...)`

3. **Create the Inventory Service** (new `inventory-service/` directory):
   - `index.ts` — Express app with `/health` endpoint, calls `setupEventSubscriptions()`
   - `db/schema.ts` — `inventory` table with `bookId`, `stockQuantity`, `lastUpdated`
   - `events/subscriber.ts` — Subscribe to 'OrderPlaced', deduct stock atomically

4. **Remove dead code**: Delete `queue.ts` and `worker.ts` from the Order Service

## Running the Microservices

You need **three terminals**:

**Terminal 1 — Databases + Order Service:**
```bash
make setup
make order-service
```

**Terminal 2 — Inventory Service:**
```bash
make inventory-service
```

**Terminal 3 — Test it:**
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' | jq -r .token)

# Place an order — watch Terminal 2 for the event!
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId":1,"quantity":2}'
```

## Testing Your Solution

```bash
make test
```

The test suite verifies the full event flow: place order via HTTP → event published → inventory updated.

## Common Mistakes

1. **Using the same Redis connection for Pub/Sub and regular commands**: In Redis, a connection in subscriber mode can ONLY receive messages — it can't run `GET`, `SET`, etc. The subscriber must be a dedicated connection.

2. **Not handling missing inventory records**: If a book has no row in the `inventory` table, the `UPDATE` query silently does nothing. Consider using `INSERT ... ON CONFLICT` (upsert) for robustness.

3. **Forgetting fire-and-forget semantics**: Unlike BullMQ, Pub/Sub messages are lost if no one is listening when they're published. If the Inventory Service is down when an order is placed, that stock deduction is lost. In production, use a durable message bus (Kafka, RabbitMQ) instead.

## What's Next

Your microservices work locally, but running them requires multiple terminal tabs and manual Docker setup. In **Module 11**, you'll containerize everything with multi-stage Dockerfiles, orchestrate with Docker Compose, and add CI/CD with GitHub Actions — so deployment is a single `docker compose up`.

*Hint: If you're stuck, check the completed code in `after/` or run `make solution`.*
