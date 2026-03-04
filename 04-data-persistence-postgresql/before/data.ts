export interface Book {
  id: number;
  title: string;
  author: string;
  pages: number;
  published: string;
}

// Simulated simple in-memory database
export const booksDb: Book[] = [
  { id: 1, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', pages: 320, published: '1999' },
  { id: 2, title: 'Clean Code', author: 'Robert C. Martin', pages: 464, published: '2008' }
];
