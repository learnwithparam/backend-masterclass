/**
 * WebSocket Server Setup
 *
 * TODO: Implement setupWebSocket(server):
 * 1. Create WebSocketServer with { noServer: true }
 * 2. Handle 'upgrade' event on the HTTP server:
 *    - Call authenticateUpgrade(request)
 *    - If null, respond with 401 and destroy socket
 *    - If valid, call wss.handleUpgrade() and emit 'connection'
 * 3. On 'connection':
 *    - Send welcome message with user info
 *    - Listen for messages → call handleMessage
 *    - On close → call leaveAllRooms
 * 4. Set up heartbeat interval (ping/pong every 30s)
 */
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { authenticateUpgrade, WsUser } from './auth.js';
import { handleMessage } from './handlers.js';
import { leaveAllRooms } from './rooms.js';

export function setupWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  // TODO: Handle upgrade event
  // TODO: Handle connection event
  // TODO: Set up heartbeat

  return wss;
}
