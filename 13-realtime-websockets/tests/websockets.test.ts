import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app, startServer, stopServer } from '../after/index.js';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('Module 13: WebSocket Server', () => {
  let container: any;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('bookstore')
      .withUsername('user')
      .withPassword('password')
      .start();

    process.env.DATABASE_URL = container.getConnectionUri();
  }, 60000);

  afterAll(async () => {
    stopServer();
    if (container) await container.stop();
  });

  describe('HTTP API still works', () => {
    it('GET /api/books returns 200', async () => {
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
    });

    it('POST /api/auth/register returns 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testws', password: 'password123' });
      expect(res.status).toBe(201);
    });
  });
});
