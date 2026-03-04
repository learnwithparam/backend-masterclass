/**
 * Inventory Schema — Owned by the Inventory Service
 *
 * KEY CONCEPT: Each microservice owns its own data. The Inventory Service
 * has an `inventory` table with just bookId and stockQuantity. It does NOT
 * duplicate the book title, author, or price — that data belongs to the
 * Order Service's `books` table. Services share only IDs via events.
 */
import { pgTable, serial, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  bookId: integer('book_id').notNull().unique(),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = typeof inventory.$inferInsert;
