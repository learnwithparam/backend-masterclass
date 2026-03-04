/**
 * Inventory Service — Event-Driven Microservice
 *
 * KEY CONCEPT: This service has NO public API for order-related operations.
 * It only exposes a /health endpoint for monitoring. All order-related work
 * happens via event subscriptions — when "OrderPlaced" is published to Redis,
 * this service reacts by deducting stock.
 *
 * This is the "silent backend service" pattern: no user-facing traffic,
 * just reacting to events from other services.
 */
import express from 'express';
import * as dotenv from 'dotenv';
import { setupEventSubscriptions } from './events/subscriber.js';

dotenv.config();

const app = express();
app.use(express.json());

// Health check endpoint — used by Docker Compose and load balancers
// to verify this service is alive and ready to process events.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventory-service' });
});

const PORT = process.env.INVENTORY_PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`📦 Inventory Microservice running on http://localhost:${PORT}`);

  // Start listening to the Event Bus (Redis Pub/Sub)
  setupEventSubscriptions();
});

export { app, server };
