/**
 * Book Repository — Cross-Domain Data Access
 *
 * KEY CONCEPT: The Order domain needs to verify that a book exists before
 * placing an order. Rather than importing the Book service (coupling two
 * domains), we create a minimal repository function. This follows the
 * Interface Segregation Principle — we only expose what the Order domain needs.
 */
import { db } from '../../db/index.js';
import { books } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export async function checkBookExists(bookId: number): Promise<boolean> {
  const result = await db.select({ id: books.id }).from(books).where(eq(books.id, bookId));
  return result.length > 0;
}
