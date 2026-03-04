/**
 * Order Controller — Thin Presentation Layer
 *
 * KEY CONCEPT: In DDD, controllers are "thin." They do exactly three things:
 *   1. Extract data from the HTTP request (params, body, user)
 *   2. Call the appropriate use case
 *   3. Map the result (or error) to an HTTP response
 *
 * No validation, no business logic, no database queries. Compare this to
 * the Module 08 controller that had inline Zod schemas and direct service
 * calls — the DDD version delegates everything to the use case layer.
 */
import { Request, Response, NextFunction } from 'express';
import { placeOrderUseCase, DomainError } from '../use-cases/order/place-order.js';
import { getOrderUseCase } from '../use-cases/order/get-order.js';

export async function createOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // The controller just passes raw data — the use case validates it
    const newOrder = await placeOrderUseCase({
      userId: req.user.userId,
      bookId: req.body.bookId,
      quantity: req.body.quantity
    });

    res.status(202).json({
      message: 'Order received. Confirmation email will be sent shortly.',
      order: newOrder
    });
  } catch (error) {
    // KEY CONCEPT: DomainError = client mistake (400). Other errors = server bug (500).
    if (error instanceof DomainError) {
      res.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
}

export async function getOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const order = await getOrderUseCase(orderId);
    
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (req.user?.role !== 'admin' && req.user?.userId !== order.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(order);
  } catch (error) { next(error); }
}
