import express from 'express';
import { Server } from 'http';

// TODO 1: Initialize the Express app by calling express()
export const app = express();

// TODO 2: Create a GET route at "/health" that returns { status: "ok" }
// Hint: app.get('/health', (req, res) => { res.json({ ... }) })

let serverInstance: Server | null = null;

// TODO 3: Make the server listen on the given port
// Hint: app.listen(port, () => { console.log(...) })
export function startServer(port: number = 3000): Server {
  // Your code here — start listening and assign to serverInstance
  return serverInstance!;
}

export function stopServer() {
  if (serverInstance) {
    serverInstance.close();
  }
}

// Only start if run directly (not in tests)
if (require.main === module) {
  startServer(3000);
}
