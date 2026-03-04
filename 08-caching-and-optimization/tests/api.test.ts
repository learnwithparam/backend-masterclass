import { describe, expect, it, beforeAll, beforeEach, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
dotenv.config();

describe('Module 08: Caching & Optimization', () => {
  let pgContainer: StartedPostgreSqlContainer;
  let request: any;

  let app: any;
  let db: any;
  let client: any;
  let books: any;
  let users: any;
  let orders: any;
  let stopServer: any;

  let book1Id: number;
  let adminToken: string;

  beforeAll(async () => {
    console.log('🐳 Starting PostgreSQL Testcontainer...');
    pgContainer = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('bookstore_test').withUsername('testuser').withPassword('testpass').start();

    process.env.DATABASE_URL = pgContainer.getConnectionUri();
    process.env.REDIS_URL = 'redis://localhost:9999'; // intentionally unavailable — cache degrades gracefully
    process.env.JWT_SECRET = 'test_secret_key';

    console.log('📦 Pushing Drizzle Schema...');
    execSync('npx drizzle-kit push', { env: { ...process.env }, stdio: 'ignore' });

    // @ts-ignore
    const dbModule = await import('../after/db/index.js');
    db = dbModule.db; client = dbModule.client;
    // @ts-ignore
    const schemaModule = await import('../after/db/schema.js');
    books = schemaModule.books; users = schemaModule.users; orders = schemaModule.orders;
    // @ts-ignore
    const appModule = await import('../after/index.js');
    app = appModule.app; stopServer = appModule.stopServer;

    request = supertest(app);

    // Setup admin user
    await request.post('/api/auth/register').send({ username: 'adminuser', password: 'password123' });
    await db.update(users).set({ role: 'admin' }).where(require('drizzle-orm').eq(users.username, 'adminuser'));
    const adminLogin = await request.post('/api/auth/login').send({ username: 'adminuser', password: 'password123' });
    adminToken = adminLogin.body.token;
  }, 60000);

  beforeEach(async () => {
    await db.delete(orders);
    await db.delete(books);
    const seeded = await db.insert(books).values([
      { title: 'Cached Book', author: 'Author', pages: 100, published: '2023' }
    ]).returning({ id: books.id });
    book1Id = seeded[0].id;
  });

  afterAll(async () => {
    if (stopServer) stopServer();
    if (client) await client.end();
    if (pgContainer) await pgContainer.stop();
  });

  describe('Cached Book Endpoints', () => {
    it('GET /api/books should return books (cache miss falls through to DB)', async () => {
      const res = await request.get('/api/books');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Cached Book');
    });

    it('GET /api/books/:id should return a single book', async () => {
      const res = await request.get(`/api/books/${book1Id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(book1Id);
    });

    it('consecutive GET /api/books calls should work (verifies graceful cache degradation)', async () => {
      const res1 = await request.get('/api/books');
      const res2 = await request.get('/api/books');
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body).toEqual(res2.body);
    });

    it('POST /api/books should create a book and invalidate cache', async () => {
      const res = await request.post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Book', author: 'New Author', pages: 200, published: '2024' });
      expect(res.status).toBe(201);

      // The second GET should include the new book (cache was invalidated)
      const list = await request.get('/api/books');
      expect(list.body.length).toBe(2);
    });

    it('DELETE /api/books/:id should delete a book and invalidate cache', async () => {
      const delRes = await request.delete(`/api/books/${book1Id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(delRes.status).toBe(204);

      const list = await request.get('/api/books');
      expect(list.body.length).toBe(0);
    });
  });
});
