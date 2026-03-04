import { describe, expect, it, beforeAll, beforeEach, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
dotenv.config();

describe('Module 07: Background Jobs', () => {
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
  let customerToken: string;

  beforeAll(async () => {
    console.log('🐳 Starting PostgreSQL Testcontainer...');
    pgContainer = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('bookstore_test').withUsername('testuser').withPassword('testpass').start();

    process.env.DATABASE_URL = pgContainer.getConnectionUri();
    process.env.REDIS_URL = 'redis://localhost:9999'; // intentionally wrong — tests should work without Redis
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

    // Setup users
    await request.post('/api/auth/register').send({ username: 'adminuser', password: 'password123' });
    await db.update(users).set({ role: 'admin' }).where(require('drizzle-orm').eq(users.username, 'adminuser'));
    const adminLogin = await request.post('/api/auth/login').send({ username: 'adminuser', password: 'password123' });
    adminToken = adminLogin.body.token;

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

  describe('Order Placement (POST /api/orders)', () => {
    it('should block anonymous users from placing orders', async () => {
      const res = await request.post('/api/orders').send({ bookId: book1Id, quantity: 1 });
      expect(res.status).toBe(401);
    });

    it('should allow authenticated customers to place an order', async () => {
      const res = await request.post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ bookId: book1Id, quantity: 2 });

      expect(res.status).toBe(202); // 202 Accepted (async processing!)
      expect(res.body.order.status).toBe('pending');
      expect(res.body.order.quantity).toBe(2);
      expect(res.body.message).toContain('Confirmation email');
    });

    it('should reject invalid order data', async () => {
      const res = await request.post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ bookId: -1 });
      expect(res.status).toBe(400);
    });
  });

  describe('Order Retrieval (GET /api/orders/:id)', () => {
    it('should retrieve an order by ID for the owner', async () => {
      const orderRes = await request.post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ bookId: book1Id, quantity: 1 });
      const orderId = orderRes.body.order.id;

      const res = await request.get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(orderId);
    });

    it('should return 404 for a non-existent order', async () => {
      const res = await request.get('/api/orders/999999')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(404);
    });
  });
});
