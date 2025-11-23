// Connect to Supabase
const supabase = window.supabaseClient;

// Game state
let board = [];
let currentPlayer = "X";
let trophies = 0;
let playerName = null;

// -------------------- INIT --------------------

function initBoard() {
  board = Array(9).fill(null);
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", () => makeMove(i));
    boardDiv.appendChild(cell);
  }

  document.getElementById("status").textContent = "Your turn";
}

function renderBoard() {
  const cells = document.querySelectorAll(".cell");
  board.forEach((val, i) => {
    cells[i].textContent = val || "";
  });
}

function resetGame() {
  currentPlayer = "X";
  initBoard();
}
window.resetGame = resetGame;

// -------------------- GAMEPLAY --------------------

function makeMove(index) {
  if (board[index] || checkWinner()) return;

  board[index] = currentPlayer;
  renderBoard();

  const winningCombo = checkWinner();
  if (winningCombo) {
    document.getElementById("status").textContent = `${currentPlayer} wins!`;

    if (currentPlayer === "X") {
      const difficulty = getDifficulty();
      let reward = 0;
      if (difficulty === "easy") reward = 2;
      if (difficulty === "hard") reward = 10;
      if (difficulty === "impossible") reward = 1000;

      trophies += reward;
      document.getElementById("trophies").textContent = `Trophies: ${trophies} 🏆`;

      if (!playerName) {
        playerName = prompt("Enter your name:");
        if (playerName) localStorage.setItem("playerName", playerName);
      }

      if (playerName) saveScore(playerName, trophies);
    }
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  document.getElementById("status").textContent = `${currentPlayer}'s turn`;

  if (currentPlayer === "O") {
    setTimeout(computerMove, 400);
  }
}

function checkWinner() {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return null;
}

// -------------------- COMPUTER AI --------------------

function getDifficulty() {
  const el = document.getElementById("mode");
  return el ? el.value : "easy";
}

function computerMove() {
  const difficulty = getDifficulty();

  if (difficulty === "easy") {
    randomMove();
  } else if (difficulty === "hard") {
    if (!tryWinOrBlock()) randomMove();
  } else if (difficulty === "impossible") {
    const best = minimax(board.slice(), "O"); // use a copy for safety
    if (best && best.index !== null && best.index !== undefined) {
      board[best.index] = "O";
    } else {
      // Fallback if minimax returns nothing
      randomMove();
    }
  }

  renderBoard();

  const winningCombo = checkWinner();
  if (winningCombo) {
    document.getElementById("status").textContent = "O wins!";
    return;
  }

  currentPlayer = "X";
  document.getElementById("status").textContent = "Your turn";
}

function randomMove() {
  const empty = board.map((v, i) => (v === null ? i : null)).filter(i => i !== null);
  if (empty.length === 0) return;
  const choice = empty[Math.floor(Math.random() * empty.length)];
  board[choice] = "O";
}

function tryWinOrBlock() {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let [a,b,c] of wins) {
    // Try to win
    if (board[a] === "O" && board[b] === "O" && !board[c]) { board[c] = "O"; return true; }
    if (board[a] === "O" && board[c] === "O" && !board[b]) { board[b] = "O"; return true; }
    if (board[b] === "O" && board[c] === "O" && !board[a]) { board[a] = "O"; return true; }
    // Block X
    if (board[a] === "X" && board[b] === "X" && !board[c]) { board[c] = "O"; return true; }
    if (board[a] === "X" && board[c] === "X" && !board[b]) { board[b] = "O"; return true; }
    if (board[b] === "X" && board[c] === "X" && !board[a]) { board[a] = "O"; return true; }
  }
  return false;
}

function minimax(state, player) {
  const empty = state.map((v, i) => (v === null ? i : null)).filter(i => i !== null);

  if (checkWinnerFor("X", state)) return { score: -10, index: null };
  if (checkWinnerFor("O", state)) return { score: 10, index: null };
  if (empty.length === 0) return { score: 0, index: null };

  const moves = [];

  for (let i of empty) {
    const move = { index: i };
    state[i] = player;

    const result = minimax(state, player === "O" ? "X" : "O");
    move.score = result.score;

    state[i] = null;
    moves.push(move);
  }

  let bestMoveIndex = 0;

  if (player === "O") {
    let bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) { bestScore = moves[i].score; bestMoveIndex = i; }
    }
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) { bestScore = moves[i].score; bestMoveIndex = i; }
    }
  }

  return moves[bestMoveIndex];
}

function checkWinnerFor(player, boardArr) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(([a, b, c]) =>
    boardArr[a] === player && boardArr[b] === player && boardArr[c] === player
  );
}

// -------------------- SUPABASE --------------------

async function saveScore(name, trophies) {
  const { data, error } = await supabase
    .from("leaderboard")
    .upsert([{ name, trophies }], { onConflict: "name" });

  if (error) {
    console.error("Error saving score:", error);
  } else {
    loadLeaderboard();
  }
}

async function loadLeaderboard() {
  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("trophies", { ascending: false });

  if (error) {
    console.error("Error loading leaderboard:", error);
    list.innerHTML = "<li>Error loading leaderboard</li>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<li>No scores yet</li>";
    return;
  }

  data.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} — ${entry.trophies} 🏆`;
    list.appendChild(li);
  });
}

async function loadPlayerTrophies() {
  if (!playerName) {
    playerName = localStorage.getItem("playerName");
  }

  if (!playerName) {
    trophies = 0;
    document.getElementById("trophies").textContent = `Trophies: ${trophies} 🏆`;
    return;
  }

  const { data, error } = await supabase
    .from("leaderboard")
    .select("trophies")
    .eq("name", playerName)
    .single();

  if (error) {
    console.error("Error loading trophies:", error);
    trophies = 0;
  } else if (data) {
    trophies = data.trophies;
  }

  document.getElementById("trophies").textContent = `Trophies: ${trophies} 🏆`;
}

// -------------------- START GAME --------------------
document.addEventListener("DOMContentLoaded", async () => {
  initBoard();               // build the 9 cells immediately
  await loadPlayerTrophies(); // restore trophies if name exists
  await loadLeaderboard();    // show leaderboard right away
});
