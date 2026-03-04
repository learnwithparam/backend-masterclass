/**
 * Use Case: Get an Order
 *
 * Simple retrieval use case. Even though it's just a pass-through to the
 * repository, having it as a use case keeps the architecture consistent.
 * If you later need to add authorization checks, audit logging, or data
 * enrichment, this is where it goes — not in the controller or repository.
 */
import { OrderEntity } from '../../domain/order/order.types.js';
import { findOrderById } from '../../domain/order/order.repository.js';

export async function getOrderUseCase(orderId: number): Promise<OrderEntity | null> {
  return await findOrderById(orderId);
}
