import { describe, expect, it, beforeAll, beforeEach, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
dotenv.config();

describe('Module 04: Data Persistence with PostgreSQL', () => {
  let container: StartedPostgreSqlContainer;
  let request: any;

  let app: any;
  let db: any;
  let client: any;
  let books: any;
  let stopServer: any;

  let book1Id: number;
  let book2Id: number;

  beforeAll(async () => {
    // 1. Start an isolated PostgreSQL container
    console.log('🐳 Starting PostgreSQL Testcontainer...');
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('bookstore_test')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    // 2. Override DATABASE_URL before the app initializes
    const uri = container.getConnectionUri();
    process.env.DATABASE_URL = uri;

    // 3. Push schema to the test container
    console.log('📦 Pushing Drizzle Schema to Testcontainer...');
    execSync('npx drizzle-kit push', {
      env: { ...process.env, DATABASE_URL: uri },
      stdio: 'ignore'
    });

    // 4. Dynamically import modules after env is set
    // @ts-ignore
    const dbModule = await import('../after/db/index.js');
    db = dbModule.db;
    client = dbModule.client;

    // @ts-ignore
    const schemaModule = await import('../after/db/schema.js');
    books = schemaModule.books;

    // @ts-ignore
    const appModule = await import('../after/index.js');
    app = appModule.app;
    stopServer = appModule.stopServer;

    request = supertest(app);
  }, 60000);

  beforeEach(async () => {
    // Reset and seed test data
    await db.delete(books);
    const seeded = await db.insert(books).values([
      { title: 'Test Book 1', author: 'Author 1', pages: 100, published: '2023' },
      { title: 'Test Book 2', author: 'Author 2', pages: 200, published: '2023' }
    ]).returning({ id: books.id });

    book1Id = seeded[0].id;
    book2Id = seeded[1].id;
  });

  afterAll(async () => {
    if (stopServer) stopServer();
    if (client) await client.end();
    if (container) await container.stop();
  });

  it('GET /api/books should return all books', async () => {
    const res = await request.get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].title).toBe('Test Book 1');
  });

  it('GET /api/books/:id should return a single book', async () => {
    const res = await request.get(`/api/books/${book1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(book1Id);
  });

  it('GET /api/books/:id should return 404 for missing book', async () => {
    const res = await request.get('/api/books/999999');
    expect(res.status).toBe(404);
  });

  it('POST /api/books should create a new book', async () => {
    const newBook = { title: 'Test Book 3', author: 'Author 3', pages: 300, published: '2024' };
    const res = await request.post('/api/books').send(newBook);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeGreaterThan(0);
    expect(res.body.title).toBe('Test Book 3');
  });

  it('POST /api/books should return 400 for invalid data', async () => {
    const badBook = { title: '', author: 'Author' }; // Missing pages and empty title
    const res = await request.post('/api/books').send(badBook);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid book data');
  });

  it('DELETE /api/books/:id should delete a book', async () => {
    const res = await request.delete(`/api/books/${book1Id}`);
    expect(res.status).toBe(204);

    // Verify it's gone
    const checkRes = await request.get(`/api/books/${book1Id}`);
    expect(checkRes.status).toBe(404);
  });
});
