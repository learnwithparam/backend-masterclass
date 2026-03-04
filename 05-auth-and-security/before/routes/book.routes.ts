import { Router } from 'express';
import * as bookController from '../controllers/book.controller.js';

export const bookRouter = Router();

bookRouter.get('/', bookController.getBooksHandler);
bookRouter.get('/:id', bookController.getBookHandler);
bookRouter.post('/', bookController.createBookHandler);
bookRouter.delete('/:id', bookController.deleteBookHandler);
