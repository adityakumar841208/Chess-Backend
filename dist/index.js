"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const GameManager_1 = require("./GameManager");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
if (isNaN(PORT)) {
    throw new Error('Invalid or undefined PORT value.');
}
const game = new GameManager_1.GameManager();
const wss = new ws_1.WebSocketServer({ port: PORT });
wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.send(JSON.stringify({ type: "welcome" }));
    game.addUser(ws);
    ws.on('message', (message) => {
        game.gameHandler(ws, message);
    });
    ws.on('close', () => {
        game.removeUser(ws);
    });
});
console.log(`WebSocket server is running on ws://localhost:${PORT}`);
