import {
  clamp,
  clampInt,
  ghostPoint,
  hitsEcho,
  pickSpawn,
  resolvePurchase,
  safeJson,
  sanitizeUnlocks,
  sealPath,
  takeOverlaps,
} from './logic.js';

const CATALOG = [
  { id: '#00f0ff', name: 'Cyan', price: 0 },
  { id: '#ff0055', name: 'Magenta', price: 50 },
  { id: '#00ff66', name: 'Matrix', price: 100 },
  { id: '#ffbb00', name: 'Gold', price: 150 },
];

const STORAGE = {
  coins: 'echo_coins',
  color: 'echo_color',
  colors: 'echo_colors',
  bestScore: 'echo_best_score',
  bestRound: 'echo_best_round',
  games: 'echo_games',
};

const STEP = 1000 / 60;
const SHIELD_FRAMES = 300;
const ROUND_GRACE = 75;
const SHIELD_END_GRACE = 24;
const COIN_BONUS = 5;
const COIN_SCORE = 25;
const KEY_CODES = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyA',
  'KeyD',
  'KeyW',
  'KeyS',
]);

const AudioEngine = {
  ctx: null,
  unlock() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!this.ctx) this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  },
  play(freq, type, duration) {
    try {
      this.unlock();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + duration);
    } catch {
      /* sound is optional */
    }
  },
  coin() { this.play(587.33, 'sine', 0.15); },
  hit() { this.play(120, 'sawtooth', 0.4); },
  powerup() { this.play(880, 'triangle', 0.3); },
  deny() { this.play(180, 'square', 0.08); },
  round() {
    this.play(523.25, 'triangle', 0.12);
    window.setTimeout(() => this.play(659.25, 'triangle', 0.16), 90);
  },
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const view = { w: 480, h: 800, dpr: 1 };

let gameState = 'MENU';
let score = 0;
let coins = 0;
let currentRound = 1;
let activeColor = CATALOG[0].id;
let unlockedColors = [CATALOG[0].id];
let bestScore = 0;
let bestRound = 0;
let gamesPlayed = 0;

const player = { x: 240, y: 400, radius: 14, targetX: 240, targetY: 400, vx: 0, vy: 0 };
let echoes = [];
let currentPath = [];
let collectibles = [];
let powerups = [];
let particles = [];
let activePowerup = null;
let powerupTimer = 0;
let grace = 0;
let roundFrame = 0;
let skipFrameTick = false;
let bannerText = '';
let bannerTimer = 0;
let shake = 0;
let isDragging = false;
let toastTimer = 0;
let lastTime = 0;
let accumulator = 0;

const keys = new Set();
const hudCache = new Map();

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage can be blocked */
  }
}

function loadSave() {
  const ids = CATALOG.map((item) => item.id);
  coins = clampInt(storageGet(STORAGE.coins), 0);
  unlockedColors = sanitizeUnlocks(safeJson(storageGet(STORAGE.colors), [ids[0]]), ids);
  const savedColor = storageGet(STORAGE.color);
  activeColor = unlockedColors.includes(savedColor) ? savedColor : unlockedColors[0];
  bestScore = clampInt(storageGet(STORAGE.bestScore), 0);
  bestRound = clampInt(storageGet(STORAGE.bestRound), 0);
  gamesPlayed = clampInt(storageGet(STORAGE.games), 0);
}

function saveAll() {
  storageSet(STORAGE.coins, coins);
  storageSet(STORAGE.color, activeColor);
  storageSet(STORAGE.colors, JSON.stringify(unlockedColors));
  storageSet(STORAGE.bestScore, bestScore);
  storageSet(STORAGE.bestRound, bestRound);
  storageSet(STORAGE.games, gamesPlayed);
}

function resizeCanvas() {
  const parent = canvas.parentElement;
  if (!parent) return;
  view.w = parent.clientWidth;
  view.h = parent.clientHeight;
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(view.w * view.dpr));
  canvas.height = Math.max(1, Math.round(view.h * view.dpr));
}

function clampToField(value, min, max) {
  if (max < min) return (min + max) / 2;
  return clamp(value, min, max);
}

function setMode(mode) {
  gameState = mode;
  document.getElementById('game-container').dataset.state = mode;
}

function hideScreens() {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.add('hidden');
    screen.inert = true;
  });
}

function showScreen(id) {
  hideScreens();
  const screen = document.getElementById(id);
  screen.classList.remove('hidden');
  screen.inert = false;
}

