import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import WebSocket from 'ws';
import http from 'http';
import postgres from 'postgres';

const PORT = 3099;

function requestJson(port: number, path: string, method = 'GET', body?: unknown) {
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, body: data ? JSON.parse(data) : {} });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function waitForMessage(socket: WebSocket, predicate: (message: any) => boolean, timeoutMs = 5000) {
  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for WebSocket message'));
    }, timeoutMs);

    const onMessage = (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        if (predicate(message)) {
          cleanup();
          resolve(message);
        }
      } catch {
        // Ignore malformed frames in the helper.
      }
    };

    const cleanup = () => {
      clearTimeout(timer);
      socket.off('message', onMessage);
    };

    socket.on('message', onMessage);
  });
}

describe('Module 13: WebSocket Server', () => {
  let container: StartedPostgreSqlContainer;
  let sql: postgres.Sql<{}>;
  let appModule: any;
  let server: any;
  let port = PORT;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('bookstore')
      .withUsername('user')
      .withPassword('password')
      .start();

    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.JWT_SECRET = 'test_secret_key';
    process.env.PORT = String(PORT);

    sql = postgres(process.env.DATABASE_URL);
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE role AS ENUM ('admin', 'customer');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        pages INTEGER NOT NULL,
        published VARCHAR(255) NOT NULL,
        stock INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role role DEFAULT 'customer' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    appModule = await import('../after/index.js');
    server = appModule.startServer(0);
    const address = server.address();
    if (address && typeof address === 'object') {
      port = address.port;
    }
  }, 90000);

  afterAll(async () => {
    if (appModule) {
      appModule.stopServer();
    }
    if (sql) await sql.end({ timeout: 5 });
    if (container) await container.stop();
  });

  it('keeps the HTTP API working', async () => {
    const response = await requestJson(port, '/api/books');
    expect(response.status).toBe(200);
  });

  it('authenticates websocket upgrades, subscribes to rooms, and broadcasts inventory updates', async () => {
    const register = await requestJson(port, '/api/auth/register', 'POST', {
      username: 'ws-customer',
      password: 'password123',
    });
    expect(register.status).toBe(201);

    const login = await requestJson(port, '/api/auth/login', 'POST', {
      username: 'ws-customer',
      password: 'password123',
    });
    expect(login.status).toBe(200);

    const adminService = await import('../after/services/user.service.js');
    await adminService.createUser('ws-admin', 'password123', 'admin');
    const adminLogin = await requestJson(port, '/api/auth/login', 'POST', {
      username: 'ws-admin',
      password: 'password123',
    });
    expect(adminLogin.status).toBe(200);

    const customerSocket = new WebSocket(`ws://127.0.0.1:${port}?token=${login.body.token}`);
    const adminSocket = new WebSocket(`ws://127.0.0.1:${port}?token=${adminLogin.body.token}`);

    const customerWelcome = await waitForMessage(customerSocket, (message) => message.type === 'welcome');
    expect(customerWelcome.message).toContain('ws-customer');

    const adminWelcome = await waitForMessage(adminSocket, (message) => message.type === 'welcome');
    expect(adminWelcome.message).toContain('ws-admin');

    customerSocket.send(JSON.stringify({ type: 'subscribe', channel: 'book:42' }));
    const subscribed = await waitForMessage(customerSocket, (message) => message.type === 'subscribed');
    expect(subscribed.channel).toBe('book:42');

    customerSocket.send('not-json');
    const invalidJson = await waitForMessage(customerSocket, (message) => message.type === 'error' && message.message === 'Invalid JSON');
    expect(invalidJson.message).toBe('Invalid JSON');

    adminSocket.send(JSON.stringify({ type: 'inventory_update', bookId: 42, stock: 7 }));
    const inventoryUpdate = await waitForMessage(
      customerSocket,
      (message) => message.type === 'inventory_changed' && message.bookId === 42 && message.stock === 7
    );
    expect(inventoryUpdate.updatedBy).toBe('ws-admin');

    customerSocket.close();
    adminSocket.close();
  });
});
