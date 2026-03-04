import express from 'express';
import { fileURLToPath } from 'url';
import { Server } from 'http';

export const app = express();
app.use(express.json());

// Welcome to Module 03!
// Your goal: Build a complete REST API for managing books.
//
// Architecture to implement (one file per layer):
//   Routes      → Map URLs to controller functions
//   Controllers → Parse HTTP requests, call services, send responses
//   Services    → Business logic (CRUD on the in-memory array)
//   Data        → The Book interface + in-memory array
//
// TODO 1: Create data.ts with a Book interface and a booksDb array
// TODO 2: Create services/book.service.ts with getAllBooks, getBookById, createBook, deleteBook
// TODO 3: Create controllers/book.controller.ts with handler functions + Zod validation
// TODO 4: Create routes/book.routes.ts using Express Router
// TODO 5: Import and mount the router here at '/api/books'
//
// Tip: Look at the tests in `tests/api.test.ts` to see exactly what URLs
// and JSON structures are expected.

let serverInstance: Server | null = null;

export function startServer(port: number = 3000): Server {
  serverInstance = app.listen(port, () => {
    console.log(`🚀 API running on http://localhost:${port}`);
  });
  return serverInstance;
}

export function stopServer() {
  if (serverInstance) {
    serverInstance.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer(3000);
}
