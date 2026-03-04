/**
 * Book Service — Cache-Aside Pattern Implementation
 *
 * This service demonstrates the Cache-Aside (Lazy Loading) pattern:
 * 1. Check cache first → instant response on HIT
 * 2. On MISS, query database → store result in cache → return
 * 3. On WRITE, invalidate cache → prevents stale data
 *
 * KEY CONCEPT: The "aside" in Cache-Aside means the application manages
 * the cache explicitly. The database doesn't know about the cache.
 * Alternative: Write-Through (cache updated on every write) or
 * Read-Through (cache auto-fetches from DB on miss).
 */
import { db } from '../db/index.js';
import { books, Book, NewBook } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDelete } from './cache.service.js';

// Cache key design: use a consistent prefix so you can invalidate related keys
// with a glob pattern. 'books:*' matches 'books:all', 'books:1', 'books:42', etc.
const CACHE_KEY_ALL_BOOKS = 'books:all';
const cacheKeyBook = (id: number) => `books:${id}`;

export async function getAllBooks(): Promise<Book[]> {
  // Step 1: Try cache first (fast — in-memory lookup, ~1ms)
  const cached = await cacheGet<Book[]>(CACHE_KEY_ALL_BOOKS);
  if (cached) return cached;

  // Step 2: Cache miss — fall through to database (slower — disk + network, ~5-50ms)
  const result = await db.select().from(books);

  // Step 3: Populate cache for next time (TTL = 60 seconds)
  await cacheSet(CACHE_KEY_ALL_BOOKS, result, 60);
  return result;
}

export async function getBookById(id: number): Promise<Book | undefined> {
  const cached = await cacheGet<Book>(cacheKeyBook(id));
  if (cached) return cached;

  const result = await db.select().from(books).where(eq(books.id, id));
  const book = result[0];
  if (book) await cacheSet(cacheKeyBook(id), book, 60);
  return book;
}

export async function createBook(bookInput: NewBook): Promise<Book> {
  const result = await db.insert(books).values(bookInput).returning();
  // KEY CONCEPT: Cache invalidation. After a write, cached data is stale.
  // We delete all book-related cache keys so the next read fetches fresh data.
  // The glob pattern 'books:*' matches all keys starting with 'books:'.
  await cacheDelete('books:*');
  return result[0];
}

export async function deleteBook(id: number): Promise<boolean> {
  const result = await db.delete(books).where(eq(books.id, id)).returning({ deletedId: books.id });
  await cacheDelete('books:*');
  return result.length > 0;
}
