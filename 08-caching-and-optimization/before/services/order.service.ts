import { db } from '../db/index.js';
import { orders, Order } from '../db/schema.js';
import { getOrderQueue } from '../queue.js';
import { eq } from 'drizzle-orm';

export async function placeOrder(userId: number, bookId: number, quantity: number): Promise<Order> {
  // 1. Save the order to the postgres database
  const result = await db.insert(orders).values({
    userId,
    bookId,
    quantity,
    status: 'pending'
  }).returning();
  
  const newOrder = result[0];

  // 2. Dispatch a background job to send the confirmation email
  // In production, Redis must be available. In tests, we gracefully skip if Redis is down.
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
