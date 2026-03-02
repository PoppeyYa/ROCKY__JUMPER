const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ---------- IMAGES ---------- */

const bgImg = new Image();
bgImg.src = "assets/bg.png";
const playerImg = new Image();
playerImg.src = "assets/player.png";
const crystalImg = new Image();
crystalImg.src = "assets/crystal.png";

/* ---------- AUDIO ---------- */

const music = new Audio("assets/music.mp3");
music.loop = true;
music.volume = 0.4;

/* ---------- GAME STATE ---------- */

let nickname = "Player";
let gameRunning = false;
let speed = 7;
let score = 0;

/* ---------- PLAYER ---------- */

const player = {
  x: 300,
  y: canvas.height / 2,
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
    ctx.drawImage(playerImg, this.x, this.y, this.size, this.size);
  }
};

/* ---------- WALLS ---------- */

let lastGapY = null;

class LightPair {
  constructor(x) {
    this.x = x;
    this.width = 200;
    this.gap = canvas.height * 0.28;

    const minY = 100;
    const maxY = canvas.height - this.gap - 100;

    let newGap = lastGapY === null
      ? minY + Math.random() * (maxY - minY)
      : lastGapY + (Math.random() * 600 - 300);

    newGap = Math.max(minY, Math.min(maxY, newGap));

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
    ctx.fillRect(this.x, this.gapY + this.gap, this.width, canvas.height);
  }
}

/* ---------- CRYSTALS ---------- */

class Crystal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 36;
    this.collected = false;
  }

  update() {
    this.x -= speed;
  }

  draw() {
    if (!this.collected) {
      ctx.drawImage(
        crystalImg,
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size
      );
    }
  }
}

/* ---------- ARRAYS ---------- */

let walls = [];
let crystals = [];

/* ---------- START ---------- */

function startGame() {
  nickname = document.getElementById("nickname").value || "Player";

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("gameover").classList.add("hidden");

  speed = 7;
  score = 0;
  gameRunning = true;

  player.y = canvas.height / 2;
  player.vy = 0;

  walls = [];
  crystals = [];
  lastGapY = null;

  for (let i = 0; i < 4; i++) {
    spawnWall(canvas.width + i * 500);
  }

  music.currentTime = 0;
  music.play();

  requestAnimationFrame(loop);
}

/* ---------- SPAWN ---------- */

function spawnWall(x) {
  const wall = new LightPair(x);
  walls.push(wall);

  const cy = wall.gapY + wall.gap / 2;
  crystals.push(new Crystal(x + wall.width / 2, cy));
}

/* ---------- LOOP ---------- */

function loop() {
  if (!gameRunning) return;

  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  player.update();
  player.draw();

  if (player.y + player.size >= canvas.height || player.y <= 0) {
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

  for (const c of crystals) {
    c.update();
    c.draw();
    if (!c.collected && collect(player, c)) {
      c.collected = true;
      score++;
    }
  }

  if (walls.length && walls[0].x + walls[0].width < -200) {
    walls.shift();
    crystals.shift();
    spawnWall(canvas.width + 400);
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

function collect(p, c) {
  const dx = p.x + p.size / 2 - c.x;
  const dy = p.y + p.size / 2 - c.y;
  return Math.sqrt(dx * dx + dy * dy) < 40;
}

/* ---------- HUD ---------- */

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "32px Arial";
  ctx.fillText(`Score: ${score}`, 30, 50);
}

/* ---------- GAME OVER ---------- */

function endGame() {
  gameRunning = false;
  music.pause();
  saveScore();
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

canvas.addEventListener("touchstart", e => {
  if (!gameRunning) return;
  e.preventDefault();
  player.jump();
}, { passive: false });
