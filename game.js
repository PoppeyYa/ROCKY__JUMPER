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

/* ---------- ASSETS ---------- */

const bgImg = new Image();
bgImg.src = "assets/bg.png";

const playerImg = new Image();
playerImg.src = "assets/player.png";

const crystalImg = new Image();
crystalImg.src = "assets/crystal.png";

const music = new Audio("assets/music.mp3");
music.loop = true;
music.volume = 0.4;

/* ---------- GAME STATE ---------- */

let gameRunning = false;
let score = 0;
let speed = 300;
let lastTime = 0;

const GRAVITY = 1500;
const JUMP = -500;

/* ---------- PLAYER ---------- */

const player = {
  x: 250,
  y: BASE_H / 2,
  size: 60,
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
    ctx.drawImage(playerImg, this.x, this.y, this.size, this.size);
  }
};

/* ---------- WALLS ---------- */

class Wall {
  constructor(x) {
    this.x = x;
    this.width = 180;
    this.gap = 260;

    const margin = 100;
    this.gapY = margin + Math.random() * (BASE_H - this.gap - margin * 2);

    this.passed = false;
  }

  update(dt) {
    this.x -= speed * dt;
  }

  draw() {
    ctx.fillStyle = "rgba(255,255,160,0.9)";
    ctx.fillRect(this.x, 0, this.width, this.gapY);
    ctx.fillRect(this.x, this.gapY + this.gap, this.width, BASE_H);
  }
}

/* ---------- CRYSTALS ---------- */

class Crystal {
  constructor(wall) {
    this.x = wall.x + wall.width / 2;
    this.y = wall.gapY + wall.gap / 2;
    this.size = 36;
    this.collected = false;
  }

  update(dt) {
    this.x -= speed * dt;
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

/* ---------- GAME ---------- */

function startGame() {
  score = 0;
  speed = 300;
  gameRunning = true;

  player.reset();
  walls = [];
  crystals = [];

  for (let i = 0; i < 4; i++) {
    spawnWall(BASE_W + i * 450);
  }

  music.currentTime = 0;
  music.play();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function spawnWall(x) {
  const w = new Wall(x);
  walls.push(w);
  crystals.push(new Crystal(w));
}

function loop(time) {
  if (!gameRunning) return;

  const dt = (time - lastTime) / 1000;
  lastTime = time;

  ctx.clearRect(0, 0, BASE_W, BASE_H);
  ctx.drawImage(bgImg, 0, 0, BASE_W, BASE_H);

  player.update(dt);
  player.draw();

  if (player.y < 0 || player.y + player.size > BASE_H) {
    endGame();
    return;
  }

  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    w.update(dt);
    w.draw();

    if (hitWall(player, w)) {
      endGame();
      return;
    }

    if (!w.passed && w.x + w.width < player.x) {
      w.passed = true;
      score++;
      if (score % 5 === 0) speed += 40;
    }
  }

  for (const c of crystals) {
    c.update(dt);
    c.draw();
    if (!c.collected && hitCrystal(player, c)) {
      c.collected = true;
      score++;
    }
  }

  if (walls[0].x + walls[0].width < -200) {
    walls.shift();
    crystals.shift();
    spawnWall(BASE_W + 400);
  }

  drawHUD();

  requestAnimationFrame(loop);
}

/* ---------- COLLISIONS ---------- */

function hitWall(p, w) {
  if (p.x + p.size < w.x || p.x > w.x + w.width) return false;
  if (p.y < w.gapY || p.y + p.size > w.gapY + w.gap) return true;
  return false;
}

function hitCrystal(p, c) {
  const dx = p.x + p.size / 2 - c.x;
  const dy = p.y + p.size / 2 - c.y;
  return Math.hypot(dx, dy) < 45;
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
  music.pause();
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

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  if (gameRunning) player.jump();
}, { passive: false });
