document.addEventListener('DOMContentLoaded', () => {
    initializeInputs();
});

let guessCount = 1;

function initializeInputs() {
    document.getElementById('guess1').value = '0000';
    document.getElementById('fames1').value = '0';
    document.getElementById('dots1').value = '0';
}

function addInput() {
    guessCount++;
    const inputsDiv = document.getElementById('inputs');

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';

    const countLabel = document.createElement('label');
    countLabel.textContent = `#${guessCount}`;

    const guessInput = document.createElement('input');
    guessInput.type = 'number';
    guessInput.className = 'guess';
    guessInput.min = 1000;
    guessInput.max = 9999;
    guessInput.value = '0000';

    const famesInput = document.createElement('input');
    famesInput.type = 'number';
    famesInput.className = 'fames';
    famesInput.min = 0;
    famesInput.max = 4;
    famesInput.value = '0';

    const dotsInput = document.createElement('input');
    dotsInput.type = 'number';
    dotsInput.className = 'dots';
    dotsInput.min = 0;
    dotsInput.max = 4;
    dotsInput.value = '0';

    inputGroup.appendChild(countLabel);
    inputGroup.appendChild(guessInput);
    inputGroup.appendChild(famesInput);
    inputGroup.appendChild(dotsInput);
    inputsDiv.appendChild(inputGroup);
}

function removeInput() {
    if (guessCount > 1) {
        const inputsDiv = document.getElementById('inputs');
        inputsDiv.removeChild(inputsDiv.lastChild);
        guessCount--;
    }
}

function solve() {
    let result = 'Solving with guesses:\n';
    const inputGroups = document.querySelectorAll('.input-group');

    inputGroups.forEach((group, index) => {
        const guess = group.querySelector('.guess').value.padStart(4, '0');
        const fames = group.querySelector('.fames').value;
        const dots = group.querySelector('.dots').value;
        result += `#${index + 1}: Guess = ${guess}, Fames = ${fames}, Dots = ${dots}\n`;
    });

    document.getElementById('result').textContent = result;
}