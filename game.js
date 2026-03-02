const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const BASE_W = 1280;
const BASE_H = 720;

let scale = 1;

function resizeCanvas() {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  scale = Math.min(sw / BASE_W, sh / BASE_H);
  canvas.width = BASE_W * scale;
  canvas.height = BASE_H * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ---------- GAME ---------- */

let gameRunning = false;
let score = 0;
let speed = 340;
let lastTime = 0;

/* ---------- PLAYER ---------- */

const GRAVITY = 1800;
const JUMP = -650;

RememberPlayer = {
  x: 240,
  y: BASE_H / 2,
  size: 56,
  vy: 0,

  reset() {
    this.y = BASE_H / 2;
    this.vy = 0;
  },

  jump() {
    this.vy = JUMP;
  },

  update(dt) {
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
  },

  draw() {
    ctx.fillStyle = "#FFD400";
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
};

const player = RememberPlayer;

/* ---------- WALLS ---------- */

const GAP_SIZE = 270;
const WALL_WIDTH = 160;
const WALL_DISTANCE = 520;

class Wall {
  constructor(x) {
    this.x = x;

    const margin = 80;
    this.gapY =
      margin +
      Math.random() * (BASE_H - GAP_SIZE - margin * 2);

    this.topHeight = this.gapY;
    this.bottomY = this.gapY + GAP_SIZE;
    this.bottomHeight = BASE_H - this.bottomY;
    this.passed = false;
  }

  update(dt) {
    this.x -= speed * dt;
  }

  draw() {
    ctx.fillStyle = "rgba(255,255,160,0.95)";
    ctx.fillRect(this.x, 0, WALL_WIDTH, this.topHeight);
    ctx.fillRect(this.x, this.bottomY, WALL_WIDTH, this.bottomHeight);
  }
}

/* ---------- WALL SYSTEM ---------- */

let walls = [];

function resetWalls() {
  walls = [];
  let startX = BASE_W + 300;
  for (let i = 0; i < 4; i++) {
    walls.push(new Wall(startX + i * WALL_DISTANCE));
  }
}

function updateWalls(dt) {
  for (let w of walls) w.update(dt);

  if (walls[0].x + WALL_WIDTH < -200) {
    walls.shift();
    const lastX = walls[walls.length - 1].x;
    walls.push(new Wall(lastX + WALL_DISTANCE));
  }
}

/* ---------- GAME FLOW ---------- */

function startGame() {
  score = 0;
  speed = 340;
  gameRunning = true;
  player.reset();
  resetWalls();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function loop(time) {
  if (!gameRunning) return;

  const dt = (time - lastTime) / 1000;
  lastTime = time;

  ctx.clearRect(0, 0, BASE_W, BASE_H);
  ctx.fillStyle = "#8c5a6d";
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  player.update(dt);

  if (player.y < 0 || player.y + player.size > BASE_H) {
    endGame();
    return;
  }

  updateWalls(dt);

  for (const w of walls) {
    w.draw();

    if (hitWall(player, w)) {
      endGame();
      return;
    }

    if (!w.passed && w.x + WALL_WIDTH < player.x) {
      w.passed = true;
      score++;
      if (score % 6 === 0) speed += 30;
    }
  }

  player.draw();
  drawHUD();

  requestAnimationFrame(loop);
}

/* ---------- COLLISION ---------- */

function hitWall(p, w) {
  if (p.x + p.size < w.x || p.x > w.x + WALL_WIDTH) return false;
  if (p.y < w.gapY || p.y + p.size > w.bottomY) return true;
  return false;
}

/* ---------- HUD ---------- */

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "32px Arial";
  ctx.fillText(`Score: ${score}`, 30, 50);
}

/* ---------- GAME OVER ---------- */

function endGame() {
  gameRunning = false;
  document.getElementById("finalScore").innerText = score;
  document.getElementById("gameover").classList.remove("hidden");
}

/* ---------- CONTROLS ---------- */

document.getElementById("playBtn").onclick = startGame;
document.getElementById("againBtn").onclick = startGame;

window.addEventListener("keydown", e => {
  if (e.code === "Space") player.jump();
});

window.addEventListener("mousedown", () => {
  if (gameRunning) player.jump();
});

canvas.addEventListener(
  "touchstart",
  e => {
    e.preventDefault();
    if (gameRunning) player.jump();
  },
  { passive: false }
);
