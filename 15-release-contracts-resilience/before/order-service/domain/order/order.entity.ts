import { CreateOrderInput, OrderEntity } from './order.types.js';

/**
 * Pure function to create a new Order Entity.
 * Encapsulates core business rules (e.g. initial state) without relying on external dependencies.
 */
export function createNewOrder(input: CreateOrderInput): OrderEntity {
  return {
    userId: input.userId,
    bookId: input.bookId,
    quantity: input.quantity,
    status: 'pending' // Enforce domain rule: new orders are always pending
  };
}

/**
 * Pure function to mark an order as completed.
 */
export function markOrderCompleted(order: OrderEntity): OrderEntity {
  if (order.status !== 'pending') {
    throw new Error(`Domain Rule Violation: Cannot complete an order in status '${order.status}'`);
  }
  return { ...order, status: 'completed' };
}
