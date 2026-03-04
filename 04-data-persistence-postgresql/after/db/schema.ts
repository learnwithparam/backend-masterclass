/**
 * Database Schema — Drizzle ORM Table Definitions
 *
 * This is your "source of truth" for the database structure. Drizzle
 * reads this file to generate migrations and provide type-safe queries.
 * Every column here maps directly to a PostgreSQL column.
 */
import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

// KEY CONCEPT: Drizzle schemas define your tables as TypeScript objects.
// This gives you compile-time type safety — if you misspell a column name
// or pass the wrong type, TypeScript catches it before your code even runs.
export const books = pgTable('books', {
  id: serial('id').primaryKey(),               // Auto-incrementing integer
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  pages: integer('pages').notNull(),
  published: varchar('published', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(), // Automatic timestamp
});

// KEY CONCEPT: Drizzle can infer TypeScript types from your schema.
// Book = what you get when you SELECT (includes id, createdAt)
// NewBook = what you provide when you INSERT (id and createdAt are optional)
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
