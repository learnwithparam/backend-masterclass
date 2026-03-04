/**
 * Structured Logging with Pino
 *
 * KEY CONCEPT: console.log produces unstructured text. Pino produces
 * structured JSON. When you have 10,000 log lines, you can filter by
 * level, search by request ID, and calculate p99 response times —
 * impossible with plain text.
 *
 * Why Pino over Winston? Pino is 5x faster because it uses JSON.stringify
 * directly instead of building objects. In high-throughput services,
 * logging overhead matters.
 */
import pino from 'pino';
import { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // In production, pipe to pino-pretty externally: node app.js | pino-pretty
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Log after the response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      requestId: req.headers['x-request-id'],
    }, `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error({
    err: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    requestId: req.headers['x-request-id'],
  }, 'Unhandled error');

  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong on our end',
  });
}
