/**
 * Use Case: Place an Order
 *
 * KEY CONCEPT: Use cases are the "orchestrators" of your application. They
 * coordinate between layers but contain no business logic or data access
 * themselves. A use case follows a predictable recipe:
 *
 *   1. Validate input (boundary)
 *   2. Check business rules (domain)
 *   3. Create/transform entities (pure functions)
 *   4. Persist changes (repository)
 *   5. Trigger side effects (events/queues)
 *
 * Why not put this in the controller? Controllers deal with HTTP (req/res).
 * Use cases deal with business workflows. If you add a CLI or GraphQL layer
 * later, you reuse the same use case — no duplication.
 */
import { CreateOrderInputSchema, OrderEntity } from '../../domain/order/order.types.js';
import { createNewOrder } from '../../domain/order/order.entity.js';
import { insertOrder } from '../../domain/order/order.repository.js';
import { checkBookExists } from '../../domain/book/book.repository.js';
import { getOrderQueue } from '../../queue.js';

// Custom error type so controllers can distinguish domain errors (400)
// from unexpected errors (500) without inspecting error messages.
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export async function placeOrderUseCase(input: unknown): Promise<OrderEntity> {
  // 1. Validate input — Zod schema acts as the "anti-corruption layer"
  //    that prevents invalid data from reaching the domain.
  const parsed = CreateOrderInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError(`Invalid order input: ${parsed.error.message}`);
  }
  const data = parsed.data;

  // 2. Business rule: the book must exist in the catalog
  const bookExists = await checkBookExists(data.bookId);
  if (!bookExists) {
    throw new DomainError(`Book with ID ${data.bookId} does not exist in the catalog`);
  }

  // 3. Create the domain entity — pure function, no side effects
  const newOrderEntity = createNewOrder(data);

  // 4. Persist via repository — the only place that touches the database
  const savedOrder = await insertOrder(newOrderEntity);

  // 5. Side effects — fire-and-forget background job for email/invoice.
  //    Wrapped in try/catch so a Redis failure doesn't fail the order.
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
