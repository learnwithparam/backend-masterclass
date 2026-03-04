/**
 * Service Layer — Business Logic
 *
 * Services contain your actual business rules and data operations.
 * They know nothing about HTTP — no req, no res, no status codes.
 * This separation means you can reuse these functions from CLI tools,
 * background jobs, or different API versions.
 */
import { booksDb, Book } from '../data.js';

export function getAllBooks(): Book[] {
  return booksDb;
}

export function getBookById(id: number): Book | undefined {
  return booksDb.find(book => book.id === id);
}

export function createBook(bookInput: Omit<Book, 'id'>): Book {
  // Generate the next ID by finding the current max. In a real database,
  // auto-increment or UUIDs would handle this for you.
  const newId = booksDb.length > 0 ? Math.max(...booksDb.map(b => b.id)) + 1 : 1;
  const newBook = { id: newId, ...bookInput };
  booksDb.push(newBook);
  return newBook;
}

export function deleteBook(id: number): boolean {
  const index = booksDb.findIndex(book => book.id === id);
  if (index !== -1) {
    booksDb.splice(index, 1);
    return true;
  }
  return false;
}
