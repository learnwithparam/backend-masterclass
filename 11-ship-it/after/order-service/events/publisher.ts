import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared event publisher connection
let _publisher: Redis | null = null;

export function getEventPublisher(): Redis {
  if (!_publisher) {
    _publisher = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      }
    });
  }
  return _publisher;
}

export async function publishDomainEvent(eventName: string, payload: any): Promise<void> {
  try {
    const publisher = getEventPublisher();
    await publisher.publish(eventName, JSON.stringify(payload));
    console.log(`📢 EVENT PUBLISHED: [${eventName}]`, payload);
  } catch (err) {
    console.warn(`⚠️ Failed to publish event [${eventName}]: ${(err as Error).message}`);
  }
}
