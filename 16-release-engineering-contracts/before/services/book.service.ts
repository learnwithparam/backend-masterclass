/**
 * Book Service — Cursor-Based Pagination
 *
 * TODO: Implement cursor-based pagination for getBooksPaginated():
 *
 * 1. Accept optional cursor (number) and limit (number, default 20)
 * 2. Fetch limit + 1 rows to detect if there are more pages
 * 3. If cursor is provided, use WHERE id > cursor
 * 4. Order by id ascending
 * 5. Return { data, nextCursor, hasMore }
 *
 * Also implement updateBookCover() to set a book's coverUrl.
 */
import { db } from '../db/index.js';
import { books, Book, NewBook } from '../db/schema.js';
import { eq, gt, asc } from 'drizzle-orm';

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: number | null;
  hasMore: boolean;
}

export async function getBooksPaginated(cursor?: number, limit: number = 20): Promise<PaginatedResult<Book>> {
  // TODO: Implement cursor-based pagination
  // Hint: Fetch limit + 1 to check for more pages
  const results = await db.select().from(books).orderBy(asc(books.id));

  return {
    data: results,
    nextCursor: null,
    hasMore: false,
  };
}

export async function getBookById(id: number): Promise<Book | undefined> {
  const result = await db.select().from(books).where(eq(books.id, id));
  return result[0];
}

export async function createBook(bookInput: NewBook): Promise<Book> {
  const result = await db.insert(books).values(bookInput).returning();
  return result[0];
}

export async function deleteBook(id: number): Promise<boolean> {
  const result = await db.delete(books).where(eq(books.id, id)).returning({ deletedId: books.id });
  return result.length > 0;
}

// TODO: Implement updateBookCover(id, coverUrl)
export async function updateBookCover(id: number, coverUrl: string): Promise<Book | undefined> {
  return undefined;
}
