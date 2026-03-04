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

// Cache-Aside pattern helpers
const DEFAULT_TTL = 60; // 60 seconds

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
    console.warn('⚠️ Redis unavailable, skipping cache read');
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
  try {
    await getRedisClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    console.warn('⚠️ Redis unavailable, skipping cache write');
  }
}

export async function cacheDelete(pattern: string): Promise<void> {
  try {
    const keys = await getRedisClient().keys(pattern);
    if (keys.length > 0) {
      await getRedisClient().del(...keys);
      console.log(`🗑️ CACHE INVALIDATED: ${keys.length} key(s) matching "${pattern}"`);
    }
  } catch {
    console.warn('⚠️ Redis unavailable, skipping cache invalidation');
  }
}
