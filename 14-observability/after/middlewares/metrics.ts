/**
 * Basic Metrics Middleware
 *
 * KEY CONCEPT: Metrics tell you HOW your system is performing.
 * Logs tell you WHAT happened. You need both.
 *
 * We track:
 * - Total request count (by method and status class)
 * - Response time histogram (p50, p95, p99)
 * - Error rate
 *
 * In production, you'd export these to Prometheus/Datadog.
 * Here we expose them via GET /metrics for learning.
 */
import { Request, Response, NextFunction } from 'express';

interface MetricsData {
  totalRequests: number;
  errorCount: number;
  responseTimes: number[];
  statusCodes: Record<string, number>;
  startedAt: string;
}

const metrics: MetricsData = {
  totalRequests: 0,
  errorCount: 0,
  responseTimes: [],
  statusCodes: {},
  startedAt: new Date().toISOString(),
};

export function metricsCollector(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.totalRequests++;
    metrics.responseTimes.push(duration);

    // Keep only last 1000 response times (sliding window)
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes = metrics.responseTimes.slice(-1000);
    }

    const statusClass = `${Math.floor(res.statusCode / 100)}xx`;
    metrics.statusCodes[statusClass] = (metrics.statusCodes[statusClass] || 0) + 1;

    if (res.statusCode >= 500) {
      metrics.errorCount++;
    }
  });

  next();
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function getMetrics(): object {
  return {
    totalRequests: metrics.totalRequests,
    errorCount: metrics.errorCount,
    errorRate: metrics.totalRequests > 0
      ? (metrics.errorCount / metrics.totalRequests * 100).toFixed(2) + '%'
      : '0%',
    responseTimes: {
      p50: percentile(metrics.responseTimes, 50),
      p95: percentile(metrics.responseTimes, 95),
      p99: percentile(metrics.responseTimes, 99),
    },
    statusCodes: metrics.statusCodes,
    uptime: Math.floor((Date.now() - new Date(metrics.startedAt).getTime()) / 1000) + 's',
    startedAt: metrics.startedAt,
  };
}
