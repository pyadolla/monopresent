const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3003 });
const clients = new Set();

server.on('connection', (ws) => {
  // Add the new connection to the clients set
  clients.add(ws);

  ws.on('message', (message) => {
    // Broadcast the received message to all other connected clients
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

console.log("WebSocket server running on ws://localhost:3003");
