/**
 * User Service — Account Management
 *
 * Handles user creation and lookup. This is where password hashing happens —
 * never in the controller, never in the database. The service owns this
 * security-critical logic.
 */
import { db } from '../db/index.js';
import { users, User, NewUser } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.username, username));
  return result[0];
}

export async function createUser(username: string, plainTextPassword: string, role: 'admin' | 'customer' = 'customer'): Promise<Omit<User, 'passwordHash'>> {
  // KEY CONCEPT: Why bcrypt? It's deliberately slow — each hash takes ~100ms.
  // This makes brute-force attacks impractical. MD5/SHA are fast, which is
  // exactly what you DON'T want for passwords.
  // Salt rounds = 10 means 2^10 = 1024 iterations. Higher = slower but safer.
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(plainTextPassword, saltRounds);

  const result = await db.insert(users).values({
    username,
    passwordHash,
    role
  }).returning();

  const user = result[0];
  // KEY CONCEPT: Never return the password hash to the client. Even hashed
  // passwords are sensitive — they can be used in offline brute-force attacks.
  // Destructure it out before returning.
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
