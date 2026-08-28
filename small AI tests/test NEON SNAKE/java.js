"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("bestScore");
const finalScoreElement = document.getElementById("finalScore");
const statusText = document.getElementById("statusText");
const statusPill = document.querySelector(".status-pill");
const resultMessage = document.getElementById("resultMessage");

const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const soundButton = document.getElementById("soundButton");
const difficultySelect = document.getElementById("difficulty");

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const STORAGE_KEY = "neon-snake-high-score";

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

let snake = [];
let food = { x: 0, y: 0 };
let direction = DIRECTIONS.right;
let nextDirection = DIRECTIONS.right;
let score = 0;
let bestScore = Number(localStorage.getItem(STORAGE_KEY)) || 0;
let loopTimer = null;
let gameState = "ready";
let soundEnabled = true;
let audioContext = null;
let inputLocked = false;

function formatScore(value) {
  return String(value).padStart(3, "0");
}

function updateScoreboard() {
  scoreElement.textContent = formatScore(score);
  bestScoreElement.textContent = formatScore(bestScore);
}

function setStatus(text, stateClass = "") {
  statusText.textContent = text;
  statusPill.classList.remove("paused", "ended");
  if (stateClass) statusPill.classList.add(stateClass);
}

function setupGame() {
  const center = Math.floor(GRID_SIZE / 2);
  snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
    { x: center - 3, y: center }
  ];
  direction = DIRECTIONS.right;
  nextDirection = DIRECTIONS.right;
  score = 0;
  inputLocked = false;
  placeFood();
  updateScoreboard();
  draw();
}

function startGame() {
  clearInterval(loopTimer);
  setupGame();
  gameState = "playing";
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  setStatus("Playing");
  playTone(330, 0.06, "square", 0.035);
  loopTimer = setInterval(gameLoop, Number(difficultySelect.value));
}

