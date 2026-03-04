import { describe, expect, it, beforeAll, beforeEach, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

// Testing pure functions
import { createNewOrder } from '../after/order-service/domain/order/order.entity.js';

describe('Module 10: Event-Driven Microservices', () => {
  let pgContainer: StartedPostgreSqlContainer;
  let redisContainer: StartedTestContainer;
  let request: any;

  let orderApp: any;
  let inventoryApp: any;
  
  // Drizzle connections
  let orderDb: any;
  let orderClient: any;
  let inventoryDb: any;
  
  // Schemas
  let books: any;
  let users: any;
  let ordersSchema: any;
  let inventorySchema: any;

  let orderStopServer: any;
  let inventoryStopServer: any;

  let book1Id: number;
  let customerToken: string;

  beforeAll(async () => {
    console.log('🐳 Starting PostgreSQL & Redis Testcontainers...');
    
    // Start Postgres
    pgContainer = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('bookstore_test').withUsername('testuser').withPassword('testpass').start();
    
    // Start Redis (for Pub/Sub)
    redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379).start();

    process.env.DATABASE_URL = pgContainer.getConnectionUri();
    process.env.REDIS_URL = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
    process.env.JWT_SECRET = 'test_secret_key';
    
    // Use different ports for the apps
    process.env.PORT = '3000';
    process.env.INVENTORY_PORT = '4000';

    console.log('📦 Pushing Drizzle Schema...');
    execSync('npx drizzle-kit push', { env: { ...process.env }, stdio: 'ignore' });

    // Load Order Service dependencies
    // @ts-ignore
    const oDbModule = await import('../after/order-service/db/index.js');
    orderDb = oDbModule.db; orderClient = oDbModule.client;
    // @ts-ignore
    const oSchemaModule = await import('../after/order-service/db/schema.js');
    books = oSchemaModule.books; users = oSchemaModule.users; ordersSchema = oSchemaModule.orders;
    // @ts-ignore
    const oAppModule = await import('../after/order-service/index.js');
    orderApp = oAppModule.app; orderStopServer = oAppModule.stopServer;

    // Load Inventory Service dependencies
    // @ts-ignore
    const iDbModule = await import('../after/inventory-service/db/index.js');
    inventoryDb = iDbModule.db;
    // @ts-ignore
    const iSchemaModule = await import('../after/inventory-service/db/schema.js');
    inventorySchema = iSchemaModule.inventory;
    // @ts-ignore
    const iAppModule = await import('../after/inventory-service/index.js');
    inventoryApp = iAppModule.app; inventoryStopServer = () => iAppModule.server?.close?.();

    request = supertest(orderApp);

    // Setup user
    await request.post('/api/auth/register').send({ username: 'microservices', password: 'password123' });
    const login = await request.post('/api/auth/login').send({ username: 'microservices', password: 'password123' });
    customerToken = login.body.token;
  }, 60000);

  beforeEach(async () => {
    await orderDb.delete(ordersSchema);
    await orderDb.delete(books);
    await inventoryDb.delete(inventorySchema);

    // Seed Book
    const seededBook = await orderDb.insert(books).values([
      { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', pages: 616, published: '2017' }
    ]).returning({ id: books.id });
    book1Id = seededBook[0].id;

    // Seed Inventory (100 in stock)
    await inventoryDb.insert(inventorySchema).values({
      bookId: book1Id,
      stockQuantity: 100
    });
  });

  afterAll(async () => {
    // Teardown everything
    if (orderStopServer) orderStopServer();
    // @ts-ignore: graceful shutdown if it exists on inventory app
    if (inventoryApp && inventoryApp.close) await inventoryApp.close(); 
    if (orderClient) await orderClient.end();
    if (redisContainer) await redisContainer.stop();
    if (pgContainer) await pgContainer.stop();
  });

  describe('Inter-Service Communication (REST -> Pub/Sub -> DB)', () => {
    it('Order Service should publish event, and Inventory Service should deduct stock', async () => {
      // 1. Initial State Check
      const startStock = await inventoryDb.select().from(inventorySchema).where(require('drizzle-orm').eq(inventorySchema.bookId, book1Id));
      expect(startStock[0].stockQuantity).toBe(100);

      // 2. Call Order Service REST API
      const res = await request.post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ bookId: book1Id, quantity: 5 });

      expect(res.status).toBe(202);
      expect(res.body.order.status).toBe('pending');
      expect(res.body.order.quantity).toBe(5);

      // 3. Wait for Eventual Consistency (allow Redis Pub/Sub to deliver and Inventory service to process)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. Verify Inventory Service reacted correctly
      const endStock = await inventoryDb.select().from(inventorySchema).where(require('drizzle-orm').eq(inventorySchema.bookId, book1Id));
      expect(endStock[0].stockQuantity).toBe(95); // 100 - 5 = 95
    });
  });
});
