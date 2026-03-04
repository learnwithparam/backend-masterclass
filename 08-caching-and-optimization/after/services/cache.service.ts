/**
 * Cache Service — Redis-Backed Cache-Aside Pattern
 *
 * Provides generic get/set/delete operations for caching any data in Redis.
 * All operations are wrapped in try/catch for graceful degradation — if Redis
 * goes down, the app still works (just slower, hitting the DB every time).
 */
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

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

// KEY CONCEPT: TTL (Time-To-Live) determines how long cached data is valid.
// 60 seconds is a reasonable default — stale data for at most 1 minute.
// Lower TTL = fresher data but more DB queries. Higher TTL = faster but staler.
const DEFAULT_TTL = 60;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const cached = await getRedisClient().get(key);
    if (cached) {
      console.log(`🟢 CACHE HIT: ${key}`);
      return JSON.parse(cached) as T;
    }
    console.log(`🔴 CACHE MISS: ${key}`);
    return null;
  } catch {
    // KEY CONCEPT: Graceful degradation. If Redis is down, return null
    // so the caller falls through to the database. The app is slower
    // but still functional.
    console.warn('⚠️ Redis unavailable, skipping cache read');
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
  try {
    // 'EX' sets expiration in seconds. After TTL, Redis automatically deletes the key.
    await getRedisClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    console.warn('⚠️ Redis unavailable, skipping cache write');
  }
}

export async function cacheDelete(pattern: string): Promise<void> {
  try {
    // WARNING: redis.keys() is O(N) — it scans the entire keyspace.
    // Fine for development and small datasets, but in production with
    // millions of keys, use SCAN or maintain a set of known cache keys.
    const keys = await getRedisClient().keys(pattern);
    if (keys.length > 0) {
      await getRedisClient().del(...keys);
      console.log(`🗑️ CACHE INVALIDATED: ${keys.length} key(s) matching "${pattern}"`);
    }
  } catch {
    console.warn('⚠️ Redis unavailable, skipping cache invalidation');
  }
}
