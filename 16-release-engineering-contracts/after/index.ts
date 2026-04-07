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
const failureDrillsEnabled = process.env.FAILURE_DRILLS === 'enabled';
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Book API',
    version: '1.0.0',
    description: 'Contract-first release engineering demo for the backend masterclass',
  },
  paths: {
    '/api/v1/books': {
      get: { summary: 'List books with cursor pagination' },
      post: { summary: 'Create a book' },
    },
    '/api/v1/books/{id}/cover': {
      post: { summary: 'Upload a book cover' },
    },
    '/api/v1/auth/login': {
      post: { summary: 'Log in and receive a JWT' },
    },
  },
};

// 1. Global Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// 2. Rate limit all API routes
app.use('/api', apiLimiter);

// 3. Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(uploadDir)));

// 3b. Publish the contract before clients integrate against it.
app.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

app.get('/docs', (_req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head><title>Book API Docs</title></head>
      <body>
        <h1>Book API Docs</h1>
        <p>The OpenAPI contract is available at <a href="/openapi.json">/openapi.json</a>.</p>
      </body>
    </html>
  `);
});

// 4. Register Routes (versioned under /api/v1)
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/books', (req, res, next) => {
  if (failureDrillsEnabled && req.query.injectFailure === '1') {
    res.status(503).json({
      error: 'Injected failure for release drill',
      detail: 'Simulated downstream outage',
    });
    return;
  }
  next();
});
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
