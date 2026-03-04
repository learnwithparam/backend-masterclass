/**
 * Data Layer — In-Memory Book Database
 *
 * In a real application, this would be replaced by a database (Module 04).
 * For now, a simple array lets us focus on the API layer without the
 * complexity of database setup.
 *
 * Why not just put this array inside the service? Separating data from
 * logic means we can swap this for a real database later without changing
 * any service code.
 */

export interface Book {
  id: number;
  title: string;
  author: string;
  pages: number;
  published: string;
}

export const booksDb: Book[] = [
  { id: 1, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', pages: 320, published: '1999' },
  { id: 2, title: 'Clean Code', author: 'Robert C. Martin', pages: 464, published: '2008' }
];
