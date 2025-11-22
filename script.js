// Connect to Supabase (client created in index.html)
const supabase = window.supabaseClient;

// Game state
let board = [];
let currentPlayer = "X";
let trophies = 0;

// Initialize board
function initBoard() {
  board = Array(9).fill(null);
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";
  board.forEach((_, i) => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.addEventListener("click", () => makeMove(i));
    boardDiv.appendChild(cell);
  });
  document.getElementById("status").textContent = "Your turn";
}

// Handle moves
function makeMove(index) {
  if (board[index] || checkWinner()) return;
  board[index] = currentPlayer;
  renderBoard();

  if (checkWinner()) {
    document.getElementById("status").textContent = `${currentPlayer} wins!`;
    if (currentPlayer === "X") {
      trophies++;
      document.getElementById("trophies").textContent = `Trophies: ${trophies} 🏆`;
      saveScore("Player", trophies);
    }
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  document.getElementById("status").textContent = `${currentPlayer}'s turn`;
}

// Render board
function renderBoard() {
  const cells = document.querySelectorAll(".cell");
  board.forEach((val, i) => {
    cells[i].textContent = val || "";
  });
}

// Check winner
function checkWinner() {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diagonals
  ];
  return wins.some(([a,b,c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
}

// Reset game
function resetGame() {
  currentPlayer = "X";
  initBoard();
}

// Reset trophies
function resetTrophies() {
  trophies = 0;
  document.getElementById("trophies").textContent = "Trophies: 0 🏆";
}

// Save score to Supabase
async function saveScore(name, trophies) {
  const { error } = await supabase.from("leaderboard").insert([{ name, trophies }]);
  if (error) console.error("Error saving score:", error);
}

// Load leaderboard
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

// Start game
initBoard();


