/**
 * Order Service — The "Before DDD" Version
 *
 * REFACTORING EXERCISE: This monolithic service mixes THREE concerns:
 *   1. Business logic (what status should a new order have?)
 *   2. Data access (Drizzle ORM queries)
 *   3. Side effects (BullMQ job dispatch)
 *
 * YOUR TASK: Refactor this into the DDD layered architecture:
 *
 *   domain/order/order.types.ts    — Value Objects (Zod schemas) + Entity type
 *   domain/order/order.entity.ts   — Pure functions for creating/transitioning orders
 *   domain/order/order.repository.ts — Database queries ONLY (insertOrder, findOrderById)
 *   domain/book/book.repository.ts — checkBookExists() for cross-domain validation
 *   use-cases/order/place-order.ts — Orchestrate: validate → check book → create entity → persist → dispatch
 *   use-cases/order/get-order.ts   — Simple retrieval via repository
 *   controllers/order.controller.ts — Thin: extract HTTP data, call use case, map response
 *
 * HINTS:
 *   - The `status: 'pending'` assignment belongs in a pure function (createNewOrder)
 *   - Input validation (userId, bookId, quantity) belongs in a Zod schema (CreateOrderInputSchema)
 *   - The try/catch around queue.add() stays in the use case as a side effect
 *   - The controller should NOT import Zod — the use case handles validation
 */
import { db } from '../db/index.js';
import { orders, Order } from '../db/schema.js';
import { getOrderQueue } from '../queue.js';
import { eq } from 'drizzle-orm';

export async function placeOrder(userId: number, bookId: number, quantity: number): Promise<Order> {
  const result = await db.insert(orders).values({
    userId,
    bookId,
    quantity,
    status: 'pending'
  }).returning();

  const newOrder = result[0];

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
