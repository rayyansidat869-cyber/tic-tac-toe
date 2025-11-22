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

  console.log("initBoard called. Building cells...");

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", () => makeMove(i));
    boardDiv.appendChild(cell);
    console.log(`Cell ${i} created`);
  }

  console.log("Board now has", boardDiv.children.length, "cells");
  document.getElementById("status").textContent = "Your turn";
}


// -------------------- GAMEPLAY --------------------

function makeMove(index) {
  if (board[index] || checkWinner()) return;
  board[index] = currentPlayer;
  renderBoard();

  if (checkWinner()) {
    document.getElementById("status").textContent = `${currentPlayer} wins!`;
    if (currentPlayer === "X") {
      trophies++;
      document.getElementById("trophies").textContent = `Trophies: ${trophies} 🏆`;

      // Ask for name only once, then save it
      if (!playerName) {
        playerName = prompt("Enter your name:");
        if (playerName) {
          localStorage.setItem("playerName", playerName);
        }
      }

      if (playerName) {
        saveScore(playerName, trophies);
      }
    }
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  document.getElementById("status").textContent = `${currentPlayer}'s turn`;

  if (currentPlayer === "O") {
    setTimeout(computerMove, 1000);
  }
}

function renderBoard() {
  const cells = document.querySelectorAll(".cell");
  board.forEach((val, i) => {
    cells[i].textContent = val || "";
  });
}

function checkWinner() {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(([a,b,c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
}

function resetGame() {
  currentPlayer = "X";
  initBoard();
}
window.resetGame = resetGame;

// -------------------- COMPUTER AI --------------------

function getDifficulty() {
  return document.getElementById("mode").value;
}

function computerMove() {
  const difficulty = getDifficulty();

  if (difficulty === "easy") {
    randomMove();
  } else if (difficulty === "hard") {
    if (!tryWinOrBlock()) randomMove();
  } else if (difficulty === "impossible") {
    const best = minimax(board, "O").index;
    board[best] = "O";
  }

  renderBoard();

  if (checkWinner()) {
    document.getElementById("status").textContent = "O wins!";
    return;
  }

  currentPlayer = "X";
  document.getElementById("status").textContent = "Your turn";
}

function randomMove() {
  const emptyCells = board
    .map((val, i) => (val === null ? i : null))
    .filter(i => i !== null);
  if (emptyCells.length === 0) return;
  const choice = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[choice] = "O";
}

function tryWinOrBlock() {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let [a,b,c] of wins) {
    if (board[a] === "O" && board[b] === "O" && !board[c]) { board[c] = "O"; return true; }
    if (board[a] === "O" && board[c] === "O" && !board[b]) { board[b] = "O"; return true; }
    if (board[b] === "O" && board[c] === "O" && !board[a]) { board[a] = "O"; return true; }
    if (board[a] === "X" && board[b] === "X" && !board[c]) { board[c] = "O"; return true; }
    if (board[a] === "X" && board[c] === "X" && !board[b]) { board[b] = "O"; return true; }
    if (board[b] === "X" && board[c] === "X" && !board[a]) { board[a] = "O"; return true; }
  }
  return false;
}

function minimax(newBoard, player) {
  const availSpots = newBoard
    .map((val, i) => (val === null ? i : null))
    .filter(i => i !== null);

  if (checkWinnerFor("X", newBoard)) return { score: -10 };
  if (checkWinnerFor("O", newBoard)) return { score: 10 };
  if (availSpots.length === 0) return { score: 0 };

  const moves = [];
  for (let i of availSpots) {
    const move = { index: i };
    newBoard[i] = player;

    if (player === "O") {
      const result = minimax(newBoard, "X");
      move.score = result.score;
    } else {
      const result = minimax(newBoard, "O");
      move.score = result.score;
    }

    newBoard[i] = null;
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -Infinity;
    moves.forEach((m, i) => {
      if (m.score > bestScore) {
        bestScore = m.score;
        bestMove = i;
      }
    });
  } else {
    let bestScore = Infinity;
    moves.forEach((m, i) => {
      if (m.score < bestScore) {
        bestScore = m.score;
        bestMove = i;
      }
    });
  }
  return moves[bestMove];
}

function checkWinnerFor(player, b) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(([a,b,c]) => b[a] === player && b[b] === player && b[c] === player);
}

// -------------------- SUPABASE --------------------

async function saveScore(name, trophies) {
  const { data, error } = await supabase
    .from("leaderboard")
    .upsert([{ name, trophies }], { onConflict: "name" });

  if (error) {
    console.error("Error saving score:", error);
  } else {
    console.log("Score updated in leaderboard!", data);
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
  // Restore name from localStorage if available
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
  } else {
    trophies = 0;
  }

  document.getElementById("trophies").textContent = `Trophies: ${trophies} 🏆`;
}

// -------------------- START GAME --------------------
document.addEventListener("
