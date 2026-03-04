/**
 * Health Check Controller
 *
 * TODO: Implement two health check endpoints:
 *
 * 1. livenessHandler — Always returns 200 { status: "ok" }
 *    Used by: container orchestrators
 *
 * 2. readinessHandler — Checks DB connection
 *    Returns 200 if DB is reachable, 503 if not
 *    Used by: load balancers
 *
 * 3. metricsHandler — Returns metrics from getMetrics()
 */
import { Request, Response } from 'express';

export async function livenessHandler(req: Request, res: Response) {
  // TODO: Return liveness status
  res.json({ status: 'ok' });
}

export async function readinessHandler(req: Request, res: Response) {
  // TODO: Check database connection, return 200 or 503
  res.json({ status: 'not_implemented' });
}

export function metricsHandler(req: Request, res: Response) {
  // TODO: Return metrics
  res.json({ message: 'not implemented' });
}
