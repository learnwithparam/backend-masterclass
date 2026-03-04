/**
 * Middleware Layer — Cross-Cutting Concerns
 *
 * Middleware functions run before (or after) your route handlers.
 * They're perfect for concerns that apply to many routes: logging,
 * authentication, rate limiting, CORS, etc.
 *
 * KEY CONCEPT: Middleware must call next() to pass control to the next
 * handler. If you forget next(), the request will hang forever.
 */
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Why Winston instead of console.log? Winston supports log levels (info, warn, error),
// structured JSON output for log aggregation services, and multiple transports
// (file, console, remote services). In production, you'd add a file transport.
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  logger.info(`${req.method} ${req.originalUrl}`);
  next(); // Don't forget this — without it, every request would time out
}

// KEY CONCEPT: Error-handling middleware has FOUR parameters.
// Express uses the argument count to detect error handlers.
// Even if you don't use `next`, you must include it in the signature.
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error(err.message || 'Internal Server Error');
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong on our end',
  });
}
