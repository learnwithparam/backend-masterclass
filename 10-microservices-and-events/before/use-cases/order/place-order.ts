/**
 * Use Case: Place an Order — BEFORE Microservices Refactoring
 *
 * REFACTORING EXERCISE: This use case currently dispatches a BullMQ
 * background job (point-to-point). Your task is to refactor step 5 to
 * publish a Domain Event via Redis Pub/Sub instead.
 *
 * YOUR TASK:
 *   1. Create events/publisher.ts with:
 *      - getEventPublisher() — lazy Redis connection
 *      - publishDomainEvent(eventName, payload) — fire-and-forget publish
 *   2. Replace the BullMQ import + queue.add() below with:
 *      - import { publishDomainEvent } from '../../events/publisher.js'
 *      - await publishDomainEvent('OrderPlaced', { orderId, userId, bookId, quantity })
 *   3. Create the Inventory Service (separate service!) that subscribes to 'OrderPlaced'
 *   4. Delete queue.ts and worker.ts — they're no longer needed
 *
 * KEY DIFFERENCE:
 *   - BullMQ: "Do this task" (command, point-to-point)
 *   - Pub/Sub: "This happened" (event, broadcast to all subscribers)
 */
import { CreateOrderInputSchema, OrderEntity } from '../../domain/order/order.types.js';
import { createNewOrder } from '../../domain/order/order.entity.js';
import { insertOrder } from '../../domain/order/order.repository.js';
import { checkBookExists } from '../../domain/book/book.repository.js';
import { getOrderQueue } from '../../queue.js';

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

  // 5. TODO: Replace this BullMQ dispatch with publishDomainEvent('OrderPlaced', ...)
  if (savedOrder.id !== undefined) {
    try {
      await getOrderQueue().add('sendConfirmationEmail', {
        orderId: savedOrder.id,
        userId: savedOrder.userId,
        bookId: savedOrder.bookId,
        quantity: savedOrder.quantity
      });
    } catch (err) {
      console.warn(`⚠️ Could not dispatch background job: ${(err as Error).message}`);
    }
  }

  return savedOrder;
}
