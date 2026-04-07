import { Request, Response, NextFunction } from 'express';
import { placeOrderUseCase, DomainError } from '../use-cases/order/place-order.js';
import { getOrderUseCase } from '../use-cases/order/get-order.js';

export async function createOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Pass control to the specific Domain Use Case.
    // Notice how the controller no longer handles complex Zod validation logic.
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
    if (error instanceof DomainError) {
      res.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
}

export async function getOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
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
