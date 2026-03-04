/**
 * Book Controller — Pagination + File Upload
 *
 * KEY CONCEPT: Controllers parse input and format output. The service
 * layer does the actual work. This separation makes testing easier —
 * you can test pagination logic without HTTP concerns.
 */
import { Request, Response, NextFunction } from 'express';
import * as bookService from '../services/book.service.js';
import { PaginationQuerySchema, CreateBookSchema } from '../validation/book.schema.js';
import { getFileUrl } from '../services/upload.service.js';

export async function getBooksHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // KEY CONCEPT: Query params are always strings. Zod's coerce transforms
    // them to numbers. Without validation, ?limit=DROP TABLE would crash.
    const validation = PaginationQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.format(),
      });
      return;
    }

    const { cursor, limit } = validation.data;
    const result = await bookService.getBooksPaginated(cursor, limit);

    // KEY CONCEPT: The response includes a nextCursor field. The client
    // uses it in the next request: GET /books?cursor=42&limit=20.
    // This is how infinite scroll works — no page numbers needed.
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

export async function uploadCoverHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const book = await bookService.getBookById(id);

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const coverUrl = getFileUrl(req.file.filename);
    const updated = await bookService.updateBookCover(id, coverUrl);
    res.status(201).json(updated);
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
