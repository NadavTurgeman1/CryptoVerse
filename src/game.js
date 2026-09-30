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
  { id: '#00f0ff', name: 'ניאון תכלת', price: 0 },
  { id: '#ff0055', name: 'ורד מגנטה', price: 50 },
  { id: '#00ff66', name: 'ירוק מטריקס', price: 100 },
  { id: '#ffbb00', name: 'צהוב זהב', price: 150 },
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

const player = { x: 240, y: 400, radius: 14, targetX: 240, targetY: 400 };
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
    ? `🛡️ ${Math.ceil(powerupTimer / 60)}`
    : 'אין';
  setText('powerup-status', `כוח: ${status}`);
}

function syncMenu() {
  setText(
    'menu-best',
    bestScore > 0 ? `שיא: ${bestScore} נקודות · סיבוב ${bestRound}` : 'עדיין אין שיא',
  );
}

function renderProfile() {
  const root = document.getElementById('profile-stats');
  root.replaceChildren();
  const rows = [
    ['מטבעות', coins],
    ['שיא נקודות', bestScore],
    ['שיא סיבוב', bestRound],
    ['משחקים', gamesPlayed],
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
    meta.textContent = selected ? 'מצויד' : unlocked ? 'פתוח' : `${item.price} מטבעות`;

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
  bannerText = 'אסוף 3 מטבעות';
  bannerTimer = 110;
  gamesPlayed += 1;

  resizeCanvas();
  player.x = view.w / 2;
  player.y = view.h / 2;
  player.targetX = player.x;
  player.targetY = player.y;
  spawnCollectibles();
  saveAll();
  syncHUD();
  announce('המשחק התחיל. אסוף שלושה מטבעות.');
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
    showToast('אין מספיק מטבעות');
    return;
  }

  coins = result.coins;
  unlockedColors = result.unlocked;
  activeColor = result.active;
  saveAll();
  if (result.status === 'bought') {
    AudioEngine.coin();
    showToast(`${item.name} נפתח`);
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
  bannerText = `סיבוב ${currentRound} — ההד התעורר`;
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
  showToast(`בונוס +${COIN_BONUS} מטבעות`);
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

  player.x += (player.targetX - player.x) * 0.2;
  player.y += (player.targetY - player.y) * 0.2;
  player.x = clampToField(player.x, player.radius, view.w - player.radius);
  player.y = clampToField(player.y, player.radius, view.h - player.radius);
  player.targetX = clampToField(player.targetX, player.radius, view.w - player.radius);
  player.targetY = clampToField(player.targetY, player.radius, view.h - player.radius);
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

  const celebrate = hadRecord && (scoreRecord || roundRecord) ? ' · שיא חדש!' : '';
  const summary = `סיבוב ${currentRound} · ${score} נקודות${celebrate}`;
  setText('final-stats', summary);
  setText('final-best', `שיא אישי: ${bestScore} נקודות · סיבוב ${bestRound}`);
  setMode('GAMEOVER');
  showScreen('game-over-screen');
  announce(`הפסדת. ${summary}`);
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
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

function drawRoute(points, color, width) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  const step = Math.max(1, Math.floor(points.length / 500));
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = step; i < points.length; i += step) ctx.lineTo(points[i].x, points[i].y);
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

function drawEchoes() {
  echoes.forEach((echo, index) => {
    const alpha = Math.min(0.8, 0.16 + ((index + 1) / echoes.length) * 0.6);
    drawRoute(echo, `rgba(255, 0, 85, ${alpha})`, 3);
  });

  for (const echo of echoes) {
    const ghost = ghostPoint(echo, roundFrame);
    if (!ghost) continue;
    ctx.save();
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = echoes.length > 8 ? 0 : 12;
    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPickups() {
  const now = performance.now();
  collectibles.forEach((coin, index) => {
    const bob = Math.sin(now / 220 + index) * 2.2;
    ctx.save();
    ctx.fillStyle = '#ffbb00';
    ctx.shadowColor = '#ffbb00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + bob, coin.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y + bob, coin.radius * 0.45, 0, Math.PI * 2);
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
  ctx.save();
  const flickering = grace > 0 && Math.floor(grace / 4) % 2 === 0;
  ctx.globalAlpha = flickering ? 0.45 : 1;
  ctx.fillStyle = activeColor;
  ctx.shadowColor = activeColor;
  ctx.shadowBlur = activePowerup === 'SHIELD' ? 22 : 12;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(player.x - 4, player.y - 4, 3.5, 0, Math.PI * 2);
  ctx.fill();

  if (activePowerup === 'SHIELD' || grace > 0) {
    const spin = performance.now() / 280;
    ctx.globalAlpha = activePowerup === 'SHIELD' ? 0.95 : 0.55;
    ctx.strokeStyle = activePowerup === 'SHIELD' ? '#00f0ff' : 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 8, spin, spin + Math.PI * 1.35);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles() {
  for (const particle of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, particle.life / 24);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBanner() {
  if (bannerTimer <= 0 || !bannerText) return;
  ctx.save();
  ctx.font = '700 18px system-ui, "DejaVu Sans", "Noto Serif Hebrew", sans-serif';
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
  const cy = view.h * 0.62;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 0, 85, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 78, time * 0.6, time * 0.6 + 4.4);
  ctx.stroke();
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(time + 2.1) * 78, cy + Math.sin(time + 2.1) * 48, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = activeColor;
  ctx.shadowColor = activeColor;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(time) * 78, cy + Math.sin(time) * 48, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  if (gameState === 'MENU') {
    drawMenuBackdrop();
  } else {
    drawEchoes();
    drawRoute(currentPath, hexAlpha(activeColor, 0.45), 2);
    drawPickups();
    drawParticles();
    drawPlayer();
    drawDragReticle();
    drawBanner();
  }
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
