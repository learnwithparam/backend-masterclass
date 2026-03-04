import { app, startServer, stopServer } from '../after/index.js'; // Note: In a real scenario, this would import from the student's code
import supertest from 'supertest';

describe('Module 02: Servers From Scratch', () => {
  // Supertest allows us to test Express apps without actually binding them to a port
  // This is the industry standard way to test APIs!
  const request = supertest(app);

  afterAll(() => {
    stopServer(); // Ensure the port is released when tests finish
  });

  it('should return 200 OK and { status: "ok" } on the /health endpoint', async () => {
    const response = await request.get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should return 404 for an unknown endpoint', async () => {
    const response = await request.get('/unknown-endpoint');
    expect(response.status).toBe(404);
  });
});
