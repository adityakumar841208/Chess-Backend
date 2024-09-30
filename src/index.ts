import WebSocket, { WebSocketServer } from 'ws';
import {GameManager} from "./GameManager"
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

if (isNaN(PORT)) {
  throw new Error('Invalid or undefined PORT value.');
}

const game = new GameManager()

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  game.addUser(ws)

  ws.on('message', (message: string) => {
    game.gameHandler(ws,message);
  });

  ws.on('close', () => {
    game.removeUser(ws)
  });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
