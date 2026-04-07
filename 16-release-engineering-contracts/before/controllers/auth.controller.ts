import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as userService from '../services/user.service.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

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

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) { next(error); }
}
