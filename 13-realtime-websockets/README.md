# Module 13: Real-Time WebSockets

> "HTTP is like email. WebSocket is like a phone call — both sides can talk at any time."

## The Story

The bookstore needs "Live Stock." When inventory changes, all connected clients should see updates instantly. Admins need a real-time order dashboard. No more refresh buttons.

## What You'll Build

- **WebSocket server** using the `ws` library (not Socket.IO — learn the protocol)
- **JWT authentication on upgrade** — verify tokens before opening the connection
- **Room-based broadcasting** — subscribe to `book:42` or `catalog` channels
- **Message routing** — typed messages with subscribe/unsubscribe/inventory_update
- **Heartbeat** — detect and clean up dead connections

## Architecture

```
Browser                           Server
  │                                 │
  ├── GET / (Upgrade: websocket) ──►│
  │   ?token=eyJhbG...             │ ← authenticateUpgrade()
  │                                 │
  │◄── 101 Switching Protocols ────┤
  │                                 │
  │◄── { type: "welcome" } ───────┤
  │                                 │
  ├── { type: "subscribe",  ──────►│
  │    channel: "catalog" }         │ ← joinRoom(ws, "catalog")
  │                                 │
  │◄── { type: "subscribed" } ────┤
  │                                 │
  │    (another client creates a book via REST)
  │                                 │
  │◄── { type: "book_added", ─────┤ ← broadcastToRoom("catalog")
  │    data: { id: 5, ... } }      │
```

## Key Concepts

### Why `ws` and not Socket.IO?
Socket.IO adds auto-reconnect, rooms, and fallbacks — but hides the protocol. When things break, you need to understand what's underneath. `ws` teaches you the raw WebSocket lifecycle.

### Authentication on Upgrade
The browser `WebSocket` API doesn't support custom headers. So we pass the JWT via query string: `ws://localhost:3000?token=eyJ...`. The server verifies it during the HTTP upgrade — before the WebSocket opens.

### Room Pattern
Instead of broadcasting to all 10,000 connected clients, rooms let you target messages. A client watching book #42 subscribes to `book:42` and only gets updates for that book.

## Prerequisites

- Module 05 (Auth & Security) completed
- Docker Desktop running

## Your Task

1. Implement `authenticateUpgrade()` to verify JWT from query string
2. Build room management (join, leave, cleanup)
3. Create message handlers for subscribe/unsubscribe/inventory_update
4. Wire up the WebSocket server to share the HTTP server's port
5. Add heartbeat to detect dead connections

## Testing

```bash
make setup    # Install deps, start DB
make solution # Run the solution
make smoke    # Run E2E smoke tests
make test     # Run integration tests
```

## Common Mistakes

1. **Separate port for WebSocket** — Use `noServer: true` and handle upgrade on the HTTP server. One port, one load balancer.
2. **No auth on WebSocket** — Anyone can connect and receive data. Always verify JWT on upgrade.
3. **Memory leak on disconnect** — Forgetting to clean up room memberships when clients disconnect.
4. **No heartbeat** — Dead connections stay in memory forever. Ping/pong every 30s detects them.

## What's Next

Module 14 adds observability — structured logging, health checks, and metrics for production.
