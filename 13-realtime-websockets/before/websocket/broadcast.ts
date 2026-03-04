/**
 * Broadcasting
 *
 * TODO: Implement broadcastToRoom(roomName, message):
 * - Get all members of the room
 * - Send message to each client with readyState === OPEN
 */
import { WebSocket } from 'ws';
import { getRoomMembers } from './rooms.js';

export function broadcastToRoom(roomName: string, message: string): void {
  // TODO
}

export function broadcastToAll(clients: Set<WebSocket>, message: string): void {
  // TODO
}
