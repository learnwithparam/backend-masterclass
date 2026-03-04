import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/bookstore';

// Disable prefetch for tests/serverless, otherwise connection stays open
export const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });
