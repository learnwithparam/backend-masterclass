import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as userService from '../services/user.service.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
const AuthSchema = z.object({ username: z.string().min(3), password: z.string().min(6) });

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const v = AuthSchema.safeParse(req.body);
    if (!v.success) { res.status(400).json({ error: 'Invalid input' }); return; }
    const existing = await userService.getUserByUsername(v.data.username);
    if (existing) { res.status(409).json({ error: 'Username already exists' }); return; }
    const newUser = await userService.createUser(v.data.username, v.data.password);
    res.status(201).json(newUser);
  } catch (error) { next(error); }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const v = AuthSchema.safeParse(req.body);
    if (!v.success) { res.status(400).json({ error: 'Invalid input' }); return; }
    const user = await userService.getUserByUsername(v.data.username);
    if (!user || !(await bcrypt.compare(v.data.password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid username or password' }); return;
    }
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, config.jwtSecret, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) { next(error); }
}
