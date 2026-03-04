/**
 * Event Publisher — Domain Events via Redis Pub/Sub
 *
 * KEY CONCEPT: This replaces BullMQ job queues with Redis Pub/Sub.
 * The difference is fundamental:
 *   - BullMQ: Point-to-point. One producer, one consumer. Jobs are persisted
 *     and retried. Good for "do this task exactly once."
 *   - Pub/Sub: Broadcast. One publisher, many subscribers. Messages are
 *     fire-and-forget — if no one is listening, the message is lost.
 *     Good for "something happened, react if you care."
 *
 * Why Pub/Sub for microservices? Because the Order Service shouldn't know
 * (or care) what other services exist. It just announces "an order was placed."
 * The Inventory Service, Email Service, Analytics Service — any service can
 * subscribe independently. This is loose coupling.
 */
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

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

// KEY CONCEPT: Events are named in past tense ("OrderPlaced", not "PlaceOrder")
// because they describe something that already happened, not a command.
export async function publishDomainEvent(eventName: string, payload: any): Promise<void> {
  try {
    const publisher = getEventPublisher();
    await publisher.publish(eventName, JSON.stringify(payload));
    console.log(`📢 EVENT PUBLISHED: [${eventName}]`, payload);
  } catch (err) {
    // Fire-and-forget: if Redis is down, the event is lost but the order
    // still succeeds. In production, you'd use a more durable event bus
    // (Kafka, RabbitMQ) for guaranteed delivery.
    console.warn(`⚠️ Failed to publish event [${eventName}]: ${(err as Error).message}`);
  }
}
