/**
 * Queue Configuration — BullMQ + Redis Setup
 *
 * BullMQ uses Redis as a message broker. This file configures the connection
 * and creates a named queue that both the API server (producer) and the
 * background worker (consumer) share.
 */
import { Queue, ConnectionOptions } from 'bullmq';
import * as dotenv from 'dotenv';
dotenv.config();

// KEY CONCEPT: Lazy initialization. We don't create the Redis connection at
// import time — we wait until the first call. This lets tests override
// process.env.REDIS_URL before any connection is attempted.
let _connectionOpts: ConnectionOptions | null = null;
let _orderQueue: Queue | null = null;

export function getRedisConnectionOpts(): ConnectionOptions {
  if (!_connectionOpts) {
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    const url = new URL(REDIS_URL);
    _connectionOpts = {
      host: url.hostname,
      port: parseInt(url.port, 10),
      // KEY CONCEPT: maxRetriesPerRequest must be null for BullMQ workers.
      // BullMQ uses blocking Redis commands (BRPOPLPUSH) that need to wait
      // indefinitely. A retry limit would cause false "connection lost" errors.
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times: number) => {
        if (times > 3) return null; // Give up after 3 attempts (for tests)
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
