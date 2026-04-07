/**
 * Book Routes — Versioned API with File Upload
 *
 * KEY CONCEPT: API versioning via URL path (/api/v1/books).
 * When you need breaking changes, create /api/v2/books while
 * keeping v1 alive. Clients migrate at their own pace.
 */
import { Router } from 'express';
import * as bookController from '../controllers/book.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { uploadLimiter } from '../middlewares/rate-limiter.js';
import { upload } from '../services/upload.service.js';

export const bookRouter = Router();

// Public routes — anyone can browse the catalog
bookRouter.get('/', bookController.getBooksHandler);
bookRouter.get('/:id', bookController.getBookHandler);

// Admin routes — only admins can modify catalog
bookRouter.post('/', requireAuth, requireRole('admin'), bookController.createBookHandler);
bookRouter.delete('/:id', requireAuth, requireRole('admin'), bookController.deleteBookHandler);

// File upload route — admin uploads a cover image for a book
// upload.single('cover') processes a single file from the 'cover' field
bookRouter.post(
  '/:id/cover',
  requireAuth,
  requireRole('admin'),
  uploadLimiter,
  upload.single('cover'),
  bookController.uploadCoverHandler
);
