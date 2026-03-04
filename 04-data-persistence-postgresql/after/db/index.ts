/**
 * Database Connection — Drizzle + PostgreSQL Setup
 *
 * Creates a connection pool to PostgreSQL using the `postgres` driver
 * and wraps it with Drizzle for type-safe queries.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/bookstore';

// KEY CONCEPT: Connection pooling. `max: 10` means up to 10 simultaneous
// connections to PostgreSQL. The pool reuses connections instead of opening
// a new one for every query, which is critical for performance.
export const client = postgres(connectionString, { max: 10 });

// Passing `schema` lets Drizzle infer types from your table definitions
export const db = drizzle(client, { schema });
