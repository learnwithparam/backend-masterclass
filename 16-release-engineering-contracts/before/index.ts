import express from 'express';
import { fileURLToPath } from 'url';
import cors from 'cors';
import path from 'path';
import { bookRouter } from './routes/book.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { requestLogger, errorHandler } from './middlewares/logger.js';
// TODO: Import the API rate limiter middleware
import { Server } from 'http';
import { mkdirSync } from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
mkdirSync(uploadDir, { recursive: true });

export const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// TODO: Apply API rate limiter to all /api routes

// TODO: Serve uploaded files statically from /uploads

// TODO: Register versioned routes under /api/v1/auth and /api/v1/books
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer(3000);
}
