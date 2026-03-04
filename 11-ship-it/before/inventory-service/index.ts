import express from 'express';
import * as dotenv from 'dotenv';
import { setupEventSubscriptions } from './events/subscriber.js';

dotenv.config();

const app = express();
app.use(express.json());

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
