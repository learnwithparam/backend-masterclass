import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
import { db } from '../db/index.js';
import { inventory } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const subscriber = new Redis(REDIS_URL);
const logger = console;

export function setupEventSubscriptions() {
  logger.info('🎧 Inventory Service subscribing to events...');
  
  subscriber.subscribe('OrderPlaced', (err, count) => {
    if (err) logger.error('❌ Failed to subscribe: %s', err.message);
    else logger.info(`✅ Subscribed successfully to ${count} channel(s).`);
  });

  subscriber.on('message', async (channel, message) => {
    if (channel === 'OrderPlaced') {
      try {
        const eventData = JSON.parse(message);
        logger.info(`📥 Received OrderPlaced Event for Order #${eventData.orderId}`);
        await handleOrderPlaced(eventData);
      } catch (err) {
        logger.error(`❌ Failed processing event: ${(err as Error).message}`);
      }
    }
  });
}

async function handleOrderPlaced(data: { bookId: number, quantity: number, orderId: number }) {
  // Eventually consistent stock deduction
  await db.update(inventory)
    .set({ stockQuantity: sql`${inventory.stockQuantity} - ${data.quantity}` })
    .where(eq(inventory.bookId, data.bookId));

  logger.info(`✅ Reserved ${data.quantity} perfectly for book #${data.bookId} (Triggered by Order #${data.orderId})`);
}
