import { db } from '../../db/index.js';
import { books } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Minimal Book Repository for Order Use Cases
 */
export async function checkBookExists(bookId: number): Promise<boolean> {
  const result = await db.select({ id: books.id }).from(books).where(eq(books.id, bookId));
  return result.length > 0;
}
