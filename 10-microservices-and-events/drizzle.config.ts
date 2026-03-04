import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: ['./after/order-service/db/schema.ts', './after/inventory-service/db/schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/bookstore',
  },
  verbose: true,
});