function gameLoop() {
  direction = nextDirection;
  inputLocked = false;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const hitWall = head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
  const isEating = head.x === food.x && head.y === food.y;
  const occupiedBody = isEating ? snake : snake.slice(0, -1);
  const hitSelf = occupiedBody.some(segment => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (isEating) {
    score += 10;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(STORAGE_KEY, String(bestScore));
    }
    updateScoreboard();
    placeFood();
    playTone(520 + Math.min(score * 2, 400), 0.045, "sine", 0.045);
  } else {
    snake.pop();
  }

  draw();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function endGame() {
  clearInterval(loopTimer);
  gameState = "ended";
  setStatus("Game over", "ended");
  finalScoreElement.textContent = formatScore(score);

  if (score === 0) {
    resultMessage.textContent = "That wall came out of nowhere. Try again?";
  } else if (score === bestScore && score > 0) {
    resultMessage.textContent = "New personal best. That trail was electric!";
  } else {
    resultMessage.textContent = "Nice run. Ready for another?";
  }

  gameOverOverlay.classList.remove("hidden");
  playCrashSound();
}

function togglePause() {
  if (gameState === "playing") {
    clearInterval(loopTimer);
    gameState = "paused";
    pauseOverlay.classList.remove("hidden");
    setStatus("Paused", "paused");
    playTone(260, 0.05, "square", 0.025);
  } else if (gameState === "paused") {
    gameState = "playing";
    pauseOverlay.classList.add("hidden");
    setStatus("Playing");
    playTone(390, 0.05, "square", 0.025);
    loopTimer = setInterval(gameLoop, Number(difficultySelect.value));
  }
}

function changeDirection(newDirection) {
  if (gameState !== "playing" || inputLocked) return;

  const isOpposite = newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0;
  if (!isOpposite) {
    nextDirection = newDirection;
    inputLocked = true;
  }
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function draw() {
  ctx.fillStyle = "#0b1015";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
  drawVignette();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(143, 177, 157, 0.045)";
  ctx.lineWidth = 1;
  for (let i = 1; i < GRID_SIZE; i += 1) {
    const position = i * CELL_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const padding = index === 0 ? 2.5 : 3.5;
    const x = segment.x * CELL_SIZE + padding;
    const y = segment.y * CELL_SIZE + padding;
    const size = CELL_SIZE - padding * 2;
    const fade = Math.max(0.35, 1 - index / Math.max(snake.length * 1.4, 10));

    ctx.save();
    ctx.shadowColor = index === 0 ? "#6df59c" : "transparent";
    ctx.shadowBlur = index === 0 ? 16 : 0;
    ctx.fillStyle = index === 0
      ? "#88ffb3"
      : `rgba(56, 218, 111, ${fade})`;
    roundedRect(x, y, size, size, index === 0 ? 8 : 6);
    ctx.fill();

    if (index === 0) drawEyes(x, y, size);
    ctx.restore();
  });
}

function drawEyes(x, y, size) {
  const eyeRadius = 1.7;
  let eyes;

  if (direction.x !== 0) {
    const eyeX = direction.x > 0 ? x + size - 6 : x + 6;
    eyes = [
      { x: eyeX, y: y + 7 },
      { x: eyeX, y: y + size - 7 }
    ];
  } else {
    const eyeY = direction.y > 0 ? y + size - 6 : y + 6;
    eyes = [
      { x: x + 7, y: eyeY },
      { x: x + size - 7, y: eyeY }
    ];
  }

  ctx.fillStyle = "#07120b";
  eyes.forEach(eye => {
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFood() {
  const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;
  const pulse = 1 + Math.sin(Date.now() / 180) * 0.08;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = "#ff6577";
  ctx.shadowBlur = 17;
  ctx.fillStyle = "#ff6577";
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd0d5";
  ctx.beginPath();
  ctx.arc(-2.5, -2.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawVignette() {
  const vignette = ctx.createRadialGradient(300, 300, 180, 300, 300, 425);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function playTone(frequency, duration, type = "sine", volume = 0.04) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  } catch (error) {
    soundEnabled = false;
  }
}

function playCrashSound() {
  if (!soundEnabled) return;
  playTone(180, 0.18, "sawtooth", 0.035);
  window.setTimeout(() => playTone(95, 0.22, "sawtooth", 0.03), 80);
}

const keyDirections = {
  ArrowUp: DIRECTIONS.up,
  w: DIRECTIONS.up,
  W: DIRECTIONS.up,
  ArrowDown: DIRECTIONS.down,
  s: DIRECTIONS.down,
  S: DIRECTIONS.down,
  ArrowLeft: DIRECTIONS.left,
  a: DIRECTIONS.left,
  A: DIRECTIONS.left,
  ArrowRight: DIRECTIONS.right,
  d: DIRECTIONS.right,
  D: DIRECTIONS.right
};

document.addEventListener("keydown", event => {
  if (keyDirections[event.key]) {
    event.preventDefault();
    if (gameState === "ready" || gameState === "ended") startGame();
    changeDirection(keyDirections[event.key]);
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (gameState === "ready" || gameState === "ended") startGame();
    else togglePause();
  }

  if (event.key === "r" || event.key === "R") startGame();
});

document.querySelectorAll("[data-direction]").forEach(button => {
  button.addEventListener("pointerdown", () => {
    if (gameState === "ready" || gameState === "ended") startGame();
    changeDirection(DIRECTIONS[button.dataset.direction]);
  });
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.classList.toggle("muted", !soundEnabled);
  soundButton.setAttribute("aria-pressed", String(!soundEnabled));
  soundButton.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Turn sound on");
  if (soundEnabled) playTone(440, 0.06, "sine", 0.035);
});

difficultySelect.addEventListener("change", () => {
  if (gameState === "playing") {
    clearInterval(loopTimer);
    loopTimer = setInterval(gameLoop, Number(difficultySelect.value));
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && gameState === "playing") togglePause();
});

bestScoreElement.textContent = formatScore(bestScore);
setupGame();
