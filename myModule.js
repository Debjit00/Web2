let waitingPlayer = null;
let activeGames = new Map();

function pvpOn(data, ws) {
if (data.type === 'join') {
    ws.username = data.username || 'Anonynomous';

    if (!waitingPlayer) {
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: 'status', message: "Searching for opponent..." }));
    } else {
        // Pair players and start the game
        const player1 = waitingPlayer;
        const player2 = ws;

        activeGames.set(player1, { opponent: player2, number: null, turn: true });
        activeGames.set(player2, { opponent: player1, number: null, turn: false });

        player1.send(JSON.stringify({ type: 'start' }));
        player2.send(JSON.stringify({ type: 'start' }));
        waitingPlayer = null;
    }
}

if (data.type === 'number') {
    const game = activeGames.get(ws);
    if (game) {
        game.number = data.number;
        ws.send(JSON.stringify({ type: 'waiting', message: `You chose ${data.number}. Waiting for opponent...` }));

        const opponentGame = activeGames.get(game.opponent);
        if (opponentGame && opponentGame.number) {
            game.turn = Math.floor(Math.random()*10000)%2 === 0 ? true : false;
            opponentGame.turn = !game.turn;

            ws.send(JSON.stringify({ type: 'start-game', opponentName: game.opponent.username, turn: game.turn }));
            game.opponent.send(JSON.stringify({ type: 'start-game', opponentName: ws.username, turn: opponentGame.turn }));
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

        const { fames, dots } = calculateFamesAndDots(data.guess, game.number);

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

        if (fames === 4) {
            ws.send(JSON.stringify({ type: 'status', message: "win" }));
            opponent.send(JSON.stringify({ type: 'status', message: "loss" }));
            activeGames.delete(ws);
            activeGames.delete(opponent);
            return;
        }
        else {
            game.turn = false;
            opponentGame.turn = true;
            ws.send(JSON.stringify({ type: 'status', message: "Opponent's turn..." }));
            opponent.send(JSON.stringify({ type: 'status', message: "Your turn!" }));
        }        
    }
}}

function pvpOff(ws) {
    console.log('A player disconnected.');
    const game = activeGames.get(ws);
    if (game) {
        game.opponent.send(JSON.stringify({ type: 'status', message: 'Game aborted. Your opponent has left the game.' }));
        activeGames.delete(game.opponent);
        activeGames.delete(ws);
    }
    if (waitingPlayer === ws) {
        waitingPlayer = null;
    }
}

module.exports = {
    pvpOn: pvpOn,
    pvpOff: pvpOff
};