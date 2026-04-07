import { getDb } from '../db/index.js';
import { books, Book, NewBook } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function getAllBooks(): Promise<Book[]> { return await getDb().select().from(books); }
export async function getBookById(id: number): Promise<Book | undefined> { const r = await getDb().select().from(books).where(eq(books.id, id)); return r[0]; }
export async function createBook(bookInput: NewBook): Promise<Book> { const r = await getDb().insert(books).values(bookInput).returning(); return r[0]; }
export async function deleteBook(id: number): Promise<boolean> { const r = await getDb().delete(books).where(eq(books.id, id)).returning({ deletedId: books.id }); return r.length > 0; }
