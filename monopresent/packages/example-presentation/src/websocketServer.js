const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3003 });
const clients = new Set();

server.on('connection', (ws) => {
  // Add the new connection to the clients set
  clients.add(ws);

  ws.on('message', (message) => {
    // Rebroadcast as a TEXT frame. Sending the raw Buffer makes it a binary
    // frame, which reaches the browser as a Blob, and the client then has to
    // await blob.text() on every message. That async hop is pure latency, and
    // pointer updates arrive ~60 times a second.
    const text = typeof message === 'string' ? message : message.toString();
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

console.log("WebSocket server running on ws://localhost:3003");
