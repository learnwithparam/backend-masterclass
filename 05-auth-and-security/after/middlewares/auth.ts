/**
 * Auth Middleware — JWT Verification and Role-Based Access Control
 *
 * Think of this as the hotel front desk. requireAuth checks if you have a
 * valid room key (JWT). requireRole checks if your key grants access to
 * the floor you're trying to reach (admin vs customer).
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

// In production, this MUST come from environment variables, not hardcoded.
// A leaked JWT secret means anyone can forge authentication tokens.
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

// KEY CONCEPT: Authentication = "Who are you?"
// Checks the Authorization header for a valid JWT token.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Bearer token format: "Bearer eyJhbGciOiJ..."
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify both decodes AND validates the signature + expiration
    const payload = jwt.verify(token, JWT_SECRET) as Request['user'];
    req.user = payload; // Attach decoded user info for downstream handlers
    next();
  } catch (err) {
    // Token is expired, malformed, or signed with a different secret
    res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
}

// KEY CONCEPT: Authorization = "Are you allowed to do this?"
// Returns a middleware function that checks the user's role.
// Usage: requireRole('admin') — only admins can proceed.
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: `Forbidden: Requires ${role} role` });
      return;
    }

    next();
  };
}
