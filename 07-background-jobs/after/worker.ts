/**
 * Background Worker — Separate Process for Job Processing
 *
 * This file runs as its own Node.js process (not inside the Express server).
 * It connects to the same Redis queue and processes jobs asynchronously.
 *
 * KEY CONCEPT: The worker is a separate process because:
 * 1. If it crashes, the API server keeps running
 * 2. You can scale workers independently (run 5 workers, 1 API server)
 * 3. CPU-heavy work doesn't block API response times
 *
 * Run this with: npx tsx after/worker.ts
 */
import { Worker, Job } from 'bullmq';
import { getRedisConnectionOpts } from './queue.js';
import { db } from './db/index.js';
import { orders } from './db/schema.js';
import { eq } from 'drizzle-orm';

console.log('👷 Background Worker started and listening for jobs...');

// The Worker constructor takes: queue name, handler function, options
// The handler runs once for each job that arrives in the queue
const worker = new Worker('OrderConfirmations', async (job: Job) => {
  const { orderId, userId, bookId, quantity } = job.data;

  console.log(`[Job ${job.id}] ⏳ Processing order #${orderId} for User ${userId}...`);

  // Simulate heavy work: generating PDF invoice, sending email via SendGrid, etc.
  // In production, this would be real API calls that take seconds
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Update the order status in PostgreSQL so the client can poll for completion
  await db.update(orders)
    .set({ status: 'completed' })
    .where(eq(orders.id, orderId));

  console.log(`[Job ${job.id}] ✅ Email sent and invoice generated for order #${orderId}!`);
}, { connection: getRedisConnectionOpts() });

// BullMQ automatically retries failed jobs (configurable). This logs failures.
worker.on('failed', (job, err) => {
  console.error(`[Job ${job?.id}] ❌ Failed: ${err.message}`);
});

// Graceful shutdown: finish current job before exiting
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});
