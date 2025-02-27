let waitingPlayer = null;
let activeGames = new Map();
let gameIdCounter = 1;
let gameStates = new Map(); // Store game states for reconnection

function pvpOn(data, ws) {
    if (data.type === 'reconnect' && data.gameId) {
        // Try to restore the game state
        const gameState = gameStates.get(data.gameId);
        if (gameState) {
            const { player1, player2, state } = gameState;
            
            // Check which player is reconnecting
            if (player1.username === data.username) {
                activeGames.set(ws, { 
                    opponent: player2, 
                    number: state.player1Number, 
                    turn: state.player1Turn,
                    gameId: data.gameId
                });
                // Update the opponent's connection to point to this new connection
                activeGames.get(player2).opponent = ws;
                player2.send(JSON.stringify({ type: 'status', message: "Your opponent has reconnected." }));
                
                ws.username = data.username;
                ws.send(JSON.stringify({ 
                    type: 'reconnect-state',
                    state: {
                        playerNumber: state.player1Number,
                        isPlayerTurn: state.player1Turn,
                        player1Name: player1.username,
                        player2Name: player2.username,
                        movesMade: state.movesMade,
                        player1Inputs: state.player1Inputs,
                        player2Inputs: state.player2Inputs,
                        gameStage: state.gameStage
                    }
                }));
            } else if (player2.username === data.username) {
                activeGames.set(ws, { 
                    opponent: player1, 
                    number: state.player2Number, 
                    turn: !state.player1Turn,
                    gameId: data.gameId
                });
                // Update the opponent's connection to point to this new connection
                activeGames.get(player1).opponent = ws;
                player1.send(JSON.stringify({ type: 'status', message: "Your opponent has reconnected." }));
                
                ws.username = data.username;
                ws.send(JSON.stringify({ 
                    type: 'reconnect-state',
                    state: {
                        playerNumber: state.player2Number,
                        isPlayerTurn: !state.player1Turn,
                        player1Name: player2.username,
                        player2Name: player1.username,
                        movesMade: state.movesMade,
                        player1Inputs: state.player2Inputs,
                        player2Inputs: state.player1Inputs,
                        gameStage: state.gameStage
                    }
                }));
            }
            
            // Send the gameId to the reconnected client
            ws.send(JSON.stringify({ type: 'gameId', gameId: data.gameId }));
            return;
        }
    }

    if (data.type === 'join') {
        ws.username = data.username || 'Anonymous';

        if (!waitingPlayer) {
            waitingPlayer = ws;
            // ws.send(JSON.stringify({ type: 'status', message: "Searching for opponent" }));
        } else {
            // Pair players and start the game
            const player1 = waitingPlayer;
            const player2 = ws;
            
            // Generate a unique game ID
            const gameId = `game_${gameIdCounter++}`;
            
            activeGames.set(player1, { 
                opponent: player2, 
                number: null, 
                turn: true,
                gameId: gameId
            });
            
            activeGames.set(player2, { 
                opponent: player1, 
                number: null, 
                turn: false,
                gameId: gameId
            });

            // Initialize the game state
            gameStates.set(gameId, {
                player1: player1,
                player2: player2,
                state: {
                    player1Number: null,
                    player2Number: null,
                    player1Turn: true,
                    movesMade: 0,
                    player1Inputs: '',
                    player2Inputs: '',
                    gameStage: 'setup'
                }
            });

            // Send the gameId to both clients
            player1.send(JSON.stringify({ type: 'gameId', gameId: gameId }));
            player2.send(JSON.stringify({ type: 'gameId', gameId: gameId }));

            player1.send(JSON.stringify({ type: 'start' }));
            player2.send(JSON.stringify({ type: 'start' }));
            waitingPlayer = null;
        }
    }

    if (data.type === 'number') {
        const game = activeGames.get(ws);
        if (game) {
            // Store the player's number
            game.number = data.number;
            ws.send(JSON.stringify({ type: 'waiting', message: `You chose ${data.number}. Waiting for opponent...` }));

            // Update game state
            const gameState = gameStates.get(game.gameId);
            if (gameState) {
                if (gameState.player1 === ws) {
                    gameState.state.player1Number = data.number;
                } else {
                    gameState.state.player2Number = data.number;
                }
            }

            const opponent = game.opponent;
            const opponentGame = activeGames.get(opponent);
            
            if (opponentGame && opponentGame.number) {
                // Both players have chosen their numbers, determine turn randomly
                game.turn = Math.floor(Math.random() * 10000) % 2 === 0 ? true : false;
                opponentGame.turn = !game.turn;

                // Update game state
                if (gameState) {
                    gameState.state.player1Turn = gameState.player1 === ws ? game.turn : opponentGame.turn;
                    gameState.state.gameStage = 'playing';
                }

                ws.send(JSON.stringify({ type: 'start-game', opponentName: opponent.username, turn: game.turn }));
                opponent.send(JSON.stringify({ type: 'start-game', opponentName: ws.username, turn: opponentGame.turn }));
            }
        }
    }

    if (data.type === 'guess') {
        const game = activeGames.get(ws);
        if (game && game.turn) {
            const opponent = game.opponent;
            const opponentGame = activeGames.get(opponent);

            function calculateFamesAndDots(guess, opponentNumber) {
                let fames = 0;
                let dots = 0;

                const guessArr = guess.split('');
                const opponentArr = opponentNumber.split('');
                const checked = new Array(opponentArr.length).fill(false);

                // Calculate fames (correct digit & position)
                for (let i = 0; i < guessArr.length; i++) {
                    if (guessArr[i] === opponentArr[i]) {
                        fames++;
                        checked[i] = true;
                    }
                }

                // Calculate dots (correct digit, wrong position)
                for (let i = 0; i < guessArr.length; i++) {
                    if (guessArr[i] !== opponentArr[i]) {
                        const index = opponentArr.findIndex((digit, j) => digit === guessArr[i] && !checked[j]);
                        if (index !== -1) {
                            dots++;
                            checked[index] = true;
                        }
                    }
                }

                return { fames, dots };
            }

            const { fames, dots } = calculateFamesAndDots(data.guess, opponentGame.number);

            // Send the guess result to both players
            ws.send(JSON.stringify({
                type: 'guess',
                player: 1,
                guess: data.guess,
                fames: fames,
                dots: dots
            }));

            opponent.send(JSON.stringify({
                type: 'opponent-guess',
                guess: data.guess,
                fames: fames,
                dots: dots
            }));

            // Update the game state
            const gameState = gameStates.get(game.gameId);
            if (gameState) {
                gameState.state.movesMade++;
                // Update inputs HTML (client needs to send this in their state save)
                if (ws === gameState.player1) {
                    gameState.state.player1Inputs += `
                        <div class='input-group'>
                            <span style="padding-left: 30px;">#${gameState.state.movesMade/2}</span>
                            <span style="padding-left: 102px;">${data.guess}</span>
                            <span style="padding-left: 58px;">${fames}</span>
                            <span style="padding-left: 35px;">${dots}</span>
                        </div>`;
                } else {
                    gameState.state.player2Inputs += `
                        <div class='input-group'>
                            <span style="padding-left: 30px;">#${gameState.state.movesMade/2}</span>
                            <span style="padding-left: 102px;">${data.guess}</span>
                            <span style="padding-left: 58px;">${fames}</span>
                            <span style="padding-left: 35px;">${dots}</span>
                        </div>`;
                }
            }

            if (fames === 4) {
                ws.send(JSON.stringify({ type: 'status', message: "win" }));
                opponent.send(JSON.stringify({ type: 'status', message: "loss" }));
                // Clean up the game
                if (game.gameId) {
                    gameStates.delete(game.gameId);
                }
                activeGames.delete(ws);
                activeGames.delete(opponent);
                return;
            }
            else {
                game.turn = false;
                opponentGame.turn = true;
                
                // Update game state
                if (gameState) {
                    gameState.state.player1Turn = gameState.player1 === ws ? false : true;
                }
                
                ws.send(JSON.stringify({ type: 'status', message: "Opponent's turn..." }));
                opponent.send(JSON.stringify({ type: 'status', message: "Your turn!" }));
            }        
        }
    }

    // Handle the draw offer
    if (data.type === 'draw-offer') {
        const game = activeGames.get(ws);
        if (game) {
            const opponent = game.opponent;
            opponent.send(JSON.stringify({ type: 'draw-offer' }));
        }
    }

    // Handle the draw response
    if (data.type === 'draw-response') {
        const game = activeGames.get(ws);
        if (game) {
            const opponent = game.opponent;
            opponent.send(JSON.stringify({ 
                type: 'draw-response', 
                accepted: data.accept 
            }));
            
            if (data.accept) {
                // Clean up the game on draw accept
                if (game.gameId) {
                    gameStates.delete(game.gameId);
                }
                activeGames.delete(ws);
                activeGames.delete(opponent);
            }
        }
    }

    // Handle resignation
    if (data.type === 'resign') {
        const game = activeGames.get(ws);
        if (game) {
            const opponent = game.opponent;
            opponent.send(JSON.stringify({ type: 'status', message: "resign-win" }));
            
            // Clean up the game
            if (game.gameId) {
                gameStates.delete(game.gameId);
            }
            activeGames.delete(ws);
            activeGames.delete(opponent);
        }
    }
}

function pvpOff(ws) {
    console.log('A player disconnected.');
    const game = activeGames.get(ws);
    
    if (game) {
        const opponent = game.opponent;
        const gameId = game.gameId;
        
        // Start a timeout for disconnection
        ws.disconnectTimeout = setTimeout(() => {
            // If we still have a reference to the opponent, the player hasn't reconnected
            if (opponent && activeGames.get(opponent)) {
                opponent.send(JSON.stringify({ type: 'status', message: "timeout-win" }));
                // Clean up the game
                gameStates.delete(gameId);
                activeGames.delete(opponent);
            }
        }, 10000); // 10 seconds timeout
        
        if (opponent) {
            opponent.send(JSON.stringify({ 
                type: 'status', 
                message: 'Your opponent has disconnected. Waiting 10 seconds for reconnection...' 
            }));
        }
    }
    
    if (waitingPlayer === ws) {
        waitingPlayer = null;
    }
}

module.exports = {
    pvpOn: pvpOn,
    pvpOff: pvpOff
};
