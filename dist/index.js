"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
// Define the port to run the WebSocket server
const PORT = 8080;
// Create a new WebSocket server
const wss = new ws_1.WebSocketServer({ port: PORT });
wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.send('Welcome to the WebSocket server!');
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        ws.send(`Server received: ${message}`);
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
console.log(`WebSocket server is running on ws://localhost:${PORT}`);
