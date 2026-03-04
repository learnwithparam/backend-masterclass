import { Router } from 'express';
import * as bookController from '../controllers/book.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
// TODO: Import uploadLimiter and upload middleware

export const bookRouter = Router();

bookRouter.get('/', bookController.getBooksHandler);
bookRouter.get('/:id', bookController.getBookHandler);

bookRouter.post('/', requireAuth, requireRole('admin'), bookController.createBookHandler);
bookRouter.delete('/:id', requireAuth, requireRole('admin'), bookController.deleteBookHandler);

// TODO: Add POST /:id/cover route for file uploads
// - Requires auth + admin role
// - Apply uploadLimiter
// - Use upload.single('cover') for multipart processing
// - Call uploadCoverHandler
