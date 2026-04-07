import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as bookService from '../services/book.service.js';

const CreateBookSchema = z.object({
  title: z.string().min(1), author: z.string().min(1),
  pages: z.number().int().positive(), published: z.string(),
});

export async function getBooksHandler(req: Request, res: Response, next: NextFunction) {
  try { res.json(await bookService.getAllBooks()); } catch (error) { next(error); }
}

export async function getBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bookId = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const book = await bookService.getBookById(bookId);
    if (!book) { res.status(404).json({ error: 'Book not found' }); return; }
    res.json(book);
  } catch (error) { next(error); }
}

export async function createBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const v = CreateBookSchema.safeParse(req.body);
    if (!v.success) { res.status(400).json({ error: 'Invalid book data' }); return; }
    const newBook = await bookService.createBook(v.data as any);
    res.status(201).json(newBook);
  } catch (error) { next(error); }
}

export async function deleteBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    if (!(await bookService.deleteBook(id))) { res.status(404).json({ error: 'Book not found' }); return; }
    res.status(204).send();
  } catch (error) { next(error); }
}
