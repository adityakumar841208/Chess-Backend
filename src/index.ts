import WebSocket, { WebSocketServer } from 'ws';
import {GameManager} from "./GameManager"

const PORT = 8080;

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
