/**
 * WebSocket Authentication
 *
 * TODO: Implement authenticateUpgrade(req):
 * 1. Parse the URL to get the ?token= query param
 * 2. Verify the JWT with jsonwebtoken
 * 3. Return the decoded user payload, or null if invalid
 */
import jwt from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import { config } from '../config.js';

export interface WsUser {
  userId: number;
  username: string;
  role: string;
}

export function authenticateUpgrade(req: IncomingMessage): WsUser | null {
  // TODO: Extract token from URL query params
  // TODO: Verify with jwt.verify()
  // TODO: Return decoded payload or null
  return null;
}
