import { describe, expect, it, beforeAll, beforeEach, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
dotenv.config();

// Testing pure functions requires NO database imports!
import { createNewOrder, markOrderCompleted } from '../after/domain/order/order.entity.js';

describe('Module 09: Domain-Driven Design (Functional)', () => {
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
  let customerToken: string;

  beforeAll(async () => {
    console.log('🐳 Starting PostgreSQL Testcontainer...');
    pgContainer = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('bookstore_test').withUsername('testuser').withPassword('testpass').start();

    process.env.DATABASE_URL = pgContainer.getConnectionUri();
    process.env.REDIS_URL = 'redis://localhost:9999'; // gracefully skip cache/queue
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

    // Setup user
    await request.post('/api/auth/register').send({ username: 'customer', password: 'password123' });
    const customerLogin = await request.post('/api/auth/login').send({ username: 'customer', password: 'password123' });
    customerToken = customerLogin.body.token;
  }, 60000);

  beforeEach(async () => {
    await db.delete(orders);
    await db.delete(books);
    const seeded = await db.insert(books).values([
      { title: 'Test Book 1', author: 'Author 1', pages: 100, published: '2023' }
    ]).returning({ id: books.id });
    book1Id = seeded[0].id;
  });

  afterAll(async () => {
    if (stopServer) stopServer();
    if (client) await client.end();
    if (pgContainer) await pgContainer.stop();
  });

  describe('Pure Domain Entity Tests (NO Database)', () => {
    it('createNewOrder should enforce initial pending status', () => {
      const entity = createNewOrder({ userId: 1, bookId: 10, quantity: 2 });
      expect(entity.status).toBe('pending');
      expect(entity.quantity).toBe(2);
    });

    it('markOrderCompleted should complete an order', () => {
      const entity = createNewOrder({ userId: 1, bookId: 10, quantity: 2 });
      const completed = markOrderCompleted(entity);
      expect(completed.status).toBe('completed');
    });

    it('markOrderCompleted should throw if order is not pending', () => {
      const entity = createNewOrder({ userId: 1, bookId: 10, quantity: 2 });
      const completed = markOrderCompleted(entity);
      expect(() => markOrderCompleted(completed)).toThrow('Domain Rule Violation');
    });
  });

  describe('Use Case E2E (POST /api/orders)', () => {
    it('should validate Value Objects successfully via Zod boundary', async () => {
      const res = await request.post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ bookId: book1Id, quantity: 150 }); // Quantity > 100 is invalid

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid order input');
    });

    it('should throw Domain Error when book does not exist', async () => {
      const res = await request.post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ bookId: 9999, quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('does not exist in the catalog');
    });

    it('should place an order successfully through the DDD core', async () => {
      const res = await request.post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ bookId: book1Id, quantity: 5 });

      expect(res.status).toBe(202);
      expect(res.body.order.status).toBe('pending');
      expect(res.body.order.quantity).toBe(5);
    });
  });
});
