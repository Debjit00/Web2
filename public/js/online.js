let socket;
let playerNumber = '';
let isPlayerTurn = false;
let player1Name = localStorage.getItem('username') || 'Anonymous';
let player2Name = 'Anonymous';
let gameState = null;
let movesMade = 0;
let reconnectTimeout = null;
let disconnectTimer = null;
let gameId = localStorage.getItem('gameId') || null;
let reconnecting = false;

saveGameState(null);

// Set the profile username
document.getElementById('profile-username').textContent = player1Name;
document.getElementById('game-container').style.display = 'none';

// Function to connect to the WebSocket server
function connectToServer() {
    // socket = new WebSocket('ws://localhost:3000');
    const serverUrl = `wss:${myNgrok()}`;
    socket = new WebSocket(serverUrl);
    
    socket.addEventListener('open', () => {
        console.log('Connected to server');
        document.getElementById('reconnect-warning').style.display = 'none';
        clearTimeout(reconnectTimeout);
        
        if (reconnecting && gameId) {
            // Reconnect to the same game
            socket.send(JSON.stringify({
                page: 'online',
                type: 'reconnect',
                gameId: gameId,
                username: player1Name
            }));
            reconnecting = false;
        } else {
            // New connection
            socket.send(JSON.stringify({
                page: 'online',
                type: 'join',
                username: player1Name
            }));
        }
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'gameId') {
            gameId = data.gameId;
            localStorage.setItem('gameId', gameId);
        }

        if (data.type === 'reconnect-state') {
            // Restore game state from server
            restoreGameState(data.state);
        }

        if (data.type === 'start') {
            document.getElementById('status').textContent = 'Game started!';
            document.getElementById('number-setup').style.display = 'block';
            document.getElementById('animation_status').style.display = 'none';
        }

        if (data.type === 'waiting') {
            document.getElementById('waiting-message').style.display = 'block';
            document.getElementById('chosen-number').textContent = playerNumber;
        }

        if (data.type === 'start-game') {
            document.getElementById('number-setup').style.display = 'none';
            document.getElementById('game-container').style.display = 'flex';
            isPlayerTurn = data.turn;
            player2Name = data.opponentName || 'Anonymous';
            document.getElementById('player1-name').textContent = player1Name;
            document.getElementById('player2-name').textContent = player2Name;
            document.getElementById('status').textContent = data.turn ? "Your turn!" : "Opponent's turn...";
        }

        if (data.type === 'guess') {
            addGuess(1, data.guess, data.fames, data.dots);
            isPlayerTurn = false;
            movesMade++;
            
            // Show game actions after both players have made at least one move
            if (movesMade >= 2) {
                document.getElementById('game-actions').style.display = 'block';
            }
        }

        if (data.type === 'opponent-guess') {
            addGuess(2, data.guess, data.fames, data.dots);
            isPlayerTurn = true;
            movesMade++;
            
            // Show game actions after both players have made at least one move
            if (movesMade >= 2) {
                document.getElementById('game-actions').style.display = 'block';
            }
        }

        if (data.type === 'draw-offer') {
            document.getElementById('draw-offer').style.display = 'block';
        }

        if (data.type === 'draw-response') {
            if (data.accepted) {
                document.getElementById('popup-message').innerText = `Draw agreed! The game ends in a tie.`;
                document.getElementById('popup').style.display = 'block';
                document.getElementById('result-btn').style.display = 'block';
                document.getElementById('game-actions').style.display = 'none';
                saveGameState(null); // Clear saved game
            } else {
                document.getElementById('status').textContent = "Draw offer rejected. Game continues.";
            }
        }

        if (data.type === 'status') {
            if (data.message === "win") {
                document.getElementById('popup-message').innerText = `Congratulations! You guessed the correct number and win!`;
                document.getElementById('popup').style.display = 'block';
                document.getElementById('result-btn').style.display = 'block';
                document.getElementById('game-actions').style.display = 'none';
                saveGameState(null); // Clear saved game
            }
            else if (data.message === "loss") {
                document.getElementById('popup-message').innerText = `Your opponent guessed your number. You lost!`;
                document.getElementById('popup').style.display = 'block';
                document.getElementById('result-btn').style.display = 'block';
                document.getElementById('game-actions').style.display = 'none';
                saveGameState(null); // Clear saved game
            }
            else if (data.message === "resign-win") {
                document.getElementById('popup-message').innerText = `Your opponent has resigned. You win!`;
                document.getElementById('popup').style.display = 'block';
                document.getElementById('result-btn').style.display = 'block';
                document.getElementById('game-actions').style.display = 'none';
                saveGameState(null); // Clear saved game
            }
            else if (data.message === "timeout-win") {
                document.getElementById('popup-message').innerText = `Your opponent disconnected. You win!`;
                document.getElementById('popup').style.display = 'block';
                document.getElementById('result-btn').style.display = 'block';
                document.getElementById('game-actions').style.display = 'none';
                saveGameState(null); // Clear saved game
            }
            else document.getElementById('status').textContent = data.message;
        }
        
        // Save current game state
        saveGameState({
            playerNumber: playerNumber,
            isPlayerTurn: isPlayerTurn,
            player1Name: player1Name,
            player2Name: player2Name,
            movesMade: movesMade,
            player1Inputs: document.getElementById('player1-inputs').innerHTML,
            player2Inputs: document.getElementById('player2-inputs').innerHTML,
            gameStage: document.getElementById('game-container').style.display === 'flex' ? 'playing' : 
                       document.getElementById('number-setup').style.display === 'block' ? 'setup' : 'waiting'
        });
    });

    socket.addEventListener('close', () => {
        console.log('Connection closed, attempting to reconnect...');
        startReconnectCountdown();
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        startReconnectCountdown();
    });
}

