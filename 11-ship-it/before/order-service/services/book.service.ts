import { db } from '../db/index.js';
import { books, Book, NewBook } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDelete } from './cache.service.js';

const CACHE_KEY_ALL_BOOKS = 'books:all';
const cacheKeyBook = (id: number) => `books:${id}`;

export async function getAllBooks(): Promise<Book[]> {
  // 1. Check the cache first
  const cached = await cacheGet<Book[]>(CACHE_KEY_ALL_BOOKS);
  if (cached) return cached;

  // 2. Cache miss — query the database
  const result = await db.select().from(books);

  // 3. Store in cache for next time (TTL = 60s)
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
  // Invalidate the "all books" cache since data changed
  await cacheDelete('books:*');
  return result[0];
}

export async function deleteBook(id: number): Promise<boolean> {
  const result = await db.delete(books).where(eq(books.id, id)).returning({ deletedId: books.id });
  // Invalidate both the individual book cache and the list cache
  await cacheDelete('books:*');
  return result.length > 0;
}
