import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { bookRouter } from './routes/book.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { requestLogger, errorHandler } from './middlewares/logger.js';
import { Server } from 'http';

export const app = express();
const openapiSpec = JSON.parse(
  readFileSync(new URL('./openapi.json', import.meta.url), 'utf8'),
);

// 1. Global Middleware
app.use(cors()); // Allow cross-origin requests from our frontend
app.use(express.json()); // Parse JSON bodies
app.use(requestLogger);  // Log all requests

// 2. Register Routes
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);
app.use('/api/orders', orderRouter);

// Contract-first release artifact
app.get('/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});

// Failure drill endpoint for release rehearsals
app.get('/api/chaos', (req, res) => {
  if (req.query.mode === 'dependency') {
    return res.status(503).json({
      error: 'Downstream dependency unavailable',
      drill: 'dependency-outage',
    });
  }

  res.json({ status: 'ok', drill: false });
});

// 3. Error Handling Middleware (must be last!)
app.use(errorHandler);

let serverInstance: Server | null = null;

export function startServer(port: number = 3150): Server {
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

if (process.argv[1] && /order-service[\\/](index|main)\.(ts|js)$/.test(process.argv[1])) {
  startServer(3150);
}
