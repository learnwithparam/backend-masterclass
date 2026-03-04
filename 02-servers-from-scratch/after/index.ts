/**
 * Module 02: Servers from Scratch
 *
 * Your first HTTP server using Express.js. This file demonstrates the minimal
 * setup needed to accept HTTP requests and return JSON responses — the foundation
 * of every backend API.
 */
import express from 'express';
import { Server } from 'http';

// Initialize an Express application. This object IS your server — it holds
// all your routes, middleware, and configuration.
export const app = express();

// KEY CONCEPT: A "route" maps an HTTP method + URL path to a handler function.
// When someone visits GET /health, Express calls this function.
// Health check endpoints are an industry standard — load balancers, Kubernetes,
// and monitoring tools all rely on them to know if your service is alive.
app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

// We keep a reference to the server instance so we can shut it down cleanly
// during tests. Without this, Jest would hang waiting for the port to close.
let serverInstance: Server | null = null;

// KEY CONCEPT: app.listen() binds the Express app to a TCP port.
// After this call, your machine is actively listening for HTTP connections
// on that port. This is what makes your code a "server."
export function startServer(port: number = 3000): Server {
  serverInstance = app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
  return serverInstance;
}

// Graceful shutdown helper — critical for testing and production deployments
export function stopServer() {
  if (serverInstance) {
    serverInstance.close();
  }
}

// Only start the server when running this file directly (not when imported by tests)
if (require.main === module) {
  startServer(3000);
}
