/**
 * Message Handlers
 *
 * TODO: Implement handleMessage(ws, data, user):
 * 1. Parse JSON (send error if invalid)
 * 2. Route by message.type:
 *    - "subscribe" → joinRoom(ws, message.channel)
 *    - "unsubscribe" → leaveRoom(ws, message.channel)
 *    - "inventory_update" → admin-only, broadcast to book:N and catalog rooms
 */
import { WebSocket } from 'ws';
import { joinRoom, leaveRoom } from './rooms.js';
import { broadcastToRoom } from './broadcast.js';
import { WsUser } from './auth.js';

export function handleMessage(ws: WebSocket, data: string, user: WsUser): void {
  // TODO: Parse JSON, route by type
}
