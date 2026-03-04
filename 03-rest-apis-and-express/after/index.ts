/**
 * Module 03: REST APIs and Express — Application Entry Point
 *
 * This is the "composition root" where we wire everything together:
 * middleware, routes, and error handling. The order matters —
 * Express processes middleware in the order you register them.
 */
import express from 'express';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { bookRouter } from './routes/book.routes.js';
import { requestLogger, errorHandler } from './middlewares/logger.js';
import { Server } from 'http';

export const app = express();

// KEY CONCEPT: Middleware ordering matters. These run top-to-bottom for every request.
// 1. Allow cross-origin requests (so our frontend on a different port can call this API)
// 2. Parse JSON bodies (so route handlers can access req.body)
// 3. Log every request (for debugging and auditing)
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Mount the book router at /api/books — all book routes are prefixed automatically
app.use('/api/books', bookRouter);

// KEY CONCEPT: Error-handling middleware MUST be registered last and MUST have
// exactly 4 parameters (err, req, res, next). Express uses the parameter count
// to distinguish error handlers from regular middleware.
app.use(errorHandler);

let serverInstance: Server | null = null;

export function startServer(port: number = 3000): Server {
  serverInstance = app.listen(port, () => {
    console.log(`🚀 Book API running on http://localhost:${port}`);
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
