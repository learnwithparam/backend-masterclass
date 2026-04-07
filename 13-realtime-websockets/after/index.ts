import express from 'express';
import cors from 'cors';
import { bookRouter } from './routes/book.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { requestLogger, errorHandler } from './middlewares/logger.js';
import { setupWebSocket } from './websocket/server.js';
import { Server } from 'http';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);

app.use(errorHandler);

let serverInstance: Server | null = null;

export function startServer(port: number = 3000): Server {
  serverInstance = app.listen(port, () => {
    console.log(`Book API running on http://localhost:${port}`);
    console.log(`WebSocket server on ws://localhost:${port}`);
  });

  // Attach WebSocket server to the same HTTP server
  setupWebSocket(serverInstance);

  return serverInstance;
}

export function stopServer() {
  if (serverInstance) {
    serverInstance.close();
  }
}

if (process.argv[1] && /13-realtime-websockets[\\/](after|before)[\\/]index\.(ts|js)$/.test(process.argv[1])) {
  startServer(3000);
}
