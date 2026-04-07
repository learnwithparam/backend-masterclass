/**
 * Book Controller — Pagination + File Upload
 *
 * TODO: Update getBooksHandler to use PaginationQuerySchema
 * TODO: Implement uploadCoverHandler for multipart file uploads
 */
import { Request, Response, NextFunction } from 'express';
import * as bookService from '../services/book.service.js';
import { PaginationQuerySchema, CreateBookSchema } from '../validation/book.schema.js';
import { getFileUrl } from '../services/upload.service.js';

export async function getBooksHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // TODO: Validate query params with PaginationQuerySchema
    // TODO: Call getBooksPaginated with cursor and limit
    const result = await bookService.getBooksPaginated();
    res.json(result);
  } catch (error) { next(error); }
}

export async function getBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const book = await bookService.getBookById(id);

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    res.json(book);
  } catch (error) { next(error); }
}

export async function createBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validation = CreateBookSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid book data',
        details: validation.error.format(),
      });
      return;
    }

    const newBook = await bookService.createBook(validation.data as any);
    res.status(201).json(newBook);
  } catch (error) { next(error); }
}

// TODO: Implement uploadCoverHandler
export async function uploadCoverHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Parse book ID from params
    // 2. Check book exists (404 if not)
    // 3. Check req.file exists (400 if not)
    // 4. Get the file URL using getFileUrl()
    // 5. Update the book's cover URL
    // 6. Return 201 with updated book
    res.status(501).json({ error: 'Not implemented' });
  } catch (error) { next(error); }
}

export async function deleteBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await bookService.deleteBook(id);

    if (!success) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    res.status(204).send();
  } catch (error) { next(error); }
}