function setText(id, value) {
  const next = String(value);
  if (hudCache.get(id) === next) return;
  hudCache.set(id, next);
  const el = document.getElementById(id);
  if (el) el.textContent = next;
}

function syncHUD() {
  setText('score-val', score);
  setText('round-val', currentRound);
  setText('coins-val', coins);
  setText('wallet-val', coins);
  const status = activePowerup === 'SHIELD'
    ? `Shield ${Math.ceil(powerupTimer / 60)}s`
    : 'None';
  setText('powerup-status', status);
}

function syncMenu() {
  setText(
    'menu-best',
    bestScore > 0 ? `Best: ${bestScore} pts · Round ${bestRound}` : 'No record yet',
  );
}

function renderProfile() {
  const root = document.getElementById('profile-stats');
  root.replaceChildren();
  const rows = [
    ['Coins', coins],
    ['Best score', bestScore],
    ['Best round', bestRound],
    ['Runs', gamesPlayed],
  ];
  for (const [label, value] of rows) {
    const row = document.createElement('div');
    row.className = 'stat-row';
    const name = document.createElement('span');
    name.textContent = label;
    const number = document.createElement('strong');
    number.textContent = String(value);
    row.append(name, number);
    root.append(row);
  }
}

function renderShop() {
  syncHUD();
  renderProfile();
  const container = document.getElementById('color-shop');
  container.replaceChildren();

  for (const item of CATALOG) {
    const unlocked = unlockedColors.includes(item.id);
    const selected = activeColor === item.id;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `shop-item${selected ? ' selected' : ''}`;
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');

    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = item.id;

    const name = document.createElement('span');
    name.className = 'shop-name';
    name.textContent = item.name;

    const meta = document.createElement('span');
    meta.className = 'shop-meta';
    meta.textContent = selected ? 'Equipped' : unlocked ? 'Owned' : `${item.price} coins`;

    button.append(swatch, name, meta);
    button.addEventListener('click', () => buyColor(item));
    container.append(button);
  }
}

function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden', 'false');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
  }, 1500);
}

function announce(message) {
  document.getElementById('live').textContent = message;
}

function fieldBounds() {
  return {
    minX: 28,
    maxX: Math.max(48, view.w - 28),
    minY: 78,
    maxY: Math.max(98, view.h - 40),
  };
}

function spawnBlockers() {
  const blockers = [{ x: player.x, y: player.y, minDist: 110 }];
  for (const coin of collectibles) blockers.push({ x: coin.x, y: coin.y, minDist: 56 });
  for (const power of powerups) blockers.push({ x: power.x, y: power.y, minDist: 64 });
  for (const echo of echoes) {
    const ghost = ghostPoint(echo, roundFrame);
    if (ghost) blockers.push({ x: ghost.x, y: ghost.y, minDist: 72 });
  }
  return blockers;
}

function spawnPoint() {
  const point = pickSpawn(Math.random, fieldBounds(), spawnBlockers());
  if (Math.hypot(point.x - player.x, point.y - player.y) >= 80) return point;
  return {
    x: point.x < view.w / 2 ? 36 : view.w - 36,
    y: clamp(point.y, 90, Math.max(100, view.h - 50)),
  };
}

function spawnCollectibles() {
  collectibles = [];
  for (let i = 0; i < 3; i += 1) {
    const point = spawnPoint();
    collectibles.push({ x: point.x, y: point.y, radius: 8 });
  }
  if (powerups.length < 2 && Math.random() < 0.4) {
    const point = spawnPoint();
    powerups.push({
      x: point.x,
      y: point.y,
      type: Math.random() < 0.5 ? 'SHIELD' : 'COIN',
    });
  }
}

function burst(x, y, color) {
  for (let i = 0; i < 8; i += 1) {
    if (particles.length > 80) particles.shift();
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 2.2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 18 + Math.floor(Math.random() * 8),
      color,
    });
  }
}

function startGame() {
  hideScreens();
  setMode('PLAYING');
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

  score = 0;
  currentRound = 1;
  echoes = [];
  currentPath = [];
  powerups = [];
  particles = [];
  activePowerup = null;
  powerupTimer = 0;
  grace = 0;
  roundFrame = 0;
  skipFrameTick = false;
  shake = 0;
  bannerText = '';
  bannerTimer = 0;
  gamesPlayed += 1;

  resizeCanvas();
  player.x = view.w / 2;
  player.y = view.h / 2;
  player.targetX = player.x;
  player.targetY = player.y;
  spawnCollectibles();
  saveAll();
  syncHUD();
  announce('Round 1');
  AudioEngine.unlock();
}

