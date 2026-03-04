/**
 * Database Schema — Books + Users Tables
 *
 * This module adds a users table with role-based access control.
 * The passwordHash column stores bcrypt hashes, never plain text.
 */
import { pgTable, serial, varchar, integer, timestamp, text, pgEnum } from 'drizzle-orm/pg-core';

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  pages: integer('pages').notNull(),
  published: varchar('published', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// KEY CONCEPT: PostgreSQL enums restrict a column to a fixed set of values.
// The database itself enforces that role can only be 'admin' or 'customer'.
export const roleEnum = pgEnum('role', ['admin', 'customer']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(), // .unique() adds a DB constraint
  passwordHash: text('password_hash').notNull(), // Never store plain text passwords
  role: roleEnum('role').default('customer').notNull(), // New users default to 'customer'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
