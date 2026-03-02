const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ---------- RESIZE ---------- */

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

function resizeCanvas() {
  const scale = Math.min(
    window.innerWidth / BASE_WIDTH,
    window.innerHeight / BASE_HEIGHT
  );

  canvas.width = BASE_WIDTH * scale;
  canvas.height = BASE_HEIGHT * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ---------- GAME STATE ---------- */

let nickname = "Player";
let gameRunning = false;
let speed = 6;
let score = 0;

/* ---------- PLAYER ---------- */

const player = {
  x: 300,
  y: BASE_HEIGHT / 2,
  size: 64,
  vy: 0,

  jump() {
    this.vy = -14;
  },

  update() {
    this.vy += 0.7;
    this.y += this.vy;
  },

  draw() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
};

/* ---------- WALLS ---------- */

const WALL_DISTANCE = 520;

let lastGapY = null;
let wallCounter = 0;

class LightPair {
  constructor(index) {
    this.x = BASE_WIDTH + index * WALL_DISTANCE;
    this.width = 260;
    this.gap = 300;

    const minY = 120;
    const maxY = BASE_HEIGHT - this.gap - 120;

    let newGap;

    if (lastGapY === null) {
      newGap = minY + Math.random() * (maxY - minY);
    } else {
      const shift = (Math.random() * 400 - 200);
      newGap = lastGapY + shift;
      newGap = Math.max(minY, Math.min(maxY, newGap));
    }

    this.gapY = newGap;
    lastGapY = newGap;
    this.passed = false;
  }

  update() {
    this.x -= speed;
  }

  draw() {
    ctx.fillStyle = "rgba(255,255,160,0.9)";
    ctx.fillRect(this.x, 0, this.width, this.gapY);
    ctx.fillRect(
      this.x,
      this.gapY + this.gap,
      this.width,
      BASE_HEIGHT
    );
  }
}

/* ---------- ARRAYS ---------- */

let walls = [];

/* ---------- START ---------- */

function startGame() {
  nickname = document.getElementById("nickname").value || "Player";

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("gameover").classList.add("hidden");

  speed = 6;
  score = 0;
  gameRunning = true;

  player.y = BASE_HEIGHT / 2;
  player.vy = 0;

  walls = [];
  lastGapY = null;
  wallCounter = 0;

  for (let i = 0; i < 4; i++) {
    walls.push(new LightPair(wallCounter++));
  }

  requestAnimationFrame(loop);
}

/* ---------- LOOP ---------- */

function loop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  ctx.fillStyle = "#8c5a6d";
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  player.update();
  player.draw();

  if (player.y + player.size >= BASE_HEIGHT || player.y <= 0) {
    endGame();
    return;
  }

  for (const w of walls) {
    w.update();
    w.draw();

    if (collision(player, w)) {
      endGame();
      return;
    }

    if (!w.passed && w.x + w.width < player.x) {
      w.passed = true;
      score++;
      if (score % 5 === 0) speed += 0.6;
    }
  }

  if (walls[0].x + walls[0].width < -300) {
    walls.shift();
    walls.push(new LightPair(wallCounter++));
  }

  drawHUD();
  requestAnimationFrame(loop);
}

/* ---------- COLLISIONS ---------- */

function collision(p, w) {
  if (p.x + p.size < w.x || p.x > w.x + w.width) return false;
  if (p.y < w.gapY || p.y + p.size > w.gapY + w.gap) return true;
  return false;
}

/* ---------- HUD ---------- */

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "36px Arial";
  ctx.fillText(`Score: ${score}`, 40, 60);
}

/* ---------- GAME OVER ---------- */

function endGame() {
  gameRunning = false;
  document.getElementById("finalScore").innerText =
    `${nickname} — ${score}`;
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
