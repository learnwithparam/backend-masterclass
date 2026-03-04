import express from 'express';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { bookRouter } from './routes/book.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { requestLogger, errorHandler } from './middlewares/logger.js';
// TODO: Import requestId middleware
// TODO: Import metricsCollector middleware
import { Server } from 'http';

export const app = express();

// TODO: Add requestId middleware (first!)
// TODO: Add metricsCollector middleware

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);

app.use(errorHandler);

let serverInstance: Server | null = null;

export function startServer(port: number = 3000): Server {
  serverInstance = app.listen(port, () => {
    console.log(`Book API running on http://localhost:${port}`);
  });

  // TODO: Add graceful shutdown handlers for SIGTERM and SIGINT

  return serverInstance;
}

export function stopServer() {
  if (serverInstance) serverInstance.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer(3000);
}
