import { Router } from 'express';
import * as bookController from '../controllers/book.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const bookRouter = Router();

// Public routes (anyone can read the catalog)
bookRouter.get('/', bookController.getBooksHandler);
bookRouter.get('/:id', bookController.getBookHandler);

// Secured routes (only authenticated admins can modify the catalog)
bookRouter.post('/', requireAuth, requireRole('admin'), bookController.createBookHandler);
bookRouter.delete('/:id', requireAuth, requireRole('admin'), bookController.deleteBookHandler);
