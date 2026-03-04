import { Book } from '../data.js';
// TODO: Import `db` from your database configuration
// TODO: Import the `books` schema

// Currently using the old array approach.
import { booksDb } from '../data.js';

export async function getAllBooks(): Promise<Book[]> {
  // TODO: Replace this with `return await db.select().from(books);`
  return booksDb;
}

export async function getBookById(id: number): Promise<Book | undefined> {
  // TODO: Use `db.select().where(...)`
  return booksDb.find(book => book.id === id);
}

export async function createBook(bookInput: Omit<Book, 'id'>): Promise<Book> {
  // TODO: Use `db.insert(books).values(bookInput).returning()`
  const newId = booksDb.length > 0 ? Math.max(...booksDb.map(b => b.id)) + 1 : 1;
  const newBook = { id: newId, ...bookInput };
  booksDb.push(newBook);
  return newBook;
}

export async function deleteBook(id: number): Promise<boolean> {
  // TODO: Use `db.delete(books).where(...)`
  const index = booksDb.findIndex(book => book.id === id);
  if (index !== -1) {
    booksDb.splice(index, 1);
    return true;
  }
  return false;
}
