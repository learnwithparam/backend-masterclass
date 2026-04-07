import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { requireAuth } from '../middlewares/auth.js';

export const orderRouter = Router();

// Only authenticated users can place and view orders
orderRouter.post('/', requireAuth, orderController.createOrderHandler);
orderRouter.get('/:id', requireAuth, orderController.getOrderHandler);
