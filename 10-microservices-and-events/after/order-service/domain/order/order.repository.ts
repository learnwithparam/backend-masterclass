import { db } from '../../db/index.js';
import { orders } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { OrderEntity } from './order.types.js';

/**
 * Repository functions: 100% focused on pushing/pulling data from PostgreSQL.
 * No business logic lives here.
 */
export async function insertOrder(order: OrderEntity): Promise<OrderEntity> {
  const result = await db.insert(orders).values({
    userId: order.userId,
    bookId: order.bookId,
    quantity: order.quantity,
    status: order.status
  }).returning();
  
  return result[0] as OrderEntity;
}

export async function findOrderById(orderId: number): Promise<OrderEntity | null> {
  const result = await db.select().from(orders).where(eq(orders.id, orderId));
  return result.length ? (result[0] as OrderEntity) : null;
}

export async function updateOrderStatus(orderId: number, status: OrderEntity['status']): Promise<void> {
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

