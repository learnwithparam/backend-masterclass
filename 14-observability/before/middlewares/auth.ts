import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

declare global { namespace Express { interface Request { user?: { userId: number; username: string; role: string; }; } } }

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try { req.user = jwt.verify(authHeader.split(' ')[1], config.jwtSecret) as Request['user']; next(); }
  catch { res.status(403).json({ error: 'Forbidden' }); }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) { res.status(403).json({ error: `Requires ${role} role` }); return; }
    next();
  };
}
