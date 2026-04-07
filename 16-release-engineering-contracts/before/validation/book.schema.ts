/**
 * Zod Validation Schemas
 *
 * TODO: Create validation schemas for:
 *
 * 1. PaginationQuerySchema — validates cursor and limit query params
 *    - cursor: optional positive integer (use z.coerce.number())
 *    - limit: integer between 1 and 100, default 20
 *
 * 2. CreateBookSchema — validates book creation body
 *    - title: required string, max 255
 *    - author: required string, max 255
 *    - pages: positive integer (use z.coerce.number())
 *    - published: required string
 */
import { z } from 'zod';

// TODO: Implement PaginationQuerySchema
export const PaginationQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// TODO: Implement CreateBookSchema
export const CreateBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  pages: z.coerce.number().int().positive('Pages must be positive'),
  published: z.string(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type CreateBookInput = z.infer<typeof CreateBookSchema>;
