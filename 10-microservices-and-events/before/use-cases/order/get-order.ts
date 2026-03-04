import { OrderEntity } from '../../domain/order/order.types.js';
import { findOrderById } from '../../domain/order/order.repository.js';

/**
 * USE CASE: Get an Order
 */
export async function getOrderUseCase(orderId: number): Promise<OrderEntity | null> {
  return await findOrderById(orderId);
}
