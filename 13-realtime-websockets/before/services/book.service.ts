import { db } from '../db/index.js';
import { books, Book, NewBook } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function getAllBooks(): Promise<Book[]> { return await db.select().from(books); }
export async function getBookById(id: number): Promise<Book | undefined> { const r = await db.select().from(books).where(eq(books.id, id)); return r[0]; }
export async function createBook(bookInput: NewBook): Promise<Book> { const r = await db.insert(books).values(bookInput).returning(); return r[0]; }
export async function deleteBook(id: number): Promise<boolean> { const r = await db.delete(books).where(eq(books.id, id)).returning({ deletedId: books.id }); return r.length > 0; }
