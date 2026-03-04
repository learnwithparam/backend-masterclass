/**
 * Structured Logging with Pino
 *
 * TODO: Replace console.log with pino structured logging:
 * 1. Create a pino logger with configurable log level from LOG_LEVEL env var
 * 2. In dev, use pino-pretty transport for readable output
 * 3. In requestLogger, log method, url, status, duration, and requestId
 * 4. In errorHandler, log error message, stack, method, url, and requestId
 */
import { Request, Response, NextFunction } from 'express';

// TODO: Replace with pino
export const logger = {
  info: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
};

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // TODO: Log structured JSON with pino instead of console.log
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err.message || 'Internal Server Error');
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
}
