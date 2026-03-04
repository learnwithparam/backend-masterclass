/**
 * WebSocket Authentication — JWT on Upgrade
 *
 * KEY CONCEPT: HTTP has headers for auth. WebSocket doesn't — by the
 * time the connection is open, you can't send a 401. So we verify
 * the JWT during the HTTP upgrade request, BEFORE the WebSocket
 * connection is established. The token comes via query string.
 *
 * Why query string and not headers? The browser WebSocket API
 * (new WebSocket(url)) doesn't support custom headers.
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
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) return null;

    const payload = jwt.verify(token, config.jwtSecret) as WsUser;
    return payload;
  } catch {
    return null;
  }
}