function returnToMenu() {
  setMode('MENU');
  showScreen('main-menu');
  syncMenu();
}

function openShop() {
  setMode('MENU');
  showScreen('shop-screen');
  renderShop();
}

function closeShop() {
  showScreen('main-menu');
  syncMenu();
}

function buyColor(item) {
  const result = resolvePurchase(
    { coins, unlocked: unlockedColors, active: activeColor },
    item,
  );
  if (result.status === 'broke') {
    AudioEngine.deny();
    showToast('Not enough coins');
    return;
  }

  coins = result.coins;
  unlockedColors = result.unlocked;
  activeColor = result.active;
  saveAll();
  if (result.status === 'bought') {
    AudioEngine.coin();
    showToast(`${item.name} unlocked`);
  }
  renderShop();
}

function advanceRound() {
  const next = sealPath(echoes, currentPath, currentRound);
  echoes = next.echoes;
  currentPath = [];
  currentRound = next.round;
  roundFrame = next.frame;
  skipFrameTick = true;
  grace = ROUND_GRACE;
  bannerText = `Round ${currentRound}`;
  bannerTimer = 110;
  AudioEngine.round();
  spawnCollectibles();
  announce(bannerText);
}

function applyPowerup(power) {
  burst(power.x, power.y, power.type === 'SHIELD' ? '#00f0ff' : '#ffbb00');
  if (power.type === 'SHIELD') {
    activePowerup = 'SHIELD';
    powerupTimer = SHIELD_FRAMES;
    AudioEngine.powerup();
    return;
  }

  coins += COIN_BONUS;
  score += COIN_SCORE;
  saveAll();
  AudioEngine.coin();
  showToast(`Bonus +${COIN_BONUS} coins`);
}

function collectCoins() {
  const hit = takeOverlaps(
    collectibles,
    player.x,
    player.y,
    (coin) => player.radius + coin.radius,
  );
  if (!hit.taken.length) return;

  collectibles = hit.kept;
  score += 10 * hit.taken.length;
  coins += hit.taken.length;
  for (const coin of hit.taken) burst(coin.x, coin.y, '#ffbb00');
  AudioEngine.coin();
  saveAll();
  if (collectibles.length === 0) advanceRound();
}

function collectPowerups() {
  const hit = takeOverlaps(powerups, player.x, player.y, player.radius + 12);
  if (!hit.taken.length) return;
  powerups = hit.kept;
  for (const power of hit.taken) applyPowerup(power);
}

function movePlayer() {
  if (!isDragging) {
    let dx = 0;
    let dy = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1;
    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      const lead = 8 / 0.2;
      player.targetX = player.x + (dx / length) * lead;
      player.targetY = player.y + (dy / length) * lead;
    }
  }

  const previousX = player.x;
  const previousY = player.y;
  player.x += (player.targetX - player.x) * 0.2;
  player.y += (player.targetY - player.y) * 0.2;
  player.x = clampToField(player.x, player.radius, view.w - player.radius);
  player.y = clampToField(player.y, player.radius, view.h - player.radius);
  player.targetX = clampToField(player.targetX, player.radius, view.w - player.radius);
  player.targetY = clampToField(player.targetY, player.radius, view.h - player.radius);
  player.vx = player.x - previousX;
  player.vy = player.y - previousY;
  if (player.vx * player.vx + player.vy * player.vy > 0.8 && particles.length < 70 && Math.random() < 0.45) {
    particles.push({
      x: player.x - player.vx * 2,
      y: player.y - player.vy * 2,
      vx: -player.vx * 0.15 + (Math.random() - 0.5) * 0.4,
      vy: -player.vy * 0.15 - 0.25,
      life: 14,
      color: activeColor,
    });
  }
}

function stepParticles() {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;
    if (particle.life <= 0) particles.splice(i, 1);
  }
}

function tickShield() {
  if (powerupTimer <= 0) return;
  powerupTimer -= 1;
  if (powerupTimer === 0) {
    activePowerup = null;
    grace = Math.max(grace, SHIELD_END_GRACE);
  }
}

