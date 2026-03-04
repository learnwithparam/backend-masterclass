import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Lazy singleton for Redis client
let _redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!_redis) {
    _redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });
  }
  return _redis;
}

const DEFAULT_TTL = 60; // 60 seconds

// TODO: Implement cacheGet<T>(key: string): Promise<T | null>
// 1. Call getRedisClient().get(key) to read from Redis
// 2. If the key exists, parse the JSON and return it
// 3. If not, return null (cache miss)
// 4. IMPORTANT: Wrap everything in try/catch — if Redis is down, return null
//    so the app degrades gracefully to direct DB queries
export async function cacheGet<T>(key: string): Promise<T | null> {
  // Your code here
  return null;
}

// TODO: Implement cacheSet(key, value, ttlSeconds): Promise<void>
// 1. Serialize the value with JSON.stringify
// 2. Store it in Redis with: redis.set(key, json, 'EX', ttlSeconds)
//    'EX' sets the expiration in seconds — after TTL, Redis auto-deletes the key
// 3. Wrap in try/catch for graceful degradation
export async function cacheSet(key: string, value: unknown, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
  // Your code here
}

// TODO: Implement cacheDelete(pattern): Promise<void>
// 1. Find all keys matching the pattern: redis.keys(pattern)
//    Example: 'books:*' matches 'books:all', 'books:1', 'books:42'
// 2. Delete them: redis.del(...keys)
// 3. Wrap in try/catch
//
// WARNING: redis.keys() is O(N) and scans the entire keyspace.
// In production with millions of keys, use SCAN instead.
// For our small dataset, keys() is fine.
export async function cacheDelete(pattern: string): Promise<void> {
  // Your code here
}
