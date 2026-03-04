/**
 * Message Handlers — Route Incoming WebSocket Messages
 *
 * KEY CONCEPT: WebSocket messages are raw strings. We parse them as
 * JSON and route by "type" field — similar to Redux actions or event
 * emitters. This keeps message handling organized as the system grows.
 */
import { WebSocket } from 'ws';
import { joinRoom, leaveRoom } from './rooms.js';
import { broadcastToRoom } from './broadcast.js';
import { WsUser } from './auth.js';

interface WsMessage {
  type: string;
  [key: string]: any;
}

export function handleMessage(ws: WebSocket, data: string, user: WsUser): void {
  let message: WsMessage;
  try {
    message = JSON.parse(data);
  } catch {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    return;
  }

  switch (message.type) {
    case 'subscribe':
      handleSubscribe(ws, message, user);
      break;

    case 'unsubscribe':
      handleUnsubscribe(ws, message);
      break;

    case 'inventory_update':
      handleInventoryUpdate(ws, message, user);
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
  }
}

function handleSubscribe(ws: WebSocket, message: WsMessage, user: WsUser): void {
  const channel = message.channel;
  if (!channel || typeof channel !== 'string') {
    ws.send(JSON.stringify({ type: 'error', message: 'Missing channel field' }));
    return;
  }

  joinRoom(ws, channel);
  ws.send(JSON.stringify({
    type: 'subscribed',
    channel,
    message: `Joined channel: ${channel}`,
  }));
}

function handleUnsubscribe(ws: WebSocket, message: WsMessage): void {
  const channel = message.channel;
  if (!channel) return;
  leaveRoom(ws, channel);
  ws.send(JSON.stringify({ type: 'unsubscribed', channel }));
}

function handleInventoryUpdate(ws: WebSocket, message: WsMessage, user: WsUser): void {
  // Only admins can broadcast inventory updates
  if (user.role !== 'admin') {
    ws.send(JSON.stringify({ type: 'error', message: 'Forbidden: admin role required' }));
    return;
  }

  const { bookId, stock } = message;
  if (!bookId || stock === undefined) {
    ws.send(JSON.stringify({ type: 'error', message: 'Missing bookId or stock' }));
    return;
  }

  // Broadcast to the book's channel and the general catalog channel
  const update = JSON.stringify({
    type: 'inventory_changed',
    bookId,
    stock,
    updatedBy: user.username,
    timestamp: new Date().toISOString(),
  });

  broadcastToRoom(`book:${bookId}`, update);
  broadcastToRoom('catalog', update);
}
