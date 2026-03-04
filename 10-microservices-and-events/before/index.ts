import express from 'express';
import { fileURLToPath } from 'url';
import { bookRouter } from './routes/book.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { requestLogger, errorHandler } from './middlewares/logger.js';
import { Server } from 'http';

export const app = express();

// 1. Global Middleware
app.use(express.json()); // Parse JSON bodies
app.use(requestLogger);  // Log all requests

// 2. Register Routes
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);
app.use('/api/orders', orderRouter);

// 3. Error Handling Middleware (must be last!)
app.use(errorHandler);

let serverInstance: Server | null = null;

export function startServer(port: number = 3000): Server {
  serverInstance = app.listen(port, () => {
    // We use standard console.log here instead of winston just to keep the startup raw for the learner to see
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
