import { db } from '../db/index.js';
import { users, User } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.username, username));
  return result[0];
}

export async function createUser(username: string, plainTextPassword: string, role: 'admin' | 'customer' = 'customer'): Promise<Omit<User, 'passwordHash'>> {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(plainTextPassword, saltRounds);

  const result = await db.insert(users).values({
    username,
    passwordHash,
    role
  }).returning();

  const user = result[0];
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
