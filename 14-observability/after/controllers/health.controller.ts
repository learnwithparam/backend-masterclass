/**
 * Health Check Controller
 *
 * KEY CONCEPT: Two types of health checks:
 *
 * /health (liveness) — "Is the process running?" Returns 200 always.
 *   Used by: container orchestrators to decide if the process crashed.
 *   If this fails, Kubernetes restarts the pod.
 *
 * /health/ready (readiness) — "Can it serve traffic?" Checks dependencies.
 *   Used by: load balancers to decide if they should send traffic.
 *   If this fails, the instance is removed from the pool but not restarted.
 */
import { Request, Response } from 'express';
import { client } from '../db/index.js';
import { getMetrics } from '../middlewares/metrics.js';

export async function livenessHandler(req: Request, res: Response) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

export async function readinessHandler(req: Request, res: Response) {
  const checks: Record<string, { status: string; message?: string }> = {};

  // Check PostgreSQL connection
  try {
    await client`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (err: any) {
    checks.database = { status: 'error', message: err.message };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
}

export function metricsHandler(req: Request, res: Response) {
  res.json(getMetrics());
}
