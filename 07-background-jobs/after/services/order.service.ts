/**
 * Order Service — Database + Queue Integration
 *
 * This service demonstrates the "command" side of the order flow:
 * save to database first (durable), then dispatch a background job
 * for async processing (email, PDF, etc.).
 */
import { db } from '../db/index.js';
import { orders, Order } from '../db/schema.js';
import { getOrderQueue } from '../queue.js';
import { eq } from 'drizzle-orm';

export async function placeOrder(userId: number, bookId: number, quantity: number): Promise<Order> {
  // Step 1: Save the order to PostgreSQL with status 'pending'
  // This is the source of truth — even if the background job fails,
  // the order exists and can be retried.
  const result = await db.insert(orders).values({
    userId,
    bookId,
    quantity,
    status: 'pending'
  }).returning();

  const newOrder = result[0];

  // Step 2: Dispatch a background job to the Redis queue
  // KEY CONCEPT: Wrapping in try/catch is critical for resilience.
  // If Redis is down, the API still responds — the order is saved.
  // A separate reconciliation process could pick up "stuck pending" orders later.
  try {
    await getOrderQueue().add('sendConfirmationEmail', {
      orderId: newOrder.id,
      userId: newOrder.userId,
      bookId: newOrder.bookId,
      quantity: newOrder.quantity
    });
  } catch (err) {
    console.warn(`⚠️ Could not dispatch background job (Redis may be down): ${(err as Error).message}`);
  }

  return newOrder;
}

export async function getOrder(orderId: number) {
  const result = await db.select().from(orders).where(eq(orders.id, orderId));
  return result[0];
}
