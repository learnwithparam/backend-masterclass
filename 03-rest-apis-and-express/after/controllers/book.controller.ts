/**
 * Controller Layer — HTTP Request/Response Handling
 *
 * Controllers are the "translator" between HTTP and your business logic.
 * They parse request data, call the service, and format the response.
 * Controllers should NOT contain business logic — that belongs in services.
 */
import { Request, Response } from 'express';
import { z } from 'zod';
import * as bookService from '../services/book.service.js';

// KEY CONCEPT: Validate at the boundary. The controller is where external
// data enters your system, so this is where you validate it.
const CreateBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  pages: z.number().int().positive('Pages must be positive'),
  published: z.string()
});

export function getBooksHandler(req: Request, res: Response) {
  const books = bookService.getAllBooks();
  res.json(books);
}

export function getBookHandler(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const book = bookService.getBookById(id);

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  res.json(book);
}

export function createBookHandler(req: Request, res: Response) {
  const validation = CreateBookSchema.safeParse(req.body);

  if (!validation.success) {
    // Return 400 (Bad Request) with details so the client knows what to fix
    res.status(400).json({
      error: 'Invalid book data',
      details: validation.error.format()
    });
    return;
  }

  const newBook = bookService.createBook(validation.data);
  // 201 Created — the standard response when a new resource is created
  res.status(201).json(newBook);
}

export function deleteBookHandler(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const success = bookService.deleteBook(id);

  if (!success) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  // 204 No Content — successful deletion, nothing to return in the body
  res.status(204).send();
}
