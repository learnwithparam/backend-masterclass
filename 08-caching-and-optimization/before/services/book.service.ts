import { db } from '../db/index.js';
import { books, Book, NewBook } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDelete } from './cache.service.js';

// Cache key conventions:
// 'books:all'  → cached list of all books
// 'books:42'   → cached single book with id=42
// 'books:*'    → glob pattern to invalidate all book caches
const CACHE_KEY_ALL_BOOKS = 'books:all';
const cacheKeyBook = (id: number) => `books:${id}`;

// TODO: Implement the Cache-Aside pattern for getAllBooks
// 1. Check the cache first: cacheGet<Book[]>(CACHE_KEY_ALL_BOOKS)
// 2. If cache hit, return the cached data (skip the database entirely)
// 3. If cache miss, query the database
// 4. Store the result in cache: cacheSet(CACHE_KEY_ALL_BOOKS, result, 60)
// 5. Return the result
export async function getAllBooks(): Promise<Book[]> {
  // Your code here — add caching around this DB query
  const result = await db.select().from(books);
  return result;
}

// TODO: Implement Cache-Aside for getBookById (same pattern)
export async function getBookById(id: number): Promise<Book | undefined> {
  // Your code here — add caching around this DB query
  const result = await db.select().from(books).where(eq(books.id, id));
  return result[0];
}

// TODO: After creating a book, invalidate the cache
// Use cacheDelete('books:*') to clear all book-related cache keys
export async function createBook(bookInput: NewBook): Promise<Book> {
  const result = await db.insert(books).values(bookInput).returning();
  // TODO: Invalidate cache here
  return result[0];
}

// TODO: After deleting a book, invalidate the cache
export async function deleteBook(id: number): Promise<boolean> {
  const result = await db.delete(books).where(eq(books.id, id)).returning({ deletedId: books.id });
  // TODO: Invalidate cache here
  return result.length > 0;
}
