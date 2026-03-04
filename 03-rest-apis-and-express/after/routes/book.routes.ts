/**
 * Route Layer — URL-to-Handler Mapping
 *
 * Routes are the "table of contents" for your API. Each line maps
 * an HTTP method + path to a controller function. Using Express Router
 * lets us group related routes and mount them at a prefix (e.g. /api/books).
 */
import { Router } from 'express';
import * as bookController from '../controllers/book.controller.js';

export const bookRouter = Router();

// RESTful convention: the resource name is a noun, the HTTP method is the verb
// GET    /api/books      → list all books
// GET    /api/books/:id  → get one book
// POST   /api/books      → create a new book
// DELETE /api/books/:id  → delete a book
bookRouter.get('/', bookController.getBooksHandler);
bookRouter.get('/:id', bookController.getBookHandler);
bookRouter.post('/', bookController.createBookHandler);
bookRouter.delete('/:id', bookController.deleteBookHandler);
