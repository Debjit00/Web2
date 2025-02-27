// const variables = require("./server");
// const WebSocket = require('ws');
// const server = variables.server
// const wss = new WebSocket.Server({ server });

// let waitingPlayer = null;
// let activeGames = new Map();

// wss.on('connection', (ws) => {
//     console.log('A player connected.');
//     ws.username = 'Anonynomous';

//     ws.on('message', (message) => {
//         const data = JSON.parse(message);

//         if (data.type === 'join') {
//             ws.username = data.username || 'Anonynomous';

//             if (!waitingPlayer) {
//                 waitingPlayer = ws;
//                 ws.send(JSON.stringify({ type: 'status', message: 'Waiting for opponent...' }));
//             } else {
//                 // Pair players and start the game
//                 const player1 = waitingPlayer;
//                 const player2 = ws;

//                 activeGames.set(player1, { opponent: player2, number: null, turn: true });
//                 activeGames.set(player2, { opponent: player1, number: null, turn: false });

//                 player1.send(JSON.stringify({ type: 'start' }));
//                 player2.send(JSON.stringify({ type: 'start' }));

//                 // Send usernames to both players
//                 player1.send(JSON.stringify({ type: 'game', opponentName: player2.username, turn: true }));
//                 player2.send(JSON.stringify({ type: 'game', opponentName: player1.username, turn: false }));

//                 waitingPlayer = null;
//             }
//         }

//         if (data.type === 'number') {
//             const game = activeGames.get(ws);
//             if (game) {
//                 game.number = data.number;
//                 ws.send(JSON.stringify({ type: 'waiting', message: `You chose ${data.number}. Waiting for opponent...` }));

//                 const opponentGame = activeGames.get(game.opponent);
//                 if (opponentGame && opponentGame.number) {
//                     // Both players have submitted their numbers — start the game
//                     game.turn = true; // Randomly pick who starts
//                     opponentGame.turn = false;

//                     ws.send(JSON.stringify({ type: 'start-game', opponentName: game.opponent.username, turn: true }));
//                     game.opponent.send(JSON.stringify({ type: 'start-game', opponentName: ws.username, turn: false }));
//                 }
//             }
//         }

//         if (data.type === 'guess') {
//             const game = activeGames.get(ws);
//             // console.log("Guess:\n" + ws + ", opponent = " + game.opponent + ", number = " + game.number + ", turn = " + game.turn);
//             if (game && game.turn) {
//                 const opponent = game.opponent;
//                 const opponentGame = activeGames.get(opponent);

//                 // Calculate fames and dots based on guess and opponent's number
//                 function calculateFamesAndDots(guess, opponentNumber) {
//                     let fames = 0;
//                     let dots = 0;

//                     const guessArr = guess.split('');
//                     const opponentArr = opponentNumber.split('');
//                     const checked = new Array(opponentArr.length).fill(false);

//                     // Calculate fames (correct digit & position)
//                     for (let i = 0; i < guessArr.length; i++) {
//                         if (guessArr[i] === opponentArr[i]) {
//                             fames++;
//                             checked[i] = true;
//                         }
//                     }

//                     // Calculate dots (correct digit, wrong position)
//                     for (let i = 0; i < guessArr.length; i++) {
//                         if (guessArr[i] !== opponentArr[i]) {
//                             const index = opponentArr.findIndex((digit, j) => digit === guessArr[i] && !checked[j]);
//                             if (index !== -1) {
//                                 dots++;
//                                 checked[index] = true;
//                             }
//                         }
//                     }

//                     return { fames, dots };
//                 }

//                 const { fames, dots } = calculateFamesAndDots(data.guess, game.number);

//                 // Send the guess result to both players
//                 ws.send(JSON.stringify({
//                     type: 'guess',
//                     player: 1,
//                     guess: data.guess,
//                     fames: fames,
//                     dots: dots
//                 }));

//                 opponent.send(JSON.stringify({
//                     type: 'opponent-guess',
//                     guess: data.guess
//                 }));

//                 // Check if game ends (4 fames means the guesser wins)
//                 if (fames === 4) {
//                     ws.send(JSON.stringify({ type: 'status', message: 'Congratulations! You guessed the correct number and win!' }));
//                     opponent.send(JSON.stringify({ type: 'status', message: 'Your opponent guessed your number. You lose!' }));
//                     activeGames.delete(ws);
//                     activeGames.delete(opponent);
//                     return;
//                 }

//                 // Switch turns
//                 game.turn = false;
//                 opponentGame.turn = true;

//                 ws.send(JSON.stringify({ type: 'status', message: "Opponent's turn..." }));
//                 opponent.send(JSON.stringify({ type: 'status', message: 'Your turn!' }));
//             }
//         }
//     });

//     ws.on('close', () => {
//         console.log('A player disconnected.');
//         const game = activeGames.get(ws);
//         if (game) {
//             game.opponent.send(JSON.stringify({ type: 'status', message: 'Your opponent has left the game.' }));
//             activeGames.delete(game.opponent);
//             activeGames.delete(ws);
//         }
//         if (waitingPlayer === ws) {
//             waitingPlayer = null;
//         }
//     });
// });