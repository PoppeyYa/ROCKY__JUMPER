const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ---------- RESIZE ---------- */

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ---------- CONFIG ---------- */

const GAME_URL = "PASTE_YOUR_GAME_LINK_HERE";

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
let score = 0;

let lastTime = 0;
let baseSpeed = 260;

/* ---------- PLAYER ---------- */

const player = {
  x: 300,
  y: 0,
  size: 64,
  vy: 0,

  reset() {
    this.y = canvas.height / 2;
    this.vy = 0;
  },

  jump() {
    this.vy = -550;
  },

  update(dt) {
    this.vy += 1800 * dt;
    this.y += this.vy * dt;
  },

  draw() {
    ctx.drawImage(playerImg, this.x, this.y, this.size, this.size);
  }
};

/* ---------- WALL SETTINGS ---------- */

const WALL_DISTANCE = 380;   // плотное расстояние
const WALL_WIDTH = 240;
const GAP_SIZE = 320;

let walls = [];
let crystals = [];

let waveDirection = 1;
let lastGapY = null;

/* ---------- WALL CLASS ---------- */

class LightPair {
  constructor(x) {
    this.x = x;
    this.width = WALL_WIDTH;

    const minY = 120;
    const maxY = canvas.height - GAP_SIZE - 120;

    if (lastGapY === null) {
      this.gapY = canvas.height / 2 - GAP_SIZE / 2;
    } else {
      const waveStep = 160;
      let newY = lastGapY + waveDirection * waveStep;

      if (newY <= minY) {
        newY = minY;
        waveDirection = 1;
      }

      if (newY >= maxY) {
        newY = maxY;
        waveDirection = -1;
      }

      this.gapY = newY;
    }

    lastGapY = this.gapY;
    this.passed = false;
  }

  update(dt) {
    this.x -= baseSpeed * dt;
  }

  draw() {
    ctx.fillStyle = "rgba(255,255,160,0.9)";
    ctx.fillRect(this.x, 0, this.width, this.gapY);
    ctx.fillRect(
      this.x,
      this.gapY + GAP_SIZE,
      this.width,
      canvas.height
    );
  }
}

/* ---------- CRYSTAL ---------- */

class Crystal {
  constructor(wall) {
    this.wall = wall;
    this.size = 36;
    this.collected = false;
  }

  update() {
    this.x = this.wall.x + this.wall.width / 2;
    this.y = this.wall.gapY + GAP_SIZE / 2;
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

/* ---------- SPAWN ---------- */

function spawnWall() {
  let x;

  if (walls.length === 0) {
    x = canvas.width + 200;
  } else {
    const lastWall = walls[walls.length - 1];
    x = lastWall.x + WALL_DISTANCE;
  }

  const wall = new LightPair(x);
  walls.push(wall);
  crystals.push(new Crystal(wall));
}

/* ---------- START ---------- */

function startGame() {
  nickname = document.getElementById("nickname").value || "Player";

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("gameover").classList.add("hidden");

  score = 0;
  gameRunning = true;

  walls = [];
  crystals = [];
  lastGapY = null;
  waveDirection = 1;

  player.reset();

  for (let i = 0; i < 5; i++) {
    spawnWall();
  }

  music.currentTime = 0;
  music.play();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

/* ---------- LOOP ---------- */

function loop(time) {
  if (!gameRunning) return;

  const dt = (time - lastTime) / 1000;
  lastTime = time;

  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  player.update(dt);
  player.draw();

  if (player.y + player.size >= canvas.height || player.y <= 0) {
    endGame();
    return;
  }

  for (let w of walls) {
    w.update(dt);
    w.draw();

    if (collision(player, w)) {
      endGame();
      return;
    }

    if (!w.passed && w.x + w.width < player.x) {
      w.passed = true;
      score++;
    }
  }

  for (let c of crystals) {
    c.update();
    c.draw();

    if (!c.collected && collect(player, c)) {
      c.collected = true;
      score++;
    }
  }

  if (walls.length && walls[0].x + WALL_WIDTH < -100) {
    walls.shift();
    crystals.shift();
    spawnWall();
  }

  drawHUD();
  requestAnimationFrame(loop);
}

/* ---------- COLLISIONS ---------- */

function collision(p, w) {
  if (p.x + p.size < w.x || p.x > w.x + w.width) return false;
  if (p.y < w.gapY || p.y + p.size > w.gapY + GAP_SIZE) return true;
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
  ctx.font = "36px Arial";
  ctx.fillText(`Score: ${score}`, 40, 60);
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

/* ---------- SHARE ---------- */

function share() {
  const text =
`I took part in challenge from @IlGrebenuk for the @Seismic community.
Here's my record: ${score}
Try it here too: ${GAME_URL}`;

  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    "_blank"
  );
}

/* ---------- LEADERBOARD ---------- */

function saveScore() {
  let data = JSON.parse(localStorage.getItem("leaders") || "[]");

  const existing = data.find(d => d.name === nickname);

  if (existing) {
    if (score > existing.score) existing.score = score;
  } else {
    data.push({ name: nickname, score });
  }

  data.sort((a, b) => b.score - a.score);
  data = data.slice(0, 10);

  localStorage.setItem("leaders", JSON.stringify(data));
  renderLeaders();
}

function renderLeaders() {
  let data = JSON.parse(localStorage.getItem("leaders") || "[]");
  document.getElementById("leaders").innerHTML =
    data.map((d, i) => `${i + 1}. ${d.name}: ${d.score}`).join("<br>");
}

/* ---------- CONTROLS ---------- */

document.getElementById("playBtn").onclick = startGame;
document.getElementById("againBtn").onclick = startGame;
document.getElementById("shareBtn").onclick = share;

window.addEventListener("keydown", e => {
  if (e.code === "Space") player.jump();
});

window.addEventListener("mousedown", () => {
  if (gameRunning) player.jump();
});

window.addEventListener("touchstart", e => {
  e.preventDefault();
  if (gameRunning) player.jump();
}, { passive: false });

renderLeaders();
