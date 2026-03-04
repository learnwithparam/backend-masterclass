import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app, startServer, stopServer } from '../after/index.js';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('Module 14: Observability', () => {
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

  describe('Health Checks', () => {
    it('GET /health returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /health/ready returns 200 when DB is up', async () => {
      const res = await request(app).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
    });
  });

  describe('Request ID', () => {
    it('generates X-Request-Id when not provided', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('echoes provided X-Request-Id', async () => {
      const res = await request(app)
        .get('/health')
        .set('X-Request-Id', 'test-123');
      expect(res.headers['x-request-id']).toBe('test-123');
    });
  });

  describe('Metrics', () => {
    it('GET /health/metrics returns metrics object', async () => {
      const res = await request(app).get('/health/metrics');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalRequests');
      expect(res.body).toHaveProperty('responseTimes');
    });
  });
});
