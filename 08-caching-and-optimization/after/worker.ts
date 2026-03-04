import { Worker, Job } from 'bullmq';
import { getRedisConnectionOpts } from './queue.js';
import { db } from './db/index.js';
import { orders } from './db/schema.js';
import { eq } from 'drizzle-orm';

console.log('👷 Background Worker started and listening for jobs...');

// This separate Node process listens to the 'OrderConfirmations' queue on Redis
const worker = new Worker('OrderConfirmations', async (job: Job) => {
  const { orderId, userId, bookId, quantity } = job.data;
  
  console.log(`[Job ${job.id}] ⏳ Processing order #${orderId} for User ${userId}...`);
  
  // Simulate 3 seconds of heavy lifting (e.g., generating PDF invoice, calling SendGrid/SES)
  await new Promise((resolve) => setTimeout(resolve, 3000));
  
  // Update the database to reflect the work is done
  await db.update(orders)
    .set({ status: 'completed' })
    .where(eq(orders.id, orderId));

  console.log(`[Job ${job.id}] ✅ Email sent and invoice generated for order #${orderId}!`);
}, { connection: getRedisConnectionOpts() });

worker.on('failed', (job, err) => {
  console.error(`[Job ${job?.id}] ❌ Failed: ${err.message}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
