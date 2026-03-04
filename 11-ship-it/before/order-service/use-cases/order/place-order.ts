import { CreateOrderInputSchema, OrderEntity } from '../../domain/order/order.types.js';
import { createNewOrder } from '../../domain/order/order.entity.js';
import { insertOrder } from '../../domain/order/order.repository.js';
import { checkBookExists } from '../../domain/book/book.repository.js';
import { publishDomainEvent } from '../../events/publisher.js';

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * USE CASE: Place an Order
 * Orchestrates domain logic, validation, persistence, and external side-effects (Events).
 */
export async function placeOrderUseCase(input: unknown): Promise<OrderEntity> {
  // 1. Validate Input at the boundary
  const parsed = CreateOrderInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError(`Invalid order input: ${parsed.error.message}`);
  }
  const data = parsed.data;

  // 2. Business Rule: Book must exist
  const bookExists = await checkBookExists(data.bookId);
  if (!bookExists) {
    throw new DomainError(`Book with ID ${data.bookId} does not exist in the catalog`);
  }

  // 3. Create the Domain Entity (pure function)
  const newOrderEntity = createNewOrder(data);

  // 4. Persist the Entity
  const savedOrder = await insertOrder(newOrderEntity);

  // 5. Dispatch Side Effects (Domain Event)
  if (savedOrder.id !== undefined) {
    await publishDomainEvent('OrderPlaced', {
      orderId: savedOrder.id,
      userId: savedOrder.userId,
      bookId: savedOrder.bookId,
      quantity: savedOrder.quantity
    });
  }

  return savedOrder;
}
