import { describe, expect, it, beforeAll, beforeEach, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
dotenv.config();

describe('Module 05: Authentication & Security', () => {
  let container: StartedPostgreSqlContainer;
  let request: any;

  let app: any;
  let db: any;
  let client: any;
  let books: any;
  let users: any;
  let stopServer: any;

  let book1Id: number;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    // 1. Start an isolated PostgreSQL container
    console.log('🐳 Starting PostgreSQL Testcontainer...');
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('bookstore_test')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    // 2. Override environment variables BEFORE the app initializes
    const uri = container.getConnectionUri();
    process.env.DATABASE_URL = uri;
    process.env.JWT_SECRET = 'test_secret_key';

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
    users = schemaModule.users;

    // @ts-ignore
    const appModule = await import('../after/index.js');
    app = appModule.app;
    stopServer = appModule.stopServer;

    request = supertest(app);

    // 5. Create admin and customer accounts
    await request.post('/api/auth/register').send({ username: 'adminuser', password: 'password123' });
    await db.update(users).set({ role: 'admin' }).where(require('drizzle-orm').eq(users.username, 'adminuser'));

    const adminLogin = await request.post('/api/auth/login').send({ username: 'adminuser', password: 'password123' });
    adminToken = adminLogin.body.token;

    await request.post('/api/auth/register').send({ username: 'customer', password: 'password123' });
    const customerLogin = await request.post('/api/auth/login').send({ username: 'customer', password: 'password123' });
    customerToken = customerLogin.body.token;
  }, 60000);

  beforeEach(async () => {
    await db.delete(books);
    const seeded = await db.insert(books).values([
      { title: 'Test Book 1', author: 'Author 1', pages: 100, published: '2023' }
    ]).returning({ id: books.id });
    book1Id = seeded[0].id;
  });

  afterAll(async () => {
    if (stopServer) stopServer();
    if (client) await client.end();
    if (container) await container.stop();
  });

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      const res = await request.post('/api/auth/register').send({
        username: 'newuser',
        password: 'password123'
      });
      expect(res.status).toBe(201);
      expect(res.body.username).toBe('newuser');
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('should not register duplicate users', async () => {
      const res = await request.post('/api/auth/register').send({
        username: 'newuser',
        password: 'password'
      });
      expect(res.status).toBe(409);
    });

    it('should login an existing user and return a JWT', async () => {
      const res = await request.post('/api/auth/login').send({
        username: 'newuser',
        password: 'password123'
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should block incorrect logins', async () => {
      const res = await request.post('/api/auth/login').send({
        username: 'newuser',
        password: 'wrongpassword'
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Secured Book Endpoints', () => {
    const newBook = { title: 'New Book', author: 'Author', pages: 300, published: '2024' };

    it('should allow anyone to read books (GET)', async () => {
      const res = await request.get('/api/books');
      expect(res.status).toBe(200);
    });

    it('should block anonymous users from creating books (POST)', async () => {
      const res = await request.post('/api/books').send(newBook);
      expect(res.status).toBe(401);
    });

    it('should block customers from creating books (POST)', async () => {
      const res = await request.post('/api/books')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newBook);
      expect(res.status).toBe(403);
    });

    it('should allow admins to create books (POST)', async () => {
      const res = await request.post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newBook);
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Book');
    });

    it('should allow admins to delete books (DELETE)', async () => {
      const res = await request.delete(`/api/books/${book1Id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });
});
