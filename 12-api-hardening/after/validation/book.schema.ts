/**
 * Zod Validation Schemas — Query Params + Body
 *
 * KEY CONCEPT: Validate at the boundary. Every piece of external input
 * (query strings, request bodies, file metadata) gets validated before
 * it touches your business logic. Zod makes this declarative.
 */
import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Body for creating a book (without file — file comes via multipart)
export const CreateBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  author: z.string().min(1, 'Author is required').max(255),
  pages: z.coerce.number().int().positive('Pages must be positive'),
  published: z.string().min(1, 'Published date is required'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type CreateBookInput = z.infer<typeof CreateBookSchema>;