function update() {
  if (gameState !== 'PLAYING') return;

  movePlayer();
  currentPath.push({ x: player.x, y: player.y });
  collectCoins();
  collectPowerups();
  tickShield();
  stepParticles();

  const vulnerable = grace <= 0 && activePowerup !== 'SHIELD';
  if (hitsEcho(player, echoes, roundFrame, player.radius * 2 - 8, vulnerable)) {
    gameOver();
    return;
  }

  if (grace > 0) grace -= 1;
  if (bannerTimer > 0) bannerTimer -= 1;
  if (skipFrameTick) skipFrameTick = false;
  else roundFrame += 1;
  syncHUD();
}

function gameOver() {
  AudioEngine.hit();
  shake = 14;
  const hadRecord = bestScore > 0 || bestRound > 0;
  const scoreRecord = score > bestScore;
  const roundRecord = currentRound > bestRound;
  if (scoreRecord) bestScore = score;
  if (roundRecord) bestRound = currentRound;
  saveAll();
  syncHUD();
  syncMenu();

  const celebrate = hadRecord && (scoreRecord || roundRecord) ? ' · New record!' : '';
  const summary = `Round ${currentRound} · ${score} pts${celebrate}`;
  setText('final-stats', summary);
  setText('final-best', `Best: ${bestScore} pts · Round ${bestRound}`);
  setMode('GAMEOVER');
  showScreen('game-over-screen');
  burst(player.x, player.y, activeColor);
  burst(player.x, player.y, '#ff2a55');
  announce(`You lost. ${summary}`);
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gap = 40;
  for (let x = gap; x < view.w; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, view.h);
    ctx.stroke();
  }
  for (let y = gap; y < view.h; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(view.w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAtmosphere() {
  const now = performance.now() / 1000;
  ctx.save();
  const drifts = [
    { x: 0.25, y: 0.3, color: '255, 40, 90', r: 0.55 },
    { x: 0.75, y: 0.62, color: '0, 220, 255', r: 0.48 },
    { x: 0.5, y: 0.85, color: '120, 40, 255', r: 0.36 },
  ];
  for (const drift of drifts) {
    const x = (drift.x + Math.sin(now * 0.12 + drift.y) * 0.08) * view.w;
    const y = (drift.y + Math.cos(now * 0.1 + drift.x) * 0.06) * view.h;
    const radius = Math.max(view.w, view.h) * drift.r;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `rgba(${drift.color}, 0.16)`);
    glow.addColorStop(1, `rgba(${drift.color}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  for (let i = 0; i < 26; i += 1) {
    const x = ((Math.sin(now * 0.17 + i * 1.9) * 0.5 + 0.5) * view.w);
    const y = ((i * 83 + now * 22) % (view.h + 20)) - 10;
    const alpha = 0.18 + Math.sin(now * 2.2 + i) * 0.1;
    ctx.fillStyle = i % 3 === 0 ? `rgba(255, 70, 120, ${alpha})` : `rgba(120, 245, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, i % 4 === 0 ? 1.7 : 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawVignette() {
  const glow = ctx.createRadialGradient(
    view.w / 2,
    view.h / 2,
    Math.min(view.w, view.h) * 0.2,
    view.w / 2,
    view.h / 2,
    Math.max(view.w, view.h) * 0.72,
  );
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, view.w, view.h);
}

function strokePath(points) {
  const step = Math.max(1, Math.floor(points.length / 500));
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = step; i < points.length; i += step) ctx.lineTo(points[i].x, points[i].y);
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

function drawRibbon(points, color, width, alpha) {
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = hexAlpha(color, alpha * 0.22);
  ctx.lineWidth = width * 4.5;
  strokePath(points);
  ctx.stroke();
  ctx.strokeStyle = hexAlpha(color, alpha);
  ctx.lineWidth = width;
  strokePath(points);
  ctx.stroke();
  ctx.restore();
}

function traceGhost(radius, phase) {
  const wave = (index) => Math.sin(phase * 2.4 + index) * radius * 0.18;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.92, radius * 0.05);
  ctx.bezierCurveTo(-radius * 1.08, -radius * 0.95, -radius * 0.45, -radius * 1.35, 0, -radius * 1.28);
  ctx.bezierCurveTo(radius * 0.5, -radius * 1.35, radius * 1.08, -radius * 0.9, radius * 0.92, radius * 0.08);
  ctx.quadraticCurveTo(radius * 0.62, radius * 0.95 + wave(0), radius * 0.28, radius * 0.22);
  ctx.quadraticCurveTo(0, radius * 1.15 + wave(1.4), -radius * 0.32, radius * 0.2);
  ctx.quadraticCurveTo(-radius * 0.68, radius * 1.02 + wave(2.6), -radius * 0.92, radius * 0.05);
  ctx.closePath();
}

function drawSpirit(x, y, options) {
  const radius = options.radius ?? 17;
  const color = options.color ?? '#00f0ff';
  const alpha = options.alpha ?? 1;
  const phase = options.phase ?? 0;
  const lean = options.lean ?? 0;
  const hollow = options.hollow ?? false;
  const aura = options.aura !== false;
  const bob = Math.sin(phase) * 1.8;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(lean);
  ctx.globalAlpha = alpha;

  if (aura) {
    const haze = ctx.createRadialGradient(0, -radius * 0.1, radius * 0.2, 0, 0, radius * 2.5);
    haze.addColorStop(0, hexAlpha(color, hollow ? 0.32 : 0.5));
    haze.addColorStop(1, hexAlpha(color, 0));
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = hexAlpha(color, hollow ? 0.16 : 0.22);
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.95, radius * 0.72, radius * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  traceGhost(radius, phase);
  const body = ctx.createLinearGradient(0, -radius * 1.2, 0, radius);
  if (hollow) {
    body.addColorStop(0, 'rgba(255, 236, 244, 0.55)');
    body.addColorStop(0.42, hexAlpha(color, 0.42));
    body.addColorStop(1, hexAlpha(color, 0.08));
  } else {
    body.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
    body.addColorStop(0.38, hexAlpha(color, 0.95));
    body.addColorStop(1, hexAlpha(color, 0.35));
  }
  ctx.fillStyle = body;
  ctx.fill();

  ctx.save();
  traceGhost(radius, phase);
  ctx.clip();
  ctx.fillStyle = hollow ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.28, -radius * 0.48, radius * 0.26, radius * 0.46, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  traceGhost(radius, phase);
  ctx.strokeStyle = hollow ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.7)';
  ctx.lineWidth = hollow ? 1 : 1.4;
  ctx.stroke();

  const eyeY = -radius * 0.18;
  const eyeR = Math.max(2.2, radius * 0.15);
  const blink = Math.sin(phase * 0.35) > 0.97 ? 0.25 : 1;
  ctx.fillStyle = hollow ? 'rgba(18, 0, 12, 0.88)' : 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.32, eyeY, eyeR * 0.72, eyeR * blink, 0, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.3, eyeY, eyeR * 0.72, eyeR * blink, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!hollow) {
    ctx.fillStyle = hexAlpha(color, 0.9);
    ctx.beginPath();
    ctx.arc(-radius * 0.32, eyeY, eyeR * 0.28, 0, Math.PI * 2);
    ctx.arc(radius * 0.3, eyeY, eyeR * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  if (aura) {
    for (let spark = 0; spark < 3; spark += 1) {
      const rise = (phase * 0.15 + spark / 3) % 1;
      const sx = Math.sin(phase * 1.3 + spark * 2.1) * radius * 0.85;
      const sy = radius * 0.4 - rise * radius * 2.8;
      ctx.globalAlpha = alpha * (1 - rise) * 0.7;
      ctx.fillStyle = hollow ? '#ffd0dc' : '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawAfterimages(path, index, color, hollow) {
  const count = hollow ? 4 : 6;
  for (let step = count; step >= 1; step -= 1) {
    const point = path[index - step * 3];
    if (!point) continue;
    const fade = 1 - step / (count + 1);
    drawSpirit(point.x, point.y, {
      color,
      radius: hollow ? 10 + fade * 4 : 9 + fade * 5,
      alpha: fade * (hollow ? 0.22 : 0.28),
      phase: performance.now() / 220 - step,
      lean: 0,
      hollow,
      aura: false,
    });
  }
}

function drawEchoes() {
  echoes.forEach((echo, index) => {
    const alpha = Math.min(0.7, 0.18 + ((index + 1) / echoes.length) * 0.5);
    drawRibbon(echo, '#ff2a55', 2.2, alpha);
  });

  echoes.forEach((echo, index) => {
    if (!echo.length) return;
    const frameIndex = ((roundFrame % echo.length) + echo.length) % echo.length;
    const ghost = echo[frameIndex];
    const previous = echo[Math.max(0, frameIndex - 2)];
    const lean = clamp(ghost.x - previous.x, -8, 8) / 8 * 0.55;
    const newest = index === echoes.length - 1;
    drawAfterimages(echo, frameIndex, newest ? '#ff2a55' : '#9d1744', true);
    drawSpirit(ghost.x, ghost.y, {
      color: newest ? '#ff2a55' : '#c81e4a',
      radius: 17,
      alpha: newest ? 0.92 : 0.62,
      phase: performance.now() / 190 + index * 1.3,
      lean,
      hollow: true,
    });
  });
}

function drawPickups() {
  const now = performance.now();
  collectibles.forEach((coin, index) => {
    const bob = Math.sin(now / 220 + index) * 3;
    const y = coin.y + bob;
    ctx.save();
    const glow = ctx.createRadialGradient(coin.x, y, 1, coin.x, y, 18);
    glow.addColorStop(0, 'rgba(255, 214, 80, 0.55)');
    glow.addColorStop(1, 'rgba(255, 187, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(coin.x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe28a';
    ctx.beginPath();
    ctx.arc(coin.x, y, coin.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffbb00';
    ctx.beginPath();
    ctx.arc(coin.x, y, coin.radius * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(coin.x - 2, y - 2, coin.radius * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  for (const power of powerups) {
    if (power.type === 'SHIELD') drawShieldIcon(power.x, power.y);
    else drawBonusIcon(power.x, power.y);
  }
}

function drawShieldIcon(x, y) {
  ctx.save();
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, y - 13);
  ctx.lineTo(x + 11, y - 7);
  ctx.lineTo(x + 9, y + 5);
  ctx.quadraticCurveTo(x, y + 14, x - 9, y + 5);
  ctx.lineTo(x - 11, y - 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBonusIcon(x, y) {
  ctx.save();
  ctx.fillStyle = '#ffbb00';
  ctx.shadowColor = '#ffbb00';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1400';
  ctx.font = '800 16px system-ui, "DejaVu Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', x, y + 1);
  ctx.restore();
}

function drawPlayer() {
  const phase = performance.now() / 170;
  const flickering = grace > 0 && Math.floor(grace / 4) % 2 === 0;
  const lean = clamp(player.vx, -5, 5) / 5 * 0.5;
  if (currentPath.length > 1) {
    drawAfterimages(currentPath, currentPath.length - 1, activeColor, false);
  }
  drawSpirit(player.x, player.y, {
    color: activeColor,
    radius: 18,
    alpha: flickering ? 0.42 : 1,
    phase,
    lean,
    hollow: false,
  });

  if (activePowerup !== 'SHIELD' && grace <= 0) return;
  ctx.save();
  const spin = performance.now() / 260;
  const ring = activePowerup === 'SHIELD' ? '#7af6ff' : 'rgba(255,255,255,0.75)';
  ctx.strokeStyle = ring;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = activePowerup === 'SHIELD' ? 0.85 : 0.45;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 28, spin, spin + Math.PI * 1.35);
  ctx.stroke();
  if (activePowerup === 'SHIELD') {
    for (let i = 0; i < 3; i += 1) {
      const angle = spin + (i * Math.PI * 2) / 3;
      ctx.fillStyle = '#e8fdff';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(player.x + Math.cos(angle) * 28, player.y + Math.sin(angle) * 16, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawParticles() {
  for (const particle of particles) {
    const alpha = Math.max(0, particle.life / 24);
    ctx.save();
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBanner() {
  if (bannerTimer <= 0 || !bannerText) return;
  ctx.save();
  ctx.font = '700 18px system-ui, "DejaVu Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const y = Math.max(92, view.h * 0.16);
  const width = ctx.measureText(bannerText).width + 32;
  const x = view.w / 2 - width / 2;
  ctx.fillStyle = 'rgba(8, 10, 16, 0.78)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y - 18, width, 36, 18);
  else ctx.rect(x, y - 18, width, 36);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(bannerText, view.w / 2, y);
  ctx.restore();
}

function drawDragReticle() {
  if (!isDragging || gameState !== 'PLAYING') return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(player.targetX, player.targetY, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawMenuBackdrop() {
  const time = performance.now() / 1000;
  const cx = view.w / 2;
  const cy = view.h * 0.72;
  drawRibbon(
    Array.from({ length: 28 }, (_, index) => {
      const angle = time * 0.7 + index * 0.22;
      return {
        x: cx + Math.cos(angle) * 86,
        y: cy + Math.sin(angle) * 36,
      };
    }),
    '#ff2a55',
    2,
    0.35,
  );
  drawSpirit(
    cx + Math.cos(time + 2.2) * 86,
    cy + Math.sin(time + 2.2) * 36,
    { color: '#ff2a55', radius: 18, phase: time * 3, lean: Math.cos(time) * 0.3, hollow: true },
  );
  drawSpirit(
    cx + Math.cos(time) * 86,
    cy + Math.sin(time) * 36,
    { color: activeColor, radius: 18, phase: time * 3.2, lean: -Math.sin(time) * 0.3, hollow: false },
  );
}

function draw() {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.w, view.h);
  if (view.w < 2 || view.h < 2) return;

  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    shake *= 0.86;
    if (shake < 0.4) shake = 0;
  }

  drawGrid();
  drawAtmosphere();
  if (gameState === 'MENU') {
    drawMenuBackdrop();
  } else {
    drawEchoes();
    drawRibbon(currentPath, activeColor, 2.4, 0.55);
    drawPickups();
    drawParticles();
    drawPlayer();
    drawDragReticle();
    drawBanner();
  }
  drawVignette();
  ctx.restore();
}

function hexAlpha(hex, alpha) {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function frame(now) {
  if (view.w < 2 || view.h < 2) resizeCanvas();
  if (!lastTime) lastTime = now;
  const delta = Math.min(100, now - lastTime);
  lastTime = now;
  accumulator += delta;
  let steps = 0;
  while (accumulator >= STEP && steps < 5) {
    update();
    accumulator -= STEP;
    steps += 1;
  }
  if (steps === 5) accumulator = 0;
  draw();
  requestAnimationFrame(frame);
}

function pointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width ? view.w / rect.width : 1;
  const scaleY = rect.height ? view.h / rect.height : 1;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function updateTarget(event) {
  const point = pointFromEvent(event);
  player.targetX = point.x;
  player.targetY = point.y;
}

function endDrag() {
  isDragging = false;
}

function bindInput() {
  canvas.addEventListener('pointerdown', (event) => {
    if (gameState !== 'PLAYING') return;
    isDragging = true;
    canvas.setPointerCapture(event.pointerId);
    updateTarget(event);
    AudioEngine.unlock();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!isDragging || gameState !== 'PLAYING') return;
    updateTarget(event);
  });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', (event) => {
    if (!KEY_CODES.has(event.code)) return;
    if (gameState === 'PLAYING') event.preventDefault();
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
    isDragging = false;
  });
  window.addEventListener('resize', resizeCanvas);
}

function bindUI() {
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('retry-btn').addEventListener('click', startGame);
  document.getElementById('shop-btn').addEventListener('click', openShop);
  document.getElementById('close-shop').addEventListener('click', closeShop);
  document.getElementById('menu-btn').addEventListener('click', returnToMenu);
}

loadSave();
resizeCanvas();
document.querySelectorAll('.screen.hidden').forEach((screen) => {
  screen.inert = true;
});
syncHUD();
syncMenu();
bindInput();
bindUI();
requestAnimationFrame(frame);

if (import.meta.env.DEV) {
  window.__echo = {
    start: startGame,
    openShop,
    closeShop,
    returnToMenu,
    buyColor,
    placePlayer(x, y) {
      player.x = x;
      player.y = y;
      player.targetX = x;
      player.targetY = y;
    },
    placeCoins(list) {
      collectibles = list.map((coin) => ({ radius: 8, ...coin }));
    },
    placePowerups(list) {
      powerups = list.map((power) => ({ ...power }));
    },
    placeEcho(path) {
      echoes = [path.map((point) => ({ ...point }))];
      roundFrame = 0;
      grace = 0;
      activePowerup = null;
      powerupTimer = 0;
    },
    state: () => ({
      gameState,
      score,
      coins,
      currentRound,
      echoCount: echoes.length,
      pathLength: currentPath.length,
      collectibles: collectibles.map((coin) => ({ ...coin })),
      powerups: powerups.map((power) => ({ ...power })),
      activePowerup,
      powerupTimer,
      grace,
      roundFrame,
      player: { x: player.x, y: player.y, targetX: player.targetX, targetY: player.targetY, radius: player.radius },
      activeColor,
      unlockedColors: [...unlockedColors],
      bestScore,
      bestRound,
      gamesPlayed,
      bannerText,
      view: { w: view.w, h: view.h },
    }),
  };
}
