# Module 04: Data Persistence with PostgreSQL

> If your data disappears when you restart the server, you don't have a product — you have a demo.

## The Story

Your bookstore API is working great. The team has been testing it all week, adding books, checking routes, feeling good about the architecture. Then someone restarts the server for a config change.

Every book is gone. Every record vanished. The in-memory array starts empty every time.

This is the moment every backend engineer learns the hard way: in-memory data is temporary. For a real product, you need persistence — a database that survives restarts, crashes, and deployments. PostgreSQL is the most popular open-source relational database, and Drizzle ORM is a modern TypeScript-first way to talk to it without writing raw SQL strings everywhere.

The beautiful part? Because you built clean layers in Module 03, you only need to change the data and service layers. Your controllers and routes stay exactly the same.

## What You'll Build

The same Book API from Module 03, but now backed by PostgreSQL. When you create a book, it's stored on disk. When you restart the server, the data is still there.

```
 Express App (same controllers, same routes)
       │
       ▼
┌──────────────────────┐
│   Service Layer      │  Now uses Drizzle ORM queries
│   book.service.ts    │  instead of array operations
└───────────┬──────────┘
            │
            ▼
┌──────────────────────┐
│   Drizzle ORM        │  Type-safe query builder
│   db.select()        │  Generates SQL for you
│   db.insert()        │
└───────────┬──────────┘
            │
            ▼
┌──────────────────────┐
│   PostgreSQL         │  Runs in Docker
│   (port 5432)        │  Data persists to disk
└──────────────────────┘
```

## Core Concepts

### 1. Why PostgreSQL?
PostgreSQL is a relational database — it stores data in tables with rows and columns, enforces constraints (unique usernames, non-null fields), and supports transactions (all-or-nothing operations). It's the default choice for most backend applications.

### 2. ORM: Object-Relational Mapping
An ORM translates between your TypeScript objects and SQL queries. Instead of writing raw SQL, you write:

```typescript
db.select().from(books).where(eq(books.id, 1))
```

Drizzle generates the SQL, sends it to PostgreSQL, and returns typed results. If you misspell a column name, TypeScript catches it at compile time.

### 3. Schema Definition
You define your database tables in TypeScript:

```typescript
export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  pages: integer('pages').notNull(),
});

// Drizzle infers these types from the schema
type Book = typeof books.$inferSelect;    // { id: number, title: string, ... }
type NewBook = typeof books.$inferInsert;  // { title: string, ... }
```

### 4. Docker for Local Development
Instead of installing PostgreSQL on your machine, Docker runs it in an isolated container. One command to start, one command to stop.

### 5. The async/await Shift
Database queries are I/O operations — they go over the network to PostgreSQL and wait for a response. This means services become `async` and controllers need `await` plus `try/catch` error handling.

## Prerequisites

- Module 03 completed
- Docker Desktop installed and running
- Node.js 20+

## Getting Started

```bash
# Start PostgreSQL in Docker + install dependencies + push schema
make setup
```

You can inspect your database visually:
```bash
make db-studio
```

## Your Task

Open `before/services/book.service.ts`. It currently uses the old in-memory array with TODO comments showing what to replace:

1. **Import the database** — replace the `booksDb` import with the Drizzle `db` instance

2. **Replace array operations with Drizzle queries:**
   - `getAllBooks()` → `db.select().from(books)`
   - `getBookById(id)` → `db.select().from(books).where(eq(books.id, id))`
   - `createBook(input)` → `db.insert(books).values(input).returning()`
   - `deleteBook(id)` → `db.delete(books).where(eq(books.id, id)).returning()`

3. **Update controllers to be async** — the before/ controllers need `async/await` and `try/catch` with `next(error)` (check `book.controller.ts`)

## Testing Your Solution

Start the server and test persistence:
```bash
npm run start:before

# Create a book, then restart the server — verify the book survived
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Book","author":"You","pages":100,"published":"2024"}'
```

Run the automated tests:
```bash
make test
```

When finished, tear down the database:
```bash
make db-down
```

## Common Mistakes

1. **Forgetting `await` on service calls**: Without `await`, the controller sends a Promise object as the response instead of actual data. The client gets `{}` instead of books.

2. **Not adding `try/catch` to controllers**: Database queries can fail (connection issues, constraint violations). Without try/catch, an unhandled promise rejection crashes your server.

3. **Docker not running**: If you see "connection refused," make sure Docker Desktop is running and the container is up (`docker compose up -d`).

## What's Next

Your API stores data persistently, but anyone can create or delete books. In **Module 05**, you'll add authentication (who are you?) and authorization (what are you allowed to do?) using JWT tokens and bcrypt password hashing.

*Hint: If you're stuck, check the completed code in `after/` or run `make solution`.*
