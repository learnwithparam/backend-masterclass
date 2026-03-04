import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_learning_only';

// Extend the Express Request type to include our custom user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        role: string;
      };
    }
  }
}

// TODO: Implement requireAuth middleware
// 1. Read the Authorization header from the request
// 2. Check it starts with "Bearer " — if not, return 401
// 3. Extract the token (everything after "Bearer ")
// 4. Verify the token using jwt.verify(token, JWT_SECRET)
// 5. Attach the decoded payload to req.user
// 6. Call next() to pass control to the next handler
// 7. If verification fails, return 403
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Your code here
  res.status(401).json({ error: 'Unauthorized: Not implemented' });
}

// TODO: Implement requireRole middleware factory
// This function RETURNS a middleware function.
// The returned middleware checks that req.user.role matches the required role.
// Usage: requireRole('admin') — only admins pass through
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Your code here
    res.status(403).json({ error: 'Forbidden: Not implemented' });
  };
}
