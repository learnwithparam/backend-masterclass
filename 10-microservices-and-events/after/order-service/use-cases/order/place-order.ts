/**
 * Use Case: Place an Order (Microservices Version)
 *
 * KEY CONCEPT: Compare this to the Module 09 version. The only change is
 * step 5: instead of dispatching a BullMQ background job, we publish a
 * Domain Event via Redis Pub/Sub. The event is "fire-and-forget" — the
 * Order Service doesn't know or care who subscribes.
 *
 * This is the key refactoring from monolith to microservices:
 *   Module 09: queue.add('sendConfirmationEmail', ...) — point-to-point
 *   Module 10: publishDomainEvent('OrderPlaced', ...) — broadcast
 */
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

export async function placeOrderUseCase(input: unknown): Promise<OrderEntity> {
  // 1. Validate input at the boundary
  const parsed = CreateOrderInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError(`Invalid order input: ${parsed.error.message}`);
  }
  const data = parsed.data;

  // 2. Business rule: book must exist
  const bookExists = await checkBookExists(data.bookId);
  if (!bookExists) {
    throw new DomainError(`Book with ID ${data.bookId} does not exist in the catalog`);
  }

  // 3. Create domain entity (pure function)
  const newOrderEntity = createNewOrder(data);

  // 4. Persist via repository
  const savedOrder = await insertOrder(newOrderEntity);

  // 5. Publish domain event — any service can subscribe
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
