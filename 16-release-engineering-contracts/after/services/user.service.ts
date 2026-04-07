import { getDb } from '../db/index.js';
import { users, User } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const useInMemoryStore = process.env.USE_IN_MEMORY_DB === '1';
const memoryUsers: User[] = [];

function nextUserId(): number {
  return memoryUsers.length === 0 ? 1 : Math.max(...memoryUsers.map((user) => user.id)) + 1;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  if (useInMemoryStore) {
    return memoryUsers.find((user) => user.username === username);
  }

  const result = await getDb().select().from(users).where(eq(users.username, username));
  return result[0];
}

export async function createUser(username: string, plainTextPassword: string, role: 'admin' | 'customer' = 'customer'): Promise<Omit<User, 'passwordHash'>> {
  if (useInMemoryStore) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainTextPassword, saltRounds);
    const user: User = {
      id: nextUserId(),
      username,
      passwordHash,
      role,
      createdAt: new Date(),
    };

    memoryUsers.push(user);
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(plainTextPassword, saltRounds);

  const result = await getDb().insert(users).values({
    username,
    passwordHash,
    role
  }).returning();

  const user = result[0];
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
