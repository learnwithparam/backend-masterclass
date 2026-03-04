/**
 * Order Repository — Data Access Layer
 *
 * KEY CONCEPT: The Repository Pattern separates "how data is stored" from
 * "what the business rules are." These functions know about PostgreSQL and
 * Drizzle ORM, but they know NOTHING about business rules like "you can't
 * order more than 100 items" — that belongs in the domain layer.
 *
 * Why not put DB queries in the use case? Because if you switch databases
 * (PostgreSQL → MongoDB), or add caching, you only change the repository.
 * The use case and domain logic remain untouched.
 */
import { db } from '../../db/index.js';
import { orders } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { OrderEntity } from './order.types.js';

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

