import { Router } from 'express';
import * as bookController from '../controllers/book.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const bookRouter = Router();

bookRouter.get('/', bookController.getBooksHandler);
bookRouter.get('/:id', bookController.getBookHandler);
bookRouter.post('/', requireAuth, requireRole('admin'), bookController.createBookHandler);
bookRouter.delete('/:id', requireAuth, requireRole('admin'), bookController.deleteBookHandler);
