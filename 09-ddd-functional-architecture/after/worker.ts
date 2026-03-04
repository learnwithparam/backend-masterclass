/**
 * Background Worker — Separate Process for Heavy Work
 *
 * KEY CONCEPT: Notice this worker imports from the domain repository layer,
 * NOT from a monolithic service. In DDD, even infrastructure code like workers
 * use the same well-defined data access layer. This means the repository is
 * the single source of truth for how data is read/written.
 */
import { Worker, Job } from 'bullmq';
import { getRedisConnectionOpts } from './queue.js';
import { updateOrderStatus } from './domain/order/order.repository.js';

console.log('👷 Background Worker started and listening for jobs...');

const worker = new Worker('OrderConfirmations', async (job: Job) => {
  const { orderId, userId, bookId, quantity } = job.data;
  
  console.log(`[Job ${job.id}] ⏳ Processing order #${orderId} for User ${userId}...`);
  
  // Simulate 3 seconds of heavy lifting
  await new Promise((resolve) => setTimeout(resolve, 3000));
  
  // Update the database using Domain Repository
  await updateOrderStatus(orderId, 'completed');

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
