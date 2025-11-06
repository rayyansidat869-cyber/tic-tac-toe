// ===== Game State =====
let cells = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = true;

// ===== Sounds =====
const clickSound = new Audio('mouse-click-sound.mp3'); // put click.mp3 in your project folder

// ===== Winning Patterns =====
const winPatterns = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

// ===== Render Board =====
function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  cells.forEach((cell, index) => {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'cell';
    cellDiv.textContent = cell;
    if (cell === 'X') cellDiv.style.color = '#00e5ff';
    if (cell === 'O') cellDiv.style.color = '#ff4081';

    // Support both click and touch
    cellDiv.addEventListener('click', () => handleClick(index));
    cellDiv.addEventListener('touchstart', () => handleClick(index));

    board.appendChild(cellDiv);
  });
}

// ===== Handle Player Move =====
function handleClick(index) {
  if (!gameActive || cells[index]) return;

  // Play click sound
  clickSound.currentTime = 0;
  clickSound.play();

  cells[index] = currentPlayer;
  renderBoard();
  if (checkWinner()) return;

  currentPlayer = 'O';
  document.getElementById('status').textContent = "Computer's turn";
  setTimeout(computerMove, 300);
}

// ===== Computer Move =====
function computerMove() {
  if (!gameActive) return;
  const mode = document.getElementById('mode').value;
  let move;

  if (mode === 'easy') {
    const empty = cells.map((v, i) => v === '' ? i : null).filter(v => v !== null);
    move = empty[Math.floor(Math.random() * empty.length)];
  } else if (mode === 'hard') {
    move = getBestMoveLimited(); // depth-limited minimax
  } else {
    move = getBestMove(); // full-depth minimax
  }

  if (move === undefined) return;

  cells[move] = 'O';
  renderBoard();
  if (checkWinner()) return;

  currentPlayer = 'X';
  document.getElementById('status').textContent = "Your turn";
}

// ===== Hard Mode (depth-limited) =====
function getBestMoveLimited() {
  let bestScore = -Infinity;
  let move;
  for (let i = 0; i < 9; i++) {
    if (cells[i] === '') {
      cells[i] = 'O';
      let score = minimax(cells, 0, false, 3); // limit depth to 3
      cells[i] = '';
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

// ===== Impossible Mode (full-depth) =====
function getBestMove() {
  let bestScore = -Infinity;
  let move;
  for (let i = 0; i < 9; i++) {
    if (cells[i] === '') {
      cells[i] = 'O';
      let score = minimax(cells, 0, false);
      cells[i] = '';
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

// ===== Minimax Algorithm =====
function minimax(boardState, depth, isMaximizing, maxDepth = Infinity) {
  const result = evaluate(boardState);
  if (result !== null) return result - depth * Math.sign(result);
  if (depth >= maxDepth) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === '') {
        boardState[i] = 'O';
        best = Math.max(best, minimax(boardState, depth + 1, false, maxDepth));
        boardState[i] = '';
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (boardState[i] === '') {
        boardState[i] = 'X';
        best = Math.min(best, minimax(boardState, depth + 1, true, maxDepth));
        boardState[i] = '';
      }
    }
    return best;
  }
}

// ===== Evaluate Board =====
function evaluate(boardState) {
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      return boardState[a] === 'O' ? 10 : -10;
    }
  }
  if (!boardState.includes('')) return 0;
  return null;
}

// ===== Check Winner =====
function checkWinner() {
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      gameActive = false;
      document.getElementById('status').textContent = `${cells[a]} wins!`;
      return true;
    }
  }
  if (!cells.includes('')) {
    gameActive = false;
    document.getElementById('status').textContent = "It's a draw!";
    return true;
  }
  return false;
}

// ===== Reset Game =====
function resetGame() {
  cells = Array(9).fill('');
  currentPlayer = 'X';
  gameActive = true;
  document.getElementById('status').textContent = "Your turn";
  renderBoard();
}

// ===== Initialize =====
renderBoard();

