import express from 'express';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { bookRouter } from './routes/book.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { requestLogger, errorHandler, logger } from './middlewares/logger.js';
import { requestId } from './middlewares/request-id.js';
import { metricsCollector } from './middlewares/metrics.js';
import { Server } from 'http';

export const app = express();

// 1. Request ID first (so all logs include it)
app.use(requestId);

// 2. Metrics collection
app.use(metricsCollector);

// 3. Standard middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// 4. Health checks (no auth required)
app.use('/health', healthRouter);

// 5. Application routes
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);

// 6. Error handling (must be last)
app.use(errorHandler);

let serverInstance: Server | null = null;

export function startServer(port: number = 3000): Server {
  serverInstance = app.listen(port, () => {
    logger.info({ port }, 'Book API started');
  });

  // Graceful shutdown handler
  function shutdown(signal: string) {
    logger.info({ signal }, 'Shutdown signal received, draining connections...');
    if (serverInstance) {
      serverInstance.close(() => {
        logger.info('All connections drained, exiting');
        process.exit(0);
      });
    }
    // Force exit after 10 seconds if connections don't drain
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return serverInstance;
}

export function stopServer() {
  if (serverInstance) serverInstance.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer(3000);
}
