/**
 * Request ID Middleware — Correlation IDs
 *
 * KEY CONCEPT: When a request flows through multiple services (API → DB → cache),
 * a correlation ID links all the log lines together. Without it, matching
 * "DB query took 500ms" to "GET /api/books returned 500" is impossible.
 *
 * The client can send X-Request-Id (load balancers often do this).
 * If missing, we generate one. Either way, we echo it in the response.
 */
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestId(req: Request, res: Response, next: NextFunction) {
  // Use existing header or generate new UUID
  const id = (req.headers['x-request-id'] as string) || randomUUID();

  // Set on request for downstream use
  req.headers['x-request-id'] = id;

  // Echo in response so the client can reference it in bug reports
  res.setHeader('X-Request-Id', id);

  next();
}
