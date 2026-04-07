import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import postgres from 'postgres';

let app: any;
let startServer: any;
let stopServer: any;

describe('Module 12: API Hardening', () => {
  let container: any;
  let adminToken: string;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('bookstore')
      .withUsername('user')
      .withPassword('password')
      .start();

    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    const sql = postgres(process.env.DATABASE_URL!);
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE "public"."role" AS ENUM('admin', 'customer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS "books" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" varchar(255) NOT NULL,
        "author" varchar(255) NOT NULL,
        "pages" integer NOT NULL,
        "published" varchar(255) NOT NULL,
        "cover_url" varchar(500),
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "username" varchar(255) NOT NULL,
        "password_hash" text NOT NULL,
        "role" "public"."role" DEFAULT 'customer' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "users_username_unique" UNIQUE("username")
      );
    `);
    await sql.end({ timeout: 5 });

    const mod = await import('../after/index.js');
    app = mod.app;
    startServer = mod.startServer;
    stopServer = mod.stopServer;
  }, 60000);

  afterAll(async () => {
    stopServer();
    if (container) await container.stop();
  });

  describe('Pagination', () => {
    it('should return paginated results with cursor', async () => {
      const res = await request(app).get('/api/v1/books?limit=2');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('nextCursor');
      expect(res.body).toHaveProperty('hasMore');
    });

    it('should reject invalid limit values', async () => {
      const res = await request(app).get('/api/v1/books?limit=0');
      expect(res.status).toBe(400);
    });

    it('should reject limit > 100', async () => {
      const res = await request(app).get('/api/v1/books?limit=200');
      expect(res.status).toBe(400);
    });
  });

  describe('API Versioning', () => {
    it('should serve v1 routes', async () => {
      const res = await request(app).get('/api/v1/books');
      expect(res.status).toBe(200);
    });

    it('should also serve unversioned routes for backwards compatibility', async () => {
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
    });
  });

  describe('File Upload', () => {
    it('should reject upload without auth', async () => {
      const res = await request(app)
        .post('/api/v1/books/1/cover')
        .attach('cover', Buffer.from('fake'), 'test.png');
      expect(res.status).toBe(401);
    });
  });
});
