/**
 * Database Schema — Books + Users Tables
 *
 * Module 12 adds coverUrl to books for file upload support.
 */
import { pgTable, serial, varchar, integer, timestamp, text, pgEnum } from 'drizzle-orm/pg-core';

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  pages: integer('pages').notNull(),
  published: varchar('published', { length: 255 }).notNull(),
  coverUrl: varchar('cover_url', { length: 500 }), // NEW: optional cover image path
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const roleEnum = pgEnum('role', ['admin', 'customer']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').default('customer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
