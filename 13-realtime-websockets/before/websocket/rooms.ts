/**
 * Room Management
 *
 * TODO: Implement room management with two Maps:
 * - rooms: Map<string, Set<WebSocket>> — room name → connected clients
 * - clientRooms: Map<WebSocket, Set<string>> — client → rooms (reverse lookup)
 *
 * Functions to implement:
 * - joinRoom(ws, roomName) — add client to room + reverse lookup
 * - leaveRoom(ws, roomName) — remove from room, cleanup empty rooms
 * - leaveAllRooms(ws) — remove from all rooms (called on disconnect)
 * - getRoomMembers(roomName) — return Set of clients in room
 */
import { WebSocket } from 'ws';

const rooms = new Map<string, Set<WebSocket>>();
const clientRooms = new Map<WebSocket, Set<string>>();

export function joinRoom(ws: WebSocket, roomName: string): void {
  // TODO
}

export function leaveRoom(ws: WebSocket, roomName: string): void {
  // TODO
}

export function leaveAllRooms(ws: WebSocket): void {
  // TODO
}

export function getRoomMembers(roomName: string): Set<WebSocket> {
  return rooms.get(roomName) || new Set();
}
