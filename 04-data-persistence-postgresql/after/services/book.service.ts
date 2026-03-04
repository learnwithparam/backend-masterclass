/**
 * Service Layer — Database-Backed Business Logic
 *
 * This is the same service interface from Module 03, but now backed by
 * PostgreSQL instead of an in-memory array. Notice the controllers didn't
 * change at all — that's the power of clean architecture.
 */
import { db } from '../db/index.js';
import { books, Book, NewBook } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function getAllBooks(): Promise<Book[]> {
  // KEY CONCEPT: Drizzle's query builder. This generates:
  // SELECT * FROM books
  return await db.select().from(books);
}

export async function getBookById(id: number): Promise<Book | undefined> {
  // .where(eq(...)) generates: WHERE books.id = $1
  // Drizzle uses parameterized queries, which prevents SQL injection
  const result = await db.select().from(books).where(eq(books.id, id));
  return result[0]; // undefined if not found
}

export async function createBook(bookInput: NewBook): Promise<Book> {
  // .returning() tells PostgreSQL to return the inserted row (including
  // the auto-generated id and createdAt). Without it, you'd get nothing back.
  const result = await db.insert(books).values(bookInput).returning();
  return result[0];
}

export async function deleteBook(id: number): Promise<boolean> {
  // Return the deleted ID to check if anything was actually deleted
  const result = await db.delete(books).where(eq(books.id, id)).returning({ deletedId: books.id });
  return result.length > 0;
}
