import { pgTable, serial, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  bookId: integer('book_id').notNull().unique(), // references the catalog ID
  stockQuantity: integer('stock_quantity').notNull().default(0),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = typeof inventory.$inferInsert;
