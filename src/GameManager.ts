import WebSocket from 'ws'
import {Chess} from 'chess.js'

interface Game {
    player1: WebSocket; // this will be white
    player2: WebSocket; //this will be black because he is late
    board: string[];
    state: string[];
    chess: Chess;
    turn: string;
}

export class GameManager {

    private games: Game[] = [];
    private pendingUser: WebSocket | null = null;

    addUser(ws: WebSocket) {
        if (this.pendingUser) {
            const chess = new Chess()
            const gameInstance: Game = {
                player1: this.pendingUser,
                player2: ws,
                board: chess.board().flat().map(square => square ? square.type : 'empty'),//representation of empty board 
                chess:chess,
                state: [],
                turn:'white'
            };

            console.log(chess.board())
            gameInstance.player1.send(JSON.stringify({type:"start",turn:'white',yourIdentity:'white',orientation:'white',fen:chess.fen()}))
            gameInstance.player2.send(JSON.stringify({type:"start",turn:'white',yourIdentity:'black',orientation:'black',fen:chess.fen()}))

            this.games.push(gameInstance);
            this.pendingUser = null;
        } else {
            this.pendingUser = ws;
            ws.send(JSON.stringify({type:"pendingUser"}))
        }
    }

    removeUser(ws: WebSocket) {
        if (ws === this.pendingUser) {
            this.pendingUser = null;
        } else {
            const game = this.games.find(game => game.player1 === ws || game.player2 === ws);

            if (game) {
                const opponent = game.player1 === ws ? game.player2 : game.player1;
                opponent.send(JSON.stringify({ type: "opponent disconnected!" }));

                this.games = this.games.filter(item => item !== game);
            }
        }
        console.log("user disconnected")
    }

    gameHandler(ws: WebSocket, message: string) {
        let data = JSON.parse(message);
        const game = this.games.find((game) => game.player1 === ws || game.player2 === ws);
        if (!game) {
            return;
        }
    
        if (data.type === 'move') {
            const move = data.move; // Expecting move in UCI format like 'e2e4'
            const result = game.chess.move(move);

            if (result) {
                // Move was successful, update the board
                game.board = game.chess.board().flat().map(square => square ? square.type : 'empty');

                //this event will be sent to the opponent only
                if(game.player1 === ws){
                    game.player2.send(JSON.stringify({ type: "move", move: result }));
                }else{
                    game.player1.send(JSON.stringify({ type: "move", move: result }));
                } 
    
                // Check if the game is over
                if (game.chess.isGameOver()) {
                    const status = game.chess.isCheckmate() ? 'Checkmate' : 'Stalemate';
                    game.player1.send(JSON.stringify({ type: "gameOver", status }));
                    game.player2.send(JSON.stringify({ type: "gameOver", status }));
                } else {
                    // Update turn
                    game.turn = game.turn === 'white' ? 'black' : 'white';
                    game.player1.send(JSON.stringify({ type: "turn", turn: game.turn }));
                    game.player2.send(JSON.stringify({ type: "turn", turn: game.turn }));
                }
            } else {
                // Move was invalid
               ws.send(JSON.stringify({ type: "error", message: "Invalid move" }));
            }
        }
    }
}