function startReconnectCountdown() {
    // If we're already reconnecting, don't start another countdown
    if (reconnecting) return;
    
    reconnecting = true;
    const reconnectWarning = document.getElementById('reconnect-warning');
    const countdown = document.getElementById('countdown');
    reconnectWarning.style.display = 'block';
    
    let seconds = 10;
    countdown.textContent = seconds;
    
    disconnectTimer = setInterval(() => {
        seconds--;
        countdown.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(disconnectTimer);
            reconnectToServer();
        }
    }, 1000);
}

function reconnectToServer() {
    connectToServer();
}

function saveGameState(state) {
    if (state) {
        localStorage.setItem('gameState', JSON.stringify(state));
    } else {
        localStorage.removeItem('gameState');
        localStorage.removeItem('gameId');
    }
}

function restoreGameState(state) {
    if (!state) return;
    
    playerNumber = state.playerNumber;
    isPlayerTurn = state.isPlayerTurn;
    player1Name = state.player1Name;
    player2Name = state.player2Name;
    movesMade = state.movesMade;
    
    document.getElementById('player1-name').textContent = player1Name;
    document.getElementById('player2-name').textContent = player2Name;
    document.getElementById('player1-inputs').innerHTML = state.player1Inputs;
    document.getElementById('player2-inputs').innerHTML = state.player2Inputs;
    
    if (state.gameStage === 'playing') {
        document.getElementById('number-setup').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        document.getElementById('status').textContent = isPlayerTurn ? "Your turn!" : "Opponent's turn...";
        
        if (movesMade >= 2) {
            document.getElementById('game-actions').style.display = 'block';
        }
    } else if (state.gameStage === 'setup') {
        document.getElementById('number-setup').style.display = 'block';
        document.getElementById('animation_status').style.display = 'none';
    }
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

function swap() {
    current = document.getElementById('popup').style.display;
    document.getElementById('popup').style.display = current === 'block' ? 'none' : 'block';
}

function submitNumber() {
    playerNumber = document.getElementById('player-number').value;
    if (!/^[0-9]{4}$/.test(playerNumber) || new Set(playerNumber).size !== 4) {
        alert('Enter a valid 4-digit number with no repeating digits!');
        return;
    }
    try{
        socket.send(JSON.stringify({ page: 'online', type: 'number', number: playerNumber }));
    }catch(e){
        alert(e);
    }
    document.getElementById('waiting-message').style.display = 'block';
    document.getElementById('chosen-number').textContent = playerNumber;
}

function submitGuess(player) {
    if (!isPlayerTurn) {
        alert('Wait for your turn!');
        return;
    }
    const guess = document.getElementById(`player${player}-guess`).value;
    if (!/^[0-9]{4}$/.test(guess) || new Set(guess).size !== 4) {
        alert('Enter a valid 4-digit guess!');
        return;
    }
    socket.send(JSON.stringify({ page: 'online', type: 'guess', player: player, guess: guess }));
    document.getElementById(`player${player}-guess`).value = '';
}

function addGuess(player, guess, fames, dots) {
    const container = document.getElementById(`player${player}-inputs`);
    const count = container.children.length + 1;
    container.innerHTML += `
        <div class='input-group'>
            <span style="padding-left: 30px;">#${count}</span>
            <span style="padding-left: 102px;">${guess}</span>
            <span style="padding-left: 58px;">${fames}</span>
            <span style="padding-left: 35px;">${dots}</span>
        </div>`;
}

function showResignConfirm() {
    document.getElementById('confirm-popup').style.display = 'block';
}

function confirmResign(confirmed) {
    document.getElementById('confirm-popup').style.display = 'none';
    if (confirmed) {
        socket.send(JSON.stringify({ page: 'online', type: 'resign' }));
        document.getElementById('popup-message').innerText = `You have resigned. Game Over!`;
        document.getElementById('popup').style.display = 'block';
        document.getElementById('result-btn').style.display = 'block';
        document.getElementById('game-actions').style.display = 'none';
        saveGameState(null); // Clear saved game
    }
}

function offerDraw() {
    socket.send(JSON.stringify({ page: 'online', type: 'draw-offer' }));
    document.getElementById('status').textContent = "Draw offered. Waiting for opponent response...";
}

function respondToDraw(accept) {
    document.getElementById('draw-offer').style.display = 'none';
    socket.send(JSON.stringify({ page: 'online', type: 'draw-response', accept: accept }));
    
    if (accept) {
        document.getElementById('popup-message').innerText = `Draw accepted! The game ends in a tie.`;
        document.getElementById('popup').style.display = 'block';
        document.getElementById('result-btn').style.display = 'block';
        document.getElementById('game-actions').style.display = 'none';
        saveGameState(null); // Clear saved game
    }
}

// Check for saved game state on page load
window.onload = function() {
    const savedState = localStorage.getItem('gameState');
    // alert(`Saved State = ${savedState}`)
    // alert(`state = ${localStorage.getItem('state')}`)
    if (savedState && localStorage.getItem('gameId')) {
        alert(`Saved game running, ${gameId}`);
        gameState = JSON.parse(savedState);
        reconnecting = true;
    }
    connectToServer();
};

// Handle Enter key for input fields
document.getElementById('player-number').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        submitNumber();
    }
});

document.getElementById('player1-guess').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        submitGuess(1);
    }
});
