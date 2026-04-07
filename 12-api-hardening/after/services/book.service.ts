/**
 * Book Service — Cursor-Based Pagination
 *
 * KEY CONCEPT: Why cursor-based instead of OFFSET/LIMIT?
 * - OFFSET skips rows one by one. For page 500 with 20 per page,
 *   the DB reads and discards 10,000 rows. O(n) cost.
 * - Cursor uses WHERE id > cursor. The DB jumps directly to that row
 *   via the index. O(1) cost regardless of page number.
 *
 * Trade-off: You lose "jump to page 50" — but infinite scroll doesn't
 * need that. For admin tables, use OFFSET pagination instead.
 */
import { getDb } from '../db/index.js';
import { books, Book, NewBook } from '../db/schema.js';
import { eq, gt, asc } from 'drizzle-orm';

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: number | null;
  hasMore: boolean;
}

export async function getBooksPaginated(cursor?: number, limit: number = 20): Promise<PaginatedResult<Book>> {
  // Fetch one extra to detect if there are more pages
  const fetchLimit = limit + 1;

  const query = getDb().select().from(books)
    .$dynamic();

  if (cursor) {
    query.where(gt(books.id, cursor));
  }

  const results = await query.orderBy(asc(books.id)).limit(fetchLimit);
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor, hasMore };
}

export async function getBookById(id: number): Promise<Book | undefined> {
  const result = await getDb().select().from(books).where(eq(books.id, id));
  return result[0];
}

export async function createBook(bookInput: NewBook): Promise<Book> {
  const result = await getDb().insert(books).values(bookInput).returning();
  return result[0];
}

export async function deleteBook(id: number): Promise<boolean> {
  const result = await getDb().delete(books).where(eq(books.id, id)).returning({ deletedId: books.id });
  return result.length > 0;
}

export async function updateBookCover(id: number, coverUrl: string): Promise<Book | undefined> {
  const result = await getDb().update(books).set({ coverUrl }).where(eq(books.id, id)).returning();
  return result[0];
}
