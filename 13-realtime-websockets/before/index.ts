import express from 'express';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { bookRouter } from './routes/book.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { requestLogger, errorHandler } from './middlewares/logger.js';
// TODO: Import setupWebSocket from ./websocket/server.js
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
  });

  // TODO: Call setupWebSocket(serverInstance) to attach WS server

  return serverInstance;
}

export function stopServer() {
  if (serverInstance) serverInstance.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer(3000);
}
