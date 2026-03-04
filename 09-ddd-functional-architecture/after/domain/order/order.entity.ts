/**
 * Order Entity — Pure Functions for State Transitions
 *
 * KEY CONCEPT: In functional DDD, entities are NOT classes with methods.
 * They're plain data (types) + pure functions that transform them.
 * Pure functions have no side effects — no DB calls, no network requests,
 * no console.log. This makes them trivially testable: just call the function
 * and assert on the return value. No mocks needed.
 *
 * Why not classes? Classes mix data and behavior, making them harder to
 * serialize, test, and compose. Pure functions are simpler and more flexible.
 */
import { CreateOrderInput, OrderEntity } from './order.types.js';

/**
 * Factory function: Creates a new Order entity from validated input.
 * KEY CONCEPT: The domain decides the initial state, not the caller.
 * New orders are ALWAYS 'pending' — this is a business invariant.
 */
export function createNewOrder(input: CreateOrderInput): OrderEntity {
  return {
    userId: input.userId,
    bookId: input.bookId,
    quantity: input.quantity,
    status: 'pending'
  };
}

/**
 * State transition: pending → completed.
 * KEY CONCEPT: This function enforces valid state transitions.
 * You can't complete a cancelled order or re-complete an already completed one.
 * The spread operator creates a NEW object — the original is never mutated.
 */
export function markOrderCompleted(order: OrderEntity): OrderEntity {
  if (order.status !== 'pending') {
    throw new Error(`Domain Rule Violation: Cannot complete an order in status '${order.status}'`);
  }
  return { ...order, status: 'completed' };
}
