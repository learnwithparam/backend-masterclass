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

// TODO: Implement registerHandler
// 1. Validate req.body with AuthSchema
// 2. Check if the username already exists (409 Conflict if so)
// 3. Create the user via userService.createUser
// 4. Return 201 with the new user (sans password hash)
export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Your code here
    res.status(501).json({ error: 'Not implemented' });
  } catch (error) { next(error); }
}

// TODO: Implement loginHandler
// 1. Validate req.body with AuthSchema
// 2. Look up the user by username
// 3. Compare the password with bcrypt.compare(password, user.passwordHash)
// 4. If invalid, return 401 (use the SAME message for "user not found"
//    and "wrong password" to prevent username enumeration)
// 5. Generate a JWT with jwt.sign({ userId, username, role }, JWT_SECRET, { expiresIn: '1h' })
// 6. Return the token and safe user info
export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Your code here
    res.status(501).json({ error: 'Not implemented' });
  } catch (error) { next(error); }
}
