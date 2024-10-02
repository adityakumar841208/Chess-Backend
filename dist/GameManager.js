"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const chess_js_1 = require("chess.js");
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUser = null;
    }
    addUser(ws) {
        if (this.pendingUser) {
            const chess = new chess_js_1.Chess();
            const gameInstance = {
                player1: this.pendingUser,
                player2: ws,
                board: chess.board().flat().map(square => square ? square.type : 'empty'), //representation of empty board 
                chess: chess,
                state: [],
                turn: 'white'
            };
            gameInstance.player1.send(JSON.stringify({ type: "start", turn: 'white', yourIdentity: 'white', orientation: 'white', fen: chess.fen() }));
            gameInstance.player2.send(JSON.stringify({ type: "start", turn: 'white', yourIdentity: 'black', orientation: 'black', fen: chess.fen() }));
            this.games.push(gameInstance);
            this.pendingUser = null;
        }
        else {
            this.pendingUser = ws;
            ws.send(JSON.stringify({ type: "pendingUser" }));
        }
    }
    removeUser(ws) {
        if (ws === this.pendingUser) {
            this.pendingUser = null;
        }
        else {
            const game = this.games.find(game => game.player1 === ws || game.player2 === ws);
            if (game) {
                const opponent = game.player1 === ws ? game.player2 : game.player1;
                opponent.send(JSON.stringify({ type: "opponent disconnected!" }));
                this.games = this.games.filter(item => item !== game);
            }
        }
        console.log("user disconnected");
    }
    gameHandler(ws, message) {
        let data = JSON.parse(message);
        const game = this.games.find((game) => game.player1 === ws || game.player2 === ws);
        if (!game) {
            return;
        }
        if (data.type === 'move') {
            const { from, to, promotion } = data.move; // Extract move details including promotion
            // Apply the move with promotion if specified
            const result = game.chess.move({
                from,
                to,
                promotion // Include promotion piece if provided
            });
            if (result) {
                // Move was successful, update the board state
                game.board = game.chess.board().flat().map(square => square ? square.type : 'empty');
                // Notify both players of the move
                if (game.player1 === ws) {
                    game.player2.send(JSON.stringify({ type: "move", move: result }));
                }
                else {
                    game.player1.send(JSON.stringify({ type: "move", move: result }));
                }
                // Check if the game is over
                if (game.chess.isGameOver()) {
                    const status = game.chess.isCheckmate() ? 'Checkmate' : 'Stalemate';
                    game.player1.send(JSON.stringify({ type: "gameOver", status }));
                    game.player2.send(JSON.stringify({ type: "gameOver", status }));
                }
                else {
                    // Update turn and history
                    game.turn = game.turn === 'white' ? 'black' : 'white';
                    const history = game.chess.history();
                    game.player1.send(JSON.stringify({ type: "turn", turn: game.turn, history }));
                    game.player2.send(JSON.stringify({ type: "turn", turn: game.turn, history }));
                }
            }
            else {
                // Move was invalid
                ws.send(JSON.stringify({ type: "error", message: "Invalid move" }));
            }
        }
        // i have to fix this 
        if (data.type === 'playAgain') {
            // console.log("here in the backend the data recieved succesfully", data.type);
            if (game.player1 === ws) {
                game.player2.send(JSON.stringify({ type: "playAgain" }));
            }
            else {
                game.player1.send(JSON.stringify({ type: "playAgain" }));
            }
        }
        //resetting the chessboard
        if (data.type === 'resetState') {
            // console.log("Resetting the game state");
            game.chess.reset();
            game.turn = 'white';
            const newFen = game.chess.fen();
            game.player1.send(JSON.stringify({
                type: "resetState",
                fen: newFen,
                turn: game.turn
            }));
            game.player2.send(JSON.stringify({
                type: "resetState",
                fen: newFen,
                turn: game.turn
            }));
        }
    }
}
exports.GameManager = GameManager;
