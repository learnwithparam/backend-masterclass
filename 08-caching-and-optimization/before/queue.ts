import { Queue, ConnectionOptions } from 'bullmq';
import * as dotenv from 'dotenv';
dotenv.config();

// Lazy-initialized connection options and queue.
// This allows tests to override process.env.REDIS_URL before the first call.
let _connectionOpts: ConnectionOptions | null = null;
let _orderQueue: Queue | null = null;

export function getRedisConnectionOpts(): ConnectionOptions {
  if (!_connectionOpts) {
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    const url = new URL(REDIS_URL);
    _connectionOpts = {
      host: url.hostname,
      port: parseInt(url.port, 10),
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => {
        // In tests we don't want infinite retries. Give up after 3 attempts.
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    };
  }
  return _connectionOpts;
}

export function getOrderQueue(): Queue {
  if (!_orderQueue) {
    _orderQueue = new Queue('OrderConfirmations', {
      connection: getRedisConnectionOpts(),
    });
  }
  return _orderQueue;
}
