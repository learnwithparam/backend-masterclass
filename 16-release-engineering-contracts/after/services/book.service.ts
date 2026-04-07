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

const useInMemoryStore = process.env.USE_IN_MEMORY_DB === '1';

const seededBooks: Book[] = [
  {
    id: 1,
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    pages: 616,
    published: '2017',
    coverUrl: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  {
    id: 2,
    title: 'Release It!',
    author: 'Michael T. Nygard',
    pages: 384,
    published: '2018',
    coverUrl: null,
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
  },
  {
    id: 3,
    title: 'The Phoenix Project',
    author: 'Gene Kim',
    pages: 432,
    published: '2019',
    coverUrl: null,
    createdAt: new Date('2024-01-03T00:00:00.000Z'),
  },
];

const memoryBooks: Book[] = [...seededBooks];

function nextBookId(): number {
  return memoryBooks.length === 0 ? 1 : Math.max(...memoryBooks.map((book) => book.id)) + 1;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: number | null;
  hasMore: boolean;
}

export async function getBooksPaginated(cursor?: number, limit: number = 20): Promise<PaginatedResult<Book>> {
  if (useInMemoryStore) {
    const sorted = [...memoryBooks].sort((a, b) => a.id - b.id);
    const startIndex = cursor ? sorted.findIndex((book) => book.id > cursor) : 0;
    const start = startIndex < 0 ? sorted.length : startIndex;
    const data = sorted.slice(start, start + limit);
    const hasMore = start + limit < sorted.length;

    return {
      data,
      nextCursor: hasMore && data.length > 0 ? data[data.length - 1].id : null,
      hasMore,
    };
  }

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
  if (useInMemoryStore) {
    return memoryBooks.find((book) => book.id === id);
  }

  const result = await getDb().select().from(books).where(eq(books.id, id));
  return result[0];
}

export async function createBook(bookInput: NewBook): Promise<Book> {
  if (useInMemoryStore) {
    const createdBook = {
      id: nextBookId(),
      ...bookInput,
      createdAt: new Date('2024-01-04T00:00:00.000Z'),
    } as Book;

    memoryBooks.push(createdBook);
    return createdBook;
  }

  const result = await getDb().insert(books).values(bookInput).returning();
  return result[0];
}

export async function deleteBook(id: number): Promise<boolean> {
  if (useInMemoryStore) {
    const index = memoryBooks.findIndex((book) => book.id === id);
    if (index < 0) {
      return false;
    }

    memoryBooks.splice(index, 1);
    return true;
  }

  const result = await getDb().delete(books).where(eq(books.id, id)).returning({ deletedId: books.id });
  return result.length > 0;
}

export async function updateBookCover(id: number, coverUrl: string): Promise<Book | undefined> {
  if (useInMemoryStore) {
    const book = memoryBooks.find((entry) => entry.id === id);
    if (!book) {
      return undefined;
    }

    book.coverUrl = coverUrl;
    return book;
  }

  const result = await getDb().update(books).set({ coverUrl }).where(eq(books.id, id)).returning();
  return result[0];
}
