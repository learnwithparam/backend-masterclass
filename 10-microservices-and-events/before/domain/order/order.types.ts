import { z } from 'zod';

// Value Objects (implemented as Zod schemas for validation at the boundaries)
export const QuantitySchema = z.number().int().positive().max(100, "Cannot order more than 100 items at once");

export const CreateOrderInputSchema = z.object({
  userId: z.number().int().positive(),
  bookId: z.number().int().positive(),
  quantity: QuantitySchema
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

// Domain Entity Type
export type OrderEntity = {
  id?: number; // Optional before persistence
  userId: number;
  bookId: number;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt?: Date;
};
