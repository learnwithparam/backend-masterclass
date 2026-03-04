# Module 09: Domain-Driven Design (Functional Architecture)

> Good architecture makes the system easy to change. Great architecture makes it hard to break.

## The Story

Your bookstore backend works. Orders are placed, emails are sent, caching is fast. But look at the `order.service.ts` file from Module 08. It does *everything*:

```typescript
export async function placeOrder(userId, bookId, quantity) {
  // Validates input? No, the controller does that.
  // Business rules? Inline, mixed with SQL.
  // Database queries? Right here.
  // Background jobs? Also here.
  // Error handling? Hopefully someone added try/catch.
}
```

This is a "fat service" — a function that knows too much. It knows about Drizzle ORM, BullMQ, Zod validation, and business rules. If you want to test the business rule "new orders must be pending," you need a running database and a Redis connection. That's a lot of infrastructure to test a one-line rule.

Now imagine your team grows. Two developers need to change the order flow at the same time — one is adding a discount system, the other is adding order limits. They're both editing the same 50-line function. Merge conflicts everywhere.

Domain-Driven Design (DDD) solves this by separating *what the business does* from *how the infrastructure works*. Business rules become pure functions you can test with `expect(createNewOrder(input).status).toBe('pending')` — no database, no Redis, no mocks.

## What You'll Build

A refactored order system with four clean layers:

```
HTTP Request
     │
     ▼
┌─────────────────────────────────┐
│  Controller (Presentation)      │  Thin: extract req data, call use case,
│  controllers/order.controller   │  map result to HTTP response
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Use Case (Application)         │  Orchestrate: validate → check rules →
│  use-cases/order/place-order    │  create entity → persist → side effects
└──────────────┬──────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│ Domain       │ │ Repository   │
│ (Pure Logic) │ │ (Data Access)│
│              │ │              │
│ order.types  │ │ order.repo   │
│ order.entity │ │ book.repo    │
└──────────────┘ └──────────────┘
  No side effects   Only DB queries
  No imports         No business logic
  100% testable      Swappable
```

## Core Concepts

### 1. Pure Functions (Domain Layer)

A pure function has no side effects — no database calls, no network requests, no `console.log`. Given the same input, it always returns the same output.

```typescript
// Pure function: creates an order entity
export function createNewOrder(input: CreateOrderInput): OrderEntity {
  return {
    userId: input.userId,
    bookId: input.bookId,
    quantity: input.quantity,
    status: 'pending' // Business rule: new orders are always pending
  };
}
```

Why pure? Because you can test it like this:

```typescript
const order = createNewOrder({ userId: 1, bookId: 42, quantity: 2 });
expect(order.status).toBe('pending'); // No database needed!
```

### 2. Value Objects (Zod Schemas)

Value Objects encode business rules as validation schemas. They ensure invalid data never reaches your domain:

```typescript
export const QuantitySchema = z.number().int().positive()
  .max(100, "Cannot order more than 100 items at once");
```

This is a business rule — "maximum 100 items per order" — expressed as a type that can be validated at any boundary (controller, CLI, API gateway).

### 3. Repository Pattern (Data Access Layer)

Repositories are the *only* code that knows about your database. They translate between domain entities and database rows:

```typescript
export async function insertOrder(order: OrderEntity): Promise<OrderEntity> {
  const result = await db.insert(orders).values({ ... }).returning();
  return result[0] as OrderEntity;
}
```

Why not put queries in the use case? If you switch from PostgreSQL to MongoDB, you change the repository. The use case and domain logic remain untouched.

### 4. Use Cases (Application Layer)

Use cases orchestrate the workflow. They follow a predictable recipe:

1. **Validate** input (Zod schema at the boundary)
2. **Check** business rules (book must exist)
3. **Create** domain entity (pure function)
4. **Persist** via repository (database)
5. **Trigger** side effects (events, queues)

```typescript
export async function placeOrderUseCase(input: unknown): Promise<OrderEntity> {
  const parsed = CreateOrderInputSchema.safeParse(input);  // 1. Validate
  const bookExists = await checkBookExists(data.bookId);   // 2. Check
  const entity = createNewOrder(data);                     // 3. Create
  const saved = await insertOrder(entity);                 // 4. Persist
  await queue.add('sendEmail', { orderId: saved.id });     // 5. Side effect
  return saved;
}
```

### 5. Thin Controllers

In DDD, controllers do exactly three things:
1. Extract data from the HTTP request
2. Call the appropriate use case
3. Map the result (or error) to an HTTP response

Compare the before (fat controller with inline Zod schemas and service calls) to the after (thin controller that delegates everything to the use case).

## Prerequisites

- Module 08 completed
- Docker Desktop running
- Node.js 20+

## Getting Started

```bash
make setup
```

## Your Task

The `before/` directory contains the Module 08 monolithic architecture. Your job is to refactor it into the DDD layered architecture visible in `after/`.

1. **Create Value Objects** (`domain/order/order.types.ts`):
   - Define `QuantitySchema` with Zod (positive integer, max 100)
   - Define `CreateOrderInputSchema` (userId, bookId, quantity)
   - Define `OrderEntity` type with typed status field

2. **Create Entity Functions** (`domain/order/order.entity.ts`):
   - `createNewOrder(input)` — pure function returning entity with status 'pending'
   - `markOrderCompleted(order)` — enforces only pending orders can be completed

3. **Create Repositories** (`domain/order/order.repository.ts`, `domain/book/book.repository.ts`):
   - Move all database queries from the service into repository functions
   - `checkBookExists(bookId)` — boolean check for order validation

4. **Create Use Cases** (`use-cases/order/place-order.ts`, `use-cases/order/get-order.ts`):
   - Orchestrate the 5-step workflow (validate → check → create → persist → dispatch)
   - Define `DomainError` class for distinguishing client errors from server errors

5. **Slim Down the Controller** (`controllers/order.controller.ts`):
   - Remove inline Zod schema
   - Call use case instead of service
   - Map `DomainError` to 400, other errors to `next(error)`

## Testing Your Solution

```bash
make test
```

The test suite includes both pure domain tests (no database needed!) and integration tests with Testcontainers.

## Common Mistakes

1. **Putting business logic in the repository**: The repository should only know about database operations (insert, select, update, delete). Business rules like "orders start as pending" belong in the domain entity functions.

2. **Making the controller too smart**: If your controller is validating input with Zod, it's doing too much. The use case should call `safeParse` — the controller just passes raw data through.

3. **Importing the database in domain functions**: Domain functions must be pure. If `createNewOrder` imports `db`, it's no longer a pure function and loses its testability advantage.

## What's Next

Your codebase is clean, layered, and testable. But it's still a monolith — one Node.js process handling everything. In **Module 10**, you'll split this into two independent microservices that communicate via Redis Pub/Sub events, achieving true loose coupling and independent deployability.

*Hint: If you're stuck, check the completed code in `after/` or run `make solution`.*
