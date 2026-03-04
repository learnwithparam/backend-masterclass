import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as orderService from '../services/order.service.js';

const CreateOrderSchema = z.object({
  bookId: z.number().positive(),
  quantity: z.number().positive().default(1),
});

export async function createOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validation = CreateOrderSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid input', details: validation.error.format() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Place the order (which saves to DB and publishes the async job)
    const newOrder = await orderService.placeOrder(req.user.userId, validation.data.bookId, validation.data.quantity);
    
    // Immediately return 202 Accepted. The heavy lifting happens elsewhere.
    res.status(202).json({
      message: 'Order received. Confirmation email will be sent shortly.',
      order: newOrder
    });
  } catch (error) { next(error); }
}

export async function getOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const order = await orderService.getOrder(orderId);
    
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Basic authorization: Only the owner or an admin can view the order
    if (req.user?.role !== 'admin' && req.user?.userId !== order.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(order);
  } catch (error) { next(error); }
}
