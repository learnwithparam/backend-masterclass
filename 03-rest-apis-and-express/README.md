# Module 03: REST APIs and Express

> Good architecture means every file has one job, and you know exactly where to look when something breaks.

## The Story

Your bookstore server from Module 02 works, but it has one route in one file. Now the product team wants a full API: list all books, get a book by ID, add new books, delete books. And they want it yesterday.

You could cram all the code into `index.ts` — the route definitions, the validation logic, the data manipulation, the error handling. It would work. For about two weeks. Then someone would ask you to add authors, categories, and search, and you'd be staring at a 2,000-line file where everything depends on everything else.

This is where architecture matters. Not astronaut architecture with 47 design patterns — just a simple rule: separate what changes for different reasons. Your HTTP handling changes when the API contract changes. Your business logic changes when the rules change. Your data access changes when you switch databases. Keep them in different files and they won't step on each other.

Think of a restaurant. The waiter (controller) takes orders and delivers food. The chef (service) actually cooks. The pantry (data layer) stores ingredients. The waiter doesn't cook, the chef doesn't seat customers, and the pantry doesn't take orders. When you hire a new chef, the waiters don't need retraining.

## What You'll Build

A complete CRUD API for managing books, organized into four clean layers:

```
          HTTP Request
               │
               ▼
┌─────────────────────────┐
│      Routes Layer       │  Maps URLs to controller functions
│  GET /api/books → fn    │  (book.routes.ts)
│  POST /api/books → fn   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│    Controller Layer     │  Parses HTTP input, validates with Zod,
│  getBooksHandler()      │  calls service, formats HTTP response
│  createBookHandler()    │  (book.controller.ts)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│     Service Layer       │  Pure business logic — no HTTP concepts
│  getAllBooks()           │  (book.service.ts)
│  createBook()           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│      Data Layer         │  In-memory array (for now)
│  booksDb: Book[]        │  Will become PostgreSQL in Module 04
│                         │  (data.ts)
└─────────────────────────┘
```

Plus cross-cutting middleware for logging and error handling.

## Core Concepts

### 1. REST: Resources and HTTP Methods
REST is a convention, not a protocol. It says: model your data as "resources" (books, users, orders) and use HTTP methods as verbs:

| Method | Path | Meaning | Status Code |
|--------|------|---------|-------------|
| GET | /api/books | List all books | 200 OK |
| GET | /api/books/:id | Get one book | 200 or 404 |
| POST | /api/books | Create a book | 201 Created |
| DELETE | /api/books/:id | Delete a book | 204 No Content |

The beauty of REST: any developer who sees these URLs immediately knows what they do. No documentation needed for the basics.

### 2. Express Router
Instead of piling all routes on `app`, Express Router lets you group related routes. You define them in a separate file and mount the whole group at a prefix:

```typescript
// book.routes.ts
const bookRouter = Router();
bookRouter.get('/', getBooksHandler);
bookRouter.post('/', createBookHandler);

// index.ts
app.use('/api/books', bookRouter);
```

### 3. The Controller-Service Split
Controllers know about HTTP (req, res, status codes). Services know about business logic (find, create, delete). This split means:
- You can test business logic without HTTP
- You can reuse services from CLI tools, background jobs, etc.
- When you change the API response format, you don't touch business logic

### 4. Middleware
Functions that run before your route handler. Perfect for concerns that apply across many routes:

```typescript
// Runs for every request, then passes control to the next handler
function requestLogger(req, res, next) {
  logger.info(`${req.method} ${req.originalUrl}`);
  next(); // Without this, the request hangs forever
}
```

### 5. Validation at the Boundary
Validate data where it enters your system — in the controller. Once data passes validation, the service can trust it completely. This prevents "defensive programming" from spreading through every layer.

## Prerequisites

- Module 02 completed (you understand Express basics)
- Node.js 20+

## Getting Started

```bash
# Install dependencies (includes Winston for logging)
make setup

# Review the test file to understand what the API should do
# tests/api.test.ts

# Open the skeleton
# before/index.ts
```

## Your Task

Build the complete API. Create these files inside `before/`:

1. **`data.ts`** — Define a `Book` interface and a `booksDb` array with a couple of seed books

2. **`services/book.service.ts`** — Implement pure functions:
   - `getAllBooks()` — returns the array
   - `getBookById(id)` — finds by ID or returns undefined
   - `createBook(input)` — generates an ID, adds to array, returns the new book
   - `deleteBook(id)` — removes from array, returns true/false

3. **`controllers/book.controller.ts`** — Implement HTTP handlers:
   - `getBooksHandler` — calls service, returns JSON
   - `getBookHandler` — parses ID from URL params, returns 404 if not found
   - `createBookHandler` — validates body with Zod, returns 201 or 400
   - `deleteBookHandler` — returns 204 on success, 404 if not found

4. **`routes/book.routes.ts`** — Wire up the Express Router

5. **`index.ts`** — Mount the router at `/api/books`

## Testing Your Solution

Start the server and test with curl:
```bash
npm run start:before

# In another terminal:
curl http://localhost:3000/api/books
curl http://localhost:3000/api/books/1
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"New Book","author":"You","pages":100,"published":"2024"}'
```

Run the automated tests:
```bash
make test
```

## Common Mistakes

1. **Forgetting `app.use(express.json())`**: Without this middleware, `req.body` is `undefined`. Express doesn't parse JSON bodies by default — you have to opt in.

2. **Returning after sending a response**: If you call `res.json()` but don't `return`, code continues executing and may try to send a second response, causing "Cannot set headers after they are sent."

3. **Putting business logic in controllers**: If your controller is doing array manipulation, that code should be in the service. Controllers should only translate between HTTP and your domain.

## What's Next

Your in-memory array resets every time the server restarts. In **Module 04**, you'll replace it with PostgreSQL — a real database that persists data to disk. The clean architecture you built here means you'll only need to change the data and service layers. The routes and controllers stay untouched.

*Hint: If you're stuck, check the completed code in `after/` or run `make solution`.*
