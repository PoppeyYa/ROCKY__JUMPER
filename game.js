const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ---------- CONFIG ---------- */

const GAME_URL = "https://poppeyya.github.io/ROCKY__JUMPER/";

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
let speed = 6;
let score = 0;

let lastTime = 0;

/* ---------- PLAYER ---------- */

const player = {
  x: 300,
  y: canvas.height / 2,
  size: 64,
  vy: 0,

  jump() {
    this.vy = -14;
  },

  update(dt) {
    this.vy += 0.7 * dt;
    this.y += this.vy * dt;
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
    this.width = 260;
    this.gap = 300;

    const minY = 120;
    const maxY = canvas.height - this.gap - 120;

    let newGap;

    if (lastGapY === null) {
      newGap = minY + Math.random() * (maxY - minY);
    } else {
      const direction = Math.random() < 0.5 ? -1 : 1;
      const minShift = 220;
      const maxShift = 480;

      let shift = direction * (minShift + Math.random() * (maxShift - minShift));
      newGap = lastGapY + shift;

      newGap = Math.max(minY, Math.min(maxY, newGap));
    }

    this.gapY = newGap;
    lastGapY = newGap;
    this.passed = false;
  }

  update(dt) {
    this.x -= speed * dt;
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

/* ---------- START ---------- */

function startGame() {
  nickname = document.getElementById("nickname").value || "Player";

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("gameover").classList.add("hidden");

  speed = 6;
  score = 0;
  gameRunning = true;

  player.y = canvas.height / 2;
  player.vy = 0;

  walls = [];
  crystals = [];
  lastGapY = null;

  for (let i = 0; i < 4; i++) {
    spawnWall(canvas.width + i * 600);
  }

  music.currentTime = 0;
  music.play();

  lastTime = performance.now();
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

function loop(time) {
  if (!gameRunning) return;

  const dt = (time - lastTime) / 16.666;
  lastTime = time;

  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  player.update(dt);
  player.draw();

  if (player.y + player.size >= canvas.height || player.y <= 0) {
    endGame();
    return;
  }

  for (const w of walls) {
    w.update(dt);
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
    c.update(dt);
    c.draw();
    if (!c.collected && collect(player, c)) {
      c.collected = true;
      score++;
    }
  }

  if (walls.length && walls[0].x + walls[0].width < -100) {
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
`I took part in @IlGrebenuk's challenge for the @Seismic community.
Here's my record: ${score}
Try it here too: https://poppeya.github.io/ROCKY_JUMPER/`;

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

window.addEventListener("mousedown", () => player.jump());

canvas.addEventListener("touchstart", e => {
  if (!gameRunning) return;
  e.preventDefault();
  player.jump();
}, { passive: false });

renderLeaders();
