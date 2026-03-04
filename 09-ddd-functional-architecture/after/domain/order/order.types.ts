/**
 * Order Domain Types — Value Objects and Entity Shape
 *
 * KEY CONCEPT: In DDD, Value Objects are immutable objects defined by their
 * attributes, not by identity. We implement them as Zod schemas, which gives
 * us both type safety and runtime validation in one definition.
 */
import { z } from 'zod';

// Value Objects: Business rules encoded as validation schemas
// These travel to the boundary (controllers) and enforce rules at the edge.
export const QuantitySchema = z.number().int().positive().max(100, "Cannot order more than 100 items at once");

export const CreateOrderInputSchema = z.object({
  userId: z.number().int().positive(),
  bookId: z.number().int().positive(),
  quantity: QuantitySchema
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

// Domain Entity: The core shape of an Order in our system.
// KEY CONCEPT: The entity has a typed status field with only valid transitions.
// This prevents invalid states like 'completd' (typo) from ever existing.
export type OrderEntity = {
  id?: number; // Optional before persistence (DB assigns it)
  userId: number;
  bookId: number;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt?: Date;
};
