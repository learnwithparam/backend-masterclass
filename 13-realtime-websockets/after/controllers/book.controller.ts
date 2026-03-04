import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as bookService from '../services/book.service.js';
import { broadcastToRoom } from '../websocket/broadcast.js';

const CreateBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  pages: z.number().int().positive(),
  published: z.string(),
});

export async function getBooksHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const books = await bookService.getAllBooks();
    res.json(books);
  } catch (error) { next(error); }
}

export async function getBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const book = await bookService.getBookById(id);
    if (!book) { res.status(404).json({ error: 'Book not found' }); return; }
    res.json(book);
  } catch (error) { next(error); }
}

export async function createBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validation = CreateBookSchema.safeParse(req.body);
    if (!validation.success) { res.status(400).json({ error: 'Invalid book data', details: validation.error.format() }); return; }
    const newBook = await bookService.createBook(validation.data as any);

    // Broadcast new book event to all subscribers
    broadcastToRoom('catalog', JSON.stringify({
      type: 'book_added',
      data: newBook,
    }));

    res.status(201).json(newBook);
  } catch (error) { next(error); }
}

export async function deleteBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await bookService.deleteBook(id);
    if (!success) { res.status(404).json({ error: 'Book not found' }); return; }

    broadcastToRoom('catalog', JSON.stringify({
      type: 'book_removed',
      data: { id },
    }));

    res.status(204).send();
  } catch (error) { next(error); }
}
