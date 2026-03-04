/**
 * Room Management — Channel-Based Broadcasting
 *
 * KEY CONCEPT: Rooms let you send messages to subsets of connected
 * clients. Instead of broadcasting to everyone, you broadcast to
 * "book:42" — only clients watching that book get the update.
 *
 * This is the same pattern as Redis pub/sub channels, IRC channels,
 * or Slack channels. The naming convention "book:42" or "catalog"
 * makes it clear what each room represents.
 */
import { WebSocket } from 'ws';

const rooms = new Map<string, Set<WebSocket>>();
const clientRooms = new Map<WebSocket, Set<string>>();

export function joinRoom(ws: WebSocket, roomName: string): void {
  // Add to room
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  rooms.get(roomName)!.add(ws);

  // Track reverse lookup
  if (!clientRooms.has(ws)) {
    clientRooms.set(ws, new Set());
  }
  clientRooms.get(ws)!.add(roomName);
}

export function leaveRoom(ws: WebSocket, roomName: string): void {
  const room = rooms.get(roomName);
  if (room) {
    room.delete(ws);
    if (room.size === 0) rooms.delete(roomName);
  }

  const myRooms = clientRooms.get(ws);
  if (myRooms) myRooms.delete(roomName);
}

export function leaveAllRooms(ws: WebSocket): void {
  const myRooms = clientRooms.get(ws);
  if (myRooms) {
    for (const roomName of myRooms) {
      const room = rooms.get(roomName);
      if (room) {
        room.delete(ws);
        if (room.size === 0) rooms.delete(roomName);
      }
    }
    clientRooms.delete(ws);
  }
}

export function getRoomMembers(roomName: string): Set<WebSocket> {
  return rooms.get(roomName) || new Set();
}

export function getRoomNames(): string[] {
  return Array.from(rooms.keys());
}
