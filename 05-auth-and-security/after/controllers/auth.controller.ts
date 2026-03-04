/**
 * Auth Controller — Registration and Login Endpoints
 *
 * Handles user signup and authentication. The login endpoint returns
 * a JWT token that clients include in subsequent requests.
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as userService from '../services/user.service.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_learning_only';

const AuthSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validation = AuthSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ error: 'Invalid input', details: validation.error.format() });
      return;
    }

    const { username, password } = validation.data;

    const existingUser = await userService.getUserByUsername(username);
    if (existingUser) {
      // 409 Conflict — the resource (username) already exists
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const newUser = await userService.createUser(username, password);
    res.status(201).json(newUser);
  } catch (error) { next(error); }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const validation = AuthSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ error: 'Invalid input', details: validation.error.format() });
      return;
    }

    const { username, password } = validation.data;
    const user = await userService.getUserByUsername(username);

    // KEY CONCEPT: Use the same error message for "user not found" and
    // "wrong password." If you say "user not found" separately, attackers
    // can enumerate valid usernames.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // KEY CONCEPT: JWT contains a payload (claims) that's signed but NOT encrypted.
    // Anyone can decode it — don't put secrets in it. The signature just proves
    // it wasn't tampered with. expiresIn: '1h' means the token self-destructs
    // after 1 hour, forcing the client to re-authenticate.
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return token + safe user info (never the password hash)
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) { next(error); }
}
