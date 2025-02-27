let secretNumber = '';
let attempts = 0;
let gameOver = false;
let playerName = localStorage.getItem('username') || 'Player';
const MAX_ATTEMPTS = 15;

document.addEventListener('DOMContentLoaded', function() {
    // Update profile username
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
        document.getElementById('username').textContent = savedUsername;
    }
    
    // Load game state from localStorage
    loadGameState();
});

// Add event listener for resign button
document.getElementById('resign-btn').addEventListener('click', function() {
    document.getElementById('confirmation-popup').style.display = 'block';
});

// Add event listeners for confirmation popup
document.getElementById('yes-btn').addEventListener('click', function() {
    document.getElementById('confirmation-popup').style.display = 'none';
    resignGame();
});

document.getElementById('no-btn').addEventListener('click', function() {
    document.getElementById('confirmation-popup').style.display = 'none';
});

// Update player name display
document.getElementById('player-name').textContent = playerName;

// Add event listener for Enter key
document.getElementById('player-guess').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        submitGuess();
    }
});

// Generate a random 4-digit number with no repeating digits
function generateSecretNumber() {
    let digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let number = '';
    
    // Shuffle array
    for (let i = digits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    
    // Take first 4 digits
    for (let i = 0; i < 4; i++) {
        number += digits[i];
    }
    
    return number;
}

// Save game state to localStorage
function saveGameState() {
    const gameState = {
        secretNumber: secretNumber,
        attempts: attempts,
        gameOver: gameOver,
        guesses: document.getElementById('player-inputs').innerHTML,
        statusText: document.getElementById('status').textContent,
        secretNumberVisible: document.getElementById('secret-number').style.display,
        secretNumberText: document.getElementById('secret-number').textContent,
        playAgainVisible: document.getElementById('play-again').style.display,
        resultBtnVisible: document.getElementById('result-btn').style.display,
        playerGuessDisabled: document.getElementById('player-guess').disabled
    };
    localStorage.setItem('soloGameState', JSON.stringify(gameState));
}

// Load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem('soloGameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        secretNumber = gameState.secretNumber;
        attempts = gameState.attempts;
        gameOver = gameState.gameOver;
        
        document.getElementById('player-inputs').innerHTML = gameState.guesses;
        document.getElementById('status').textContent = gameState.statusText;
        document.getElementById('secret-number').style.display = gameState.secretNumberVisible;
        document.getElementById('secret-number').textContent = gameState.secretNumberText;
        document.getElementById('play-again').style.display = gameState.playAgainVisible;
        document.getElementById('result-btn').style.display = gameState.resultBtnVisible;
        document.getElementById('player-guess').disabled = gameState.playerGuessDisabled;
    } else {
        initGame();
    }
}

// Initialize game
function initGame() {
    secretNumber = generateSecretNumber();
    attempts = 0;
    gameOver = false;
    document.getElementById('player-inputs').innerHTML = '';
    document.getElementById('status').textContent = 'Try to guess the 4-digit number!';
    document.getElementById('play-again').style.display = 'none';
    document.getElementById('result-btn').style.display = 'none';
    document.getElementById('secret-number').style.display = 'none';
    document.getElementById('secret-number').textContent = '';
    document.getElementById('player-guess').disabled = false;
    console.log("Secret number: " + secretNumber); // For debugging
    saveGameState();
}

// Calculate fames and dots
function calculateResult(guess) {
    let fames = 0;
    let dots = 0;
    
    for (let i = 0; i < 4; i++) {
        if (guess[i] === secretNumber[i]) {
            fames++;
        } else if (secretNumber.includes(guess[i])) {
            dots++;
        }
    }
    
    return { fames, dots };
}

function submitGuess() {
    if (gameOver) {
        alert('Game is over! Click Play Again to start a new game.');
        return;
    }
    
    const guess = document.getElementById('player-guess').value;
    if (!/^[0-9]{4}$/.test(guess) || new Set(guess).size !== 4) {
        alert('Enter a valid 4-digit guess with no repeating digits!');
        return;
    }
    
    attempts++;
    const { fames, dots } = calculateResult(guess);
    addGuess(guess, fames, dots);
    document.getElementById('player-guess').value = '';
    
    if (fames === 4) {
        gameWon();
    } else if (attempts >= MAX_ATTEMPTS) {
        gameLost();
    }
    
    saveGameState();
    // alert("Secret number: " + secretNumber); // For debugging
}

function addGuess(guess, fames, dots) {
    const container = document.getElementById('player-inputs');
    container.innerHTML += `
        <div class='input-group'>
            <span style="padding-left: 30px;">#${attempts}</span>
            <span style="padding-left: 102px;">${guess}</span>
            <span style="padding-left: 58px;">${fames}</span>
            <span style="padding-left: 35px;">${dots}</span>
        </div>`;
    
    // Auto-scroll to the bottom of guesses
    container.scrollTop = container.scrollHeight;
}

function gameWon() {
    gameOver = true;
    document.getElementById('popup-message').innerText = `Congratulations! You guessed the correct number in ${attempts} attempts!`;
    document.getElementById('popup').style.display = 'block';
    document.getElementById('result-btn').style.display = 'block';
    document.getElementById('status').textContent = `You won in ${attempts} attempts!`;
    document.getElementById('play-again').style.display = 'inline-block';
    document.getElementById('player-guess').disabled = true;
    saveGameState();
}

function gameLost() {
    gameOver = true;
    document.getElementById('popup-message').innerText = `Sorry, you've reached the maximum of ${MAX_ATTEMPTS} attempts. The secret number was ${secretNumber}.`;
    document.getElementById('popup').style.display = 'block';
    document.getElementById('result-btn').style.display = 'block';
    document.getElementById('status').textContent = `Game over. You failed to guess the number.`;
    document.getElementById('secret-number').textContent = `The secret number was: ${secretNumber}`;
    document.getElementById('secret-number').style.display = 'block';
    document.getElementById('play-again').style.display = 'inline-block';
    document.getElementById('player-guess').disabled = true;
    saveGameState();
}

function resignGame() {
    if (gameOver) return;
    
    gameOver = true;
    document.getElementById('status').textContent = 'You resigned the game.';
    document.getElementById('secret-number').textContent = `The secret number was: ${secretNumber}`;
    document.getElementById('secret-number').style.display = 'block';
    document.getElementById('play-again').style.display = 'inline-block';
    document.getElementById('player-guess').disabled = true;
    saveGameState();
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

function swap() {
    current = document.getElementById('popup').style.display;
    document.getElementById('popup').style.display = current === 'block' ? 'none' : 'block';
}

function resetGame() {
    initGame();
}

// Automatically save game state when page is about to be unloaded
window.addEventListener('beforeunload', saveGameState);