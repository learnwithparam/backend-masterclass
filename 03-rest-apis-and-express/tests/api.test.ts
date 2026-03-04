import { app, startServer, stopServer } from '../after/index.js'; // Note: In a real scenario, this would import from the student's code
import supertest from 'supertest';
import { booksDb } from '../after/data.js';

describe('Module 03: REST APIs and Express', () => {
  const request = supertest(app);

  beforeEach(() => {
    // Reset the in-memory DB before each test
    booksDb.length = 0;
    booksDb.push(
      { id: 1, title: 'Test Book 1', author: 'Author 1', pages: 100, published: '2023' },
      { id: 2, title: 'Test Book 2', author: 'Author 2', pages: 200, published: '2023' }
    );
  });

  afterAll(() => {
    stopServer();
  });

  it('GET /api/books should return all books', async () => {
    const res = await request.get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].title).toBe('Test Book 1');
  });

  it('GET /api/books/:id should return a single book', async () => {
    const res = await request.get('/api/books/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('GET /api/books/:id should return 404 for missing book', async () => {
    const res = await request.get('/api/books/999');
    expect(res.status).toBe(404);
  });

  it('POST /api/books should create a new book', async () => {
    const newBook = { title: 'Test Book 3', author: 'Author 3', pages: 300, published: '2024' };
    const res = await request.post('/api/books').send(newBook);
    
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(3);
    expect(res.body.title).toBe('Test Book 3');
  });

  it('POST /api/books should return 400 for invalid data', async () => {
    const badBook = { title: '', author: 'Author' }; // Missing pages and empty title
    const res = await request.post('/api/books').send(badBook);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid book data');
  });

  it('DELETE /api/books/:id should delete a book', async () => {
    const res = await request.delete('/api/books/1');
    expect(res.status).toBe(204);
    
    // Verify it's gone
    const checkRes = await request.get('/api/books/1');
    expect(checkRes.status).toBe(404);
  });
});
