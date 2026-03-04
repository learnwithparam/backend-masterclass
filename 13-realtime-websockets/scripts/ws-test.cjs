// WebSocket smoke test helper
// Usage: node scripts/ws-test.cjs <ws_url> <token> <timeout_ms>
// Connects, waits for welcome, subscribes to catalog, prints messages as JSON array
const WebSocket = require('ws');

const url = process.argv[2];
const token = process.argv[3];
const timeout = parseInt(process.argv[4] || '3000');

const ws = new WebSocket(`${url}?token=${token}`);
const messages = [];

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'catalog' }));
});

ws.on('message', (data) => {
  try {
    messages.push(JSON.parse(data.toString()));
  } catch {
    messages.push({ raw: data.toString() });
  }
});

setTimeout(() => {
  ws.close();
  console.log(JSON.stringify(messages));
  process.exit(0);
}, timeout);

ws.on('error', (err) => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
