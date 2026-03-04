import { Queue, ConnectionOptions } from 'bullmq';
import * as dotenv from 'dotenv';
dotenv.config();

// We use lazy initialization so tests can override process.env.REDIS_URL
// before the first call. If we created the queue at import time, the
// connection would be established with the wrong URL.
let _connectionOpts: ConnectionOptions | null = null;
let _orderQueue: Queue | null = null;

// TODO: Implement getRedisConnectionOpts()
// 1. Parse REDIS_URL from process.env (default: 'redis://localhost:6379')
// 2. Return a ConnectionOptions object with host, port from the URL
// 3. Set maxRetriesPerRequest: null (required for BullMQ listeners)
// 4. Add a retryStrategy that gives up after 3 attempts
export function getRedisConnectionOpts(): ConnectionOptions {
  if (!_connectionOpts) {
    // Your code here
    _connectionOpts = {} as ConnectionOptions;
  }
  return _connectionOpts;
}

// TODO: Implement getOrderQueue()
// Create a BullMQ Queue named 'OrderConfirmations' with Redis connection options
// Use lazy initialization (only create on first call)
export function getOrderQueue(): Queue {
  if (!_orderQueue) {
    // Your code here
  }
  return _orderQueue!;
}
