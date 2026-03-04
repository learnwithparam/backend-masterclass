/**
 * Broadcasting — Send Messages to Rooms or All Clients
 *
 * KEY CONCEPT: Broadcasting is "fire and forget." We iterate over
 * all clients in a room and send the message. If a client's socket
 * is closing or closed, we skip it. We don't wait for acknowledgment.
 */
import { WebSocket } from 'ws';
import { getRoomMembers } from './rooms.js';

export function broadcastToRoom(roomName: string, message: string): void {
  const members = getRoomMembers(roomName);
  for (const client of members) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function broadcastToAll(clients: Set<WebSocket>, message: string): void {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
