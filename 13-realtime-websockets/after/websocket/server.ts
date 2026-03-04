/**
 * WebSocket Server Setup
 *
 * KEY CONCEPT: We use noServer: true so the WebSocket server doesn't
 * bind its own port. Instead, the HTTP server handles the upgrade
 * request, we authenticate it, and THEN hand it off to the WS server.
 *
 * This is how you run HTTP and WebSocket on the SAME port — which is
 * what you want in production (one port, one load balancer config).
 */
import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import { authenticateUpgrade, WsUser } from './auth.js';
import { handleMessage } from './handlers.js';
import { leaveAllRooms } from './rooms.js';

// Extend WebSocket to carry user info
interface AuthenticatedWebSocket extends WebSocket {
  user?: WsUser;
  isAlive?: boolean;
}

export function setupWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  // KEY CONCEPT: The 'upgrade' event fires when a client sends an HTTP
  // request with "Connection: Upgrade" and "Upgrade: websocket" headers.
  // This is our chance to authenticate BEFORE the WebSocket opens.
  server.on('upgrade', (request, socket, head) => {
    const user = authenticateUpgrade(request);

    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      (ws as AuthenticatedWebSocket).user = user;
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    ws.isAlive = true;

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: `Connected as ${ws.user?.username}`,
      user: ws.user,
    }));

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      if (ws.user) {
        handleMessage(ws, data.toString(), ws.user);
      }
    });

    // Handle pong (heartbeat response)
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Cleanup on disconnect
    ws.on('close', () => {
      leaveAllRooms(ws);
    });
  });

  // Heartbeat: detect dead connections every 30 seconds
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const authWs = ws as AuthenticatedWebSocket;
      if (authWs.isAlive === false) {
        leaveAllRooms(authWs);
        return authWs.terminate();
      }
      authWs.isAlive = false;
      authWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}
