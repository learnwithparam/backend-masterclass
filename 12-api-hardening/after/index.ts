import express from 'express';
import cors from 'cors';
import path from 'path';
import { bookRouter } from './routes/book.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { requestLogger, errorHandler } from './middlewares/logger.js';
import { apiLimiter } from './middlewares/rate-limiter.js';
import { Server } from 'http';
import { mkdirSync } from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
mkdirSync(uploadDir, { recursive: true });

export const app = express();

// 1. Global Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// 2. Rate limit all API routes
app.use('/api', apiLimiter);

// 3. Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(uploadDir)));

// 4. Register Routes (versioned under /api/v1)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/books', bookRouter);

// Unversioned aliases — existing clients that call /api/books (without /v1)
// still work. Remove these once all frontends migrate to /api/v1/*.
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);

// 5. Error Handling Middleware (must be last!)
app.use(errorHandler);

let serverInstance: Server | null = null;

export function startServer(port: number = 3000): Server {
  serverInstance = app.listen(port, () => {
    console.log(`Book API running on http://localhost:${port}`);
  });
  return serverInstance;
}

export function stopServer() {
  if (serverInstance) {
    serverInstance.close();
  }
}

if (process.argv[1] && /after\/index\.(ts|js)$/.test(process.argv[1])) {
  startServer(3000);
}
