let socket = new WebSocket('ws://localhost:3000');
let playerNumber = '';
let isPlayerTurn = false;
let player1Name = localStorage.getItem('username') || 'Anonynomous';
let player2Name = 'Anonynomous';

document.getElementById('game-container').style.display = 'none';

socket.addEventListener('open', () => {
    console.log('Connected to server');
    socket.send(JSON.stringify({ page: 'online', type: 'join', username: player1Name }));
});

socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'start') {
        document.getElementById('status').textContent = 'Game started!';
        document.getElementById('number-setup').style.display = 'block';
    }

    if (data.type === 'waiting') {
        document.getElementById('waiting-message').style.display = 'block';
        document.getElementById('chosen-number').textContent = playerNumber;
    }

    if (data.type === 'start-game') {
        document.getElementById('number-setup').style.display = 'none';
        document.getElementById('game-container').style.display = 'flex';
        isPlayerTurn = data.turn;
        player2Name = data.opponentName || 'Anonynomous';
        document.getElementById('player1-name').textContent = player1Name;
        document.getElementById('player2-name').textContent = player2Name;
        document.getElementById('status').textContent = data.turn ? "Your turn!" : "Opponent's turn..." ;
    }

    if (data.type === 'guess') {
        addGuess(1, data.guess, data.fames, data.dots);
        isPlayerTurn = false;
    }

    if (data.type === 'opponent-guess') {
        addGuess(2, data.guess, data.fames, data.dots);
        isPlayerTurn = true;
    }

    if(data.type === 'status') {
        if(data.message === "win") {
            document.getElementById('popup-message').innerText = `Congratulations! You guessed the correct number and win!`;
            document.getElementById('popup').style.display = 'block';
            document.getElementById('result-btn').style.display = 'block';
        }
        else if(data.message === "loss") {
            document.getElementById('popup-message').innerText = `Your opponent guessed your number. You lost!`;
            document.getElementById('popup').style.display = 'block';
            document.getElementById('result-btn').style.display = 'block';
        }
        else document.getElementById('status').textContent = data.message;
    }
});

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
    socket.send(JSON.stringify({ page: 'online', type: 'number', number: playerNumber }));
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
            <span  style="padding-left: 30px;">#${count}</span>
            <span style="padding-left: 102px;">${guess}</span>
            <span style="padding-left: 58px;">${fames}</span>
            <span style="padding-left: 35px;">${dots}</span>
        </div>`;
}
