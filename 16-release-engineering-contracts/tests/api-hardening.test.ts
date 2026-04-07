import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const tempUploadDir = mkdtempSync(path.join(tmpdir(), 'lwp-release-16-'));
const jwtSecret = process.env.JWT_SECRET || 'test-secret';

process.env.JWT_SECRET = jwtSecret;
process.env.USE_IN_MEMORY_DB = '1';
process.env.FAILURE_DRILLS = 'enabled';
process.env.UPLOAD_DIR = tempUploadDir;

let app: any;
let adminToken: string;

describe('Module 16: Release Engineering, Contracts, and Resilience', () => {
  beforeAll(async () => {
    const mod = await import('../after/index.js');
    app = mod.app;
    adminToken = jwt.sign(
      { userId: 1, username: 'admin16', role: 'admin' },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    rmSync(tempUploadDir, { recursive: true, force: true });
  });

  describe('Pagination', () => {
    it('returns paginated results with cursor metadata', async () => {
      const res = await request(app).get('/api/v1/books?limit=2');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('nextCursor');
      expect(res.body).toHaveProperty('hasMore');
    });

    it('rejects invalid limit values', async () => {
      const res = await request(app).get('/api/v1/books?limit=0');
      expect(res.status).toBe(400);
    });

    it('rejects large limit values', async () => {
      const res = await request(app).get('/api/v1/books?limit=200');
      expect(res.status).toBe(400);
    });
  });

  describe('API Versioning', () => {
    it('serves v1 routes', async () => {
      const res = await request(app).get('/api/v1/books');
      expect(res.status).toBe(200);
    });

    it('keeps unversioned routes for backwards compatibility', async () => {
      const res = await request(app).get('/api/books');
      expect(res.status).toBe(200);
    });
  });

  describe('File Upload', () => {
    it('rejects upload without auth', async () => {
      const res = await request(app)
        .post('/api/v1/books/1/cover')
        .attach('cover', Buffer.from('fake'), 'test.png');
      expect(res.status).toBe(401);
    });
  });

  describe('Contract Publishing', () => {
    it('publishes the OpenAPI document', async () => {
      const res = await request(app).get('/openapi.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.paths['/api/v1/books']).toBeDefined();
    });

    it('publishes human-readable docs', async () => {
      const res = await request(app).get('/docs');
      expect(res.status).toBe(200);
      expect(res.text).toContain('/openapi.json');
    });
  });

  describe('Failure Drills', () => {
    it('returns 503 when failure drill is injected', async () => {
      const res = await request(app).get('/api/v1/books?injectFailure=1');
      expect(res.status).toBe(503);
    });
  });

  describe('Release Flows', () => {
    it('allows an admin to create a book through the contract-backed route', async () => {
      const res = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Release It!',
          author: 'Michael T. Nygard',
          pages: 384,
          published: '2018',
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Release It!');
    });

    it('allows an admin to upload a cover image', async () => {
      const png = Buffer.from(
        '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c49444154789c63f80f00000101000518d84e0000000049454e44ae426082',
        'hex'
      );

      const res = await request(app)
        .post('/api/v1/books/1/cover')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('cover', png, 'cover.png');

      expect(res.status).toBe(201);
      expect(res.body.coverUrl).toMatch(/^\/uploads\//);
    });
  });

  describe('Auth Limits', () => {
    it('rate limits repeated auth attempts', async () => {
      let lastStatus = 0;

      for (let i = 0; i < 11; i += 1) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({ username: 'nobody', password: 'wrong-password' });
        lastStatus = res.status;
      }

      expect(lastStatus).toBe(429);
    });
  });
});
