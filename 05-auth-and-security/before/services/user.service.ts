import { db } from '../db/index.js';
import { users, User } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// TODO: Implement getUserByUsername
// Query the users table where username matches the input.
// Return the first result, or undefined if not found.
export async function getUserByUsername(username: string): Promise<User | undefined> {
  // Your code here
  return undefined;
}

// TODO: Implement createUser
// 1. Hash the password using bcrypt (use 10 salt rounds)
// 2. Insert a new user with username, passwordHash, and role
// 3. Return the user WITHOUT the passwordHash (never leak password hashes!)
//
// Hint: Use destructuring to remove passwordHash:
//   const { passwordHash: _, ...safeUser } = user;
export async function createUser(username: string, plainTextPassword: string, role: 'admin' | 'customer' = 'customer'): Promise<Omit<User, 'passwordHash'>> {
  // Your code here
  throw new Error('Not implemented');
}
