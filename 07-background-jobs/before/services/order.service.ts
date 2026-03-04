import { db } from '../db/index.js';
import { orders, Order } from '../db/schema.js';
import { getOrderQueue } from '../queue.js';
import { eq } from 'drizzle-orm';

export async function placeOrder(userId: number, bookId: number, quantity: number): Promise<Order> {
  // TODO 1: Insert the order into PostgreSQL with status 'pending'
  // Hint: db.insert(orders).values({ userId, bookId, quantity, status: 'pending' }).returning()

  // TODO 2: Dispatch a background job to the Redis queue
  // The job should contain: orderId, userId, bookId, quantity
  // Hint: getOrderQueue().add('sendConfirmationEmail', { ... })
  //
  // IMPORTANT: Wrap the queue dispatch in try/catch so the API still works
  // even if Redis is unavailable. The order is already saved to the DB —
  // the background job can be retried later.

  // TODO 3: Return the new order
  throw new Error('Not implemented');
}

export async function getOrder(orderId: number) {
  const result = await db.select().from(orders).where(eq(orders.id, orderId));
  return result[0];
}
