import {
  applyCosmetic,
  clamp,
  clampInt,
  dropOldestEcho,
  echoClock,
  ghostPoint,
  roundPressure,
  stepHoming,
  hitsEcho,
  joystickVector,
  pickSpawn,
  previewLoadout,
  slideBy,
  safeJson,
  sanitizeUnlocks,
  sealPath,
  takeOverlaps,
} from './logic.js';

const COLORS = [
  { id: '#ff2a55', name: 'Rose', price: 0, slot: 'color' },
  { id: '#00f0ff', name: 'Cyan', price: 50, slot: 'color' },
  { id: '#b388ff', name: 'Violet', price: 80, slot: 'color' },
  { id: '#00ff66', name: 'Matrix', price: 100, slot: 'color' },
  { id: '#ffbb00', name: 'Gold', price: 150, slot: 'color' },
];

const HATS = [
  { id: 'none', name: 'None', price: 0, slot: 'hat' },
  { id: 'cap', name: 'Cap', price: 40, slot: 'hat' },
  { id: 'beanie', name: 'Beanie', price: 75, slot: 'hat' },
  { id: 'tophat', name: 'Top hat', price: 120, slot: 'hat' },
  { id: 'crown', name: 'Crown', price: 200, slot: 'hat' },
];

const GLASSES = [
  { id: 'none', name: 'None', price: 0, slot: 'glasses' },
  { id: 'rounds', name: 'Rounds', price: 45, slot: 'glasses' },
  { id: 'shades', name: 'Shades', price: 90, slot: 'glasses' },
  { id: 'visor', name: 'Visor', price: 130, slot: 'glasses' },
];

const SHOP = { color: COLORS, hat: HATS, glasses: GLASSES };
const COIN_RADIUS = 20;
const COINS = [
  { id: 'btc' },
  { id: 'eth' },
  { id: 'xrp' },
  { id: 'sol' },
  { id: 'doge' },
  { id: 'bnb' },
];
const JOYSTICK_RADIUS = 56;
const JOYSTICK_DEADZONE = 0.16;

const STORAGE = {
  coins: 'echo_coins',
  color: 'echo_ghost_color',
  colors: 'echo_ghost_colors',
  hat: 'echo_hat',
  hats: 'echo_hats',
  glasses: 'echo_glasses',
  glassesOwned: 'echo_glasses_owned',
  bestScore: 'echo_best_score',
  bestRound: 'echo_best_round',
  games: 'echo_games',
};

const STEP = 1000 / 60;
const SHIELD_FRAMES = 300;
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
  launch() { this.play(360, 'sawtooth', 0.16); },
  blast() { this.play(96, 'square', 0.22); },
  deny() { this.play(180, 'square', 0.08); },
  round() {
    this.play(523.25, 'triangle', 0.12);
    window.setTimeout(() => this.play(659.25, 'triangle', 0.16), 90);
  },
};

const canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
const view = { w: 480, h: 800, dpr: 1 };

let gameState = 'MENU';
let score = 0;
let coins = 0;
let currentRound = 1;
let echoColor = COLORS[0].id;
let unlockedColors = [COLORS[0].id];
let echoHat = 'none';
let unlockedHats = ['none'];
let echoGlasses = 'none';
let unlockedGlasses = ['none'];
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
let missile = null;
let impacts = [];
let grace = 0;
let roundFrame = 0;
let skipFrameTick = false;
let bannerText = '';
let bannerTimer = 0;
let shake = 0;
let isDragging = false;
const joystick = {
  active: false,
  pointerId: null,
  ox: 0,
  oy: 0,
  x: 0,
  y: 0,
  amount: 0,
};
const pinnedTry = { color: null, hat: null, glasses: null };
let hoverTry = null;
let lastTry = null;
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

function loadSlot(listKey, activeKey, catalog) {
  const ids = catalog.map((item) => item.id);
  const unlocked = sanitizeUnlocks(safeJson(storageGet(listKey), [ids[0]]), ids);
  const saved = storageGet(activeKey);
  return {
    unlocked,
    active: unlocked.includes(saved) ? saved : ids[0],
  };
}

function loadSave() {
  coins = clampInt(storageGet(STORAGE.coins), 0);
  const color = loadSlot(STORAGE.colors, STORAGE.color, COLORS);
  const hat = loadSlot(STORAGE.hats, STORAGE.hat, HATS);
  const glasses = loadSlot(STORAGE.glassesOwned, STORAGE.glasses, GLASSES);
  unlockedColors = color.unlocked;
  echoColor = color.active;
  unlockedHats = hat.unlocked;
  echoHat = hat.active;
  unlockedGlasses = glasses.unlocked;
  echoGlasses = glasses.active;
  bestScore = clampInt(storageGet(STORAGE.bestScore), 0);
  bestRound = clampInt(storageGet(STORAGE.bestRound), 0);
  gamesPlayed = clampInt(storageGet(STORAGE.games), 0);
}

function saveAll() {
  storageSet(STORAGE.coins, coins);
  storageSet(STORAGE.color, echoColor);
  storageSet(STORAGE.colors, JSON.stringify(unlockedColors));
  storageSet(STORAGE.hat, echoHat);
  storageSet(STORAGE.hats, JSON.stringify(unlockedHats));
  storageSet(STORAGE.glasses, echoGlasses);
  storageSet(STORAGE.glassesOwned, JSON.stringify(unlockedGlasses));
  storageSet(STORAGE.bestScore, bestScore);
  storageSet(STORAGE.bestRound, bestRound);
  storageSet(STORAGE.games, gamesPlayed);
}

function cosmeticLoadout() {
  return {
    coins,
    unlocked: { color: unlockedColors, hat: unlockedHats, glasses: unlockedGlasses },
    active: { color: echoColor, hat: echoHat, glasses: echoGlasses },
  };
}

function applyLoadout(next) {
  coins = next.coins;
  unlockedColors = next.unlocked.color;
  unlockedHats = next.unlocked.hat;
  unlockedGlasses = next.unlocked.glasses;
  echoColor = next.active.color;
  echoHat = next.active.hat;
  echoGlasses = next.active.glasses;
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

function clearJoystick() {
  joystick.active = false;
  joystick.pointerId = null;
  joystick.x = 0;
  joystick.y = 0;
  joystick.amount = 0;
}

function setMode(mode) {
  gameState = mode;
  document.getElementById('game-container').dataset.state = mode;
  if (mode !== 'PLAYING') {
    isDragging = false;
    clearJoystick();
  }
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
    ['Dollars', `$${coins}`],
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

function paintOn(target, fn) {
  const previous = ctx;
  ctx = target;
  try {
    fn();
  } finally {
    ctx = previous;
  }
}

function resetTryOn() {
  pinnedTry.color = null;
  pinnedTry.hat = null;
  pinnedTry.glasses = null;
  hoverTry = null;
  lastTry = null;
}

function catalogItem(slot, id) {
  return SHOP[slot]?.find((item) => item.id === id) ?? null;
}

function isTrying(slot, id) {
  if (hoverTry?.slot === slot && hoverTry.id === id) return true;
  return pinnedTry[slot] === id;
}

function setHoverTry(slot, id) {
  hoverTry = { slot, id };
  refreshTryMarks();
  syncTryAction();
}

function clearHoverTry(slot, id) {
  if (hoverTry?.slot !== slot || hoverTry.id !== id) return;
  hoverTry = null;
  refreshTryMarks();
  syncTryAction();
}

function pinTry(item) {
  if (pinnedTry[item.slot] === item.id) pinnedTry[item.slot] = null;
  else pinnedTry[item.slot] = item.id;
  lastTry = pinnedTry[item.slot] ? { slot: item.slot, id: item.id } : nextPinnedTry();
  hoverTry = null;
  renderShop();
}

function nextPinnedTry() {
  for (const slot of ['glasses', 'hat', 'color']) {
    if (pinnedTry[slot]) return { slot, id: pinnedTry[slot] };
  }
  return null;
}

function actionItem() {
  const loadout = cosmeticLoadout();
  const candidates = [];
  if (lastTry) candidates.push(lastTry);
  for (const slot of ['glasses', 'hat', 'color']) {
    if (pinnedTry[slot]) candidates.push({ slot, id: pinnedTry[slot] });
  }
  for (const trial of candidates) {
    const item = catalogItem(trial.slot, trial.id);
    if (item && loadout.active[trial.slot] !== item.id) return item;
  }
  return null;
}

function refreshTryMarks() {
  document.querySelectorAll('.shop-item').forEach((button) => {
    button.classList.toggle('trying', isTrying(button.dataset.slot, button.dataset.id));
  });
}

function syncTryAction() {
  const caption = document.getElementById('try-on-caption');
  const button = document.getElementById('try-on-buy');
  if (!caption || !button) return;
  const item = actionItem();
  const look = previewLoadout(
    { color: echoColor, hat: echoHat, glasses: echoGlasses },
    pinnedTry,
    hoverTry,
  );
  const names = ['color', 'hat', 'glasses'].flatMap((slot) => {
    const equipped = slot === 'color' ? echoColor : slot === 'hat' ? echoHat : echoGlasses;
    if (look[slot] === equipped) return [];
    const tried = catalogItem(slot, look[slot]);
    return tried ? [tried.name] : [];
  });
  caption.textContent = names.length
    ? `Preview: ${names.join(', ')}`
    : 'Tap an item to preview it on an echo';
  if (!item) {
    button.hidden = true;
    button.disabled = false;
    return;
  }
  const unlocked = cosmeticLoadout().unlocked[item.slot].includes(item.id);
  button.hidden = false;
  if (unlocked) {
    button.disabled = false;
    button.textContent = `Equip ${item.name}`;
  } else if (coins >= item.price) {
    button.disabled = false;
    button.textContent = `Buy ${item.name} · $${item.price}`;
  } else {
    button.disabled = true;
    button.textContent = `Need $${item.price}`;
  }
}

function renderShop() {
  syncHUD();
  renderProfile();
  renderSlot('color-shop', 'color');
  renderSlot('hat-shop', 'hat');
  renderSlot('glasses-shop', 'glasses');
  syncTryAction();
  renderPreview();
}

function renderSlot(containerId, slot) {
  const container = document.getElementById(containerId);
  const loadout = cosmeticLoadout();
  container.replaceChildren();
  for (const item of SHOP[slot]) {
    const unlocked = loadout.unlocked[slot].includes(item.id);
    const selected = loadout.active[slot] === item.id;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `shop-item${selected ? ' selected' : ''}${isTrying(slot, item.id) ? ' trying' : ''}`;
    button.dataset.slot = slot;
    button.dataset.id = item.id;
    button.setAttribute('aria-pressed', isTrying(slot, item.id) ? 'true' : 'false');

    if (slot === 'color') {
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = item.id;
      button.append(swatch);
    } else {
      button.append(makeThumb(item));
    }

    const name = document.createElement('span');
    name.className = 'shop-name';
    name.textContent = item.name;

    const meta = document.createElement('span');
    meta.className = 'shop-meta';
    meta.textContent = selected ? 'Equipped' : unlocked ? 'Owned' : `$${item.price}`;

    button.append(name, meta);
    button.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      setHoverTry(slot, item.id);
    });
    button.addEventListener('pointerleave', () => clearHoverTry(slot, item.id));
    button.addEventListener('focus', () => setHoverTry(slot, item.id));
    button.addEventListener('blur', () => clearHoverTry(slot, item.id));
    button.addEventListener('click', () => pinTry(item));
    container.append(button);
  }
}

function makeThumb(item) {
  const thumb = document.createElement('canvas');
  thumb.className = 'thumb';
  thumb.width = 112;
  thumb.height = 80;
  const g = thumb.getContext('2d');
  g.setTransform(2, 0, 0, 2, 0, 0);
  paintOn(g, () => {
    ctx.translate(28, item.slot === 'hat' ? 30 : 22);
    if (item.slot === 'hat') drawHat(item.id, 15, '#ff2a55');
    else drawGlasses(item.id, 16);
  });
  return thumb;
}

function renderPreview() {
  const preview = document.getElementById('loadout-preview');
  if (!preview) return;
  const g = preview.getContext('2d');
  const width = 180;
  const height = 168;
  const dpr = 2;
  if (preview.width !== width * dpr) {
    preview.width = width * dpr;
    preview.height = height * dpr;
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, width, height);
  const look = previewLoadout(
    { color: echoColor, hat: echoHat, glasses: echoGlasses },
    pinnedTry,
    hoverTry,
  );
  paintOn(g, () => {
    drawSpirit(width / 2, height * 0.62, {
      color: look.color,
      radius: 28,
      phase: performance.now() / 180,
      hollow: true,
      hat: look.hat,
      glasses: look.glasses,
    });
  });
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

function ghostFrame() {
  return echoClock(roundFrame, currentRound);
}

function spawnBlockers() {
  const spacing = roundPressure(currentRound).spacing;
  const blockers = [{ x: player.x, y: player.y, minDist: 110 }];
  for (const coin of collectibles) blockers.push({ x: coin.x, y: coin.y, minDist: spacing });
  for (const power of powerups) blockers.push({ x: power.x, y: power.y, minDist: 64 });
  for (const echo of echoes) {
    const ghost = ghostPoint(echo, ghostFrame());
    if (ghost) blockers.push({ x: ghost.x, y: ghost.y, minDist: 72 });
  }
  return blockers;
}

function spawnPoint(cluster) {
  const point = pickSpawn(Math.random, fieldBounds(), spawnBlockers(), cluster);
  if (Math.hypot(point.x - player.x, point.y - player.y) >= 80) return point;
  return {
    x: point.x < view.w / 2 ? 36 : view.w - 36,
    y: clamp(point.y, 90, Math.max(100, view.h - 50)),
  };
}

function spawnCollectibles() {
  collectibles = [];
  const kinds = [...COINS].sort(() => Math.random() - 0.5);
  const reach = roundPressure(currentRound).reach;
  for (let i = 0; i < 3; i += 1) {
    const anchor = collectibles[0];
    const cluster = anchor ? { x: anchor.x, y: anchor.y, reach } : null;
    const point = spawnPoint(cluster);
    collectibles.push({
      x: point.x,
      y: point.y,
      radius: COIN_RADIUS,
      kind: kinds[i].id,
    });
  }
  if (powerups.length < 2 && Math.random() < 0.4) {
    const point = spawnPoint();
    powerups.push({
      x: point.x,
      y: point.y,
      type: ['SHIELD', 'COIN', 'MISSILE'][Math.floor(Math.random() * 3)],
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
  missile = null;
  impacts = [];
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
  resetTryOn();
  showScreen('shop-screen');
  renderShop();
}

function closeShop() {
  showScreen('main-menu');
  syncMenu();
}

function buyCosmetic(item) {
  const result = applyCosmetic(cosmeticLoadout(), item);
  if (result.status === 'broke') {
    AudioEngine.deny();
    showToast('Not enough dollars');
    return false;
  }

  applyLoadout(result);
  if (pinnedTry[item.slot] === item.id) pinnedTry[item.slot] = null;
  if (lastTry?.slot === item.slot && lastTry.id === item.id) lastTry = nextPinnedTry();
  if (hoverTry?.slot === item.slot && hoverTry.id === item.id) hoverTry = null;
  saveAll();
  if (result.status === 'bought') {
    AudioEngine.coin();
    showToast(`${item.name} unlocked`);
  }
  renderShop();
  return true;
}

function confirmTryOn() {
  const item = actionItem();
  if (!item) return;
  buyCosmetic(item);
}

function advanceRound() {
  const next = sealPath(echoes, currentPath, currentRound);
  echoes = next.echoes;
  currentPath = [];
  currentRound = next.round;
  roundFrame = next.frame;
  skipFrameTick = true;
  grace = roundPressure(currentRound).grace;
  bannerText = `Round ${currentRound}`;
  bannerTimer = 110;
  AudioEngine.round();
  spawnCollectibles();
  announce(bannerText);
}

function applyPowerup(power) {
  const color = power.type === 'SHIELD' ? '#00f0ff' : power.type === 'MISSILE' ? '#ff5a1f' : '#ffbb00';
  burst(power.x, power.y, color);
  if (power.type === 'SHIELD') {
    activePowerup = 'SHIELD';
    powerupTimer = SHIELD_FRAMES;
    AudioEngine.powerup();
    return;
  }
  if (power.type === 'MISSILE') {
    launchMissile();
    return;
  }

  coins += COIN_BONUS;
  score += COIN_SCORE;
  saveAll();
  AudioEngine.coin();
  showToast(`Bonus +$${COIN_BONUS}`);
}

function launchMissile() {
  const target = ghostPoint(echoes[0], ghostFrame());
  if (!target) {
    AudioEngine.deny();
    showToast('No echo yet');
    return;
  }
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const distance = Math.hypot(dx, dy) || 1;
  missile = {
    x: player.x,
    y: player.y,
    vx: (dx / distance) * 7,
    vy: (dy / distance) * 7,
    trail: [{ x: player.x, y: player.y }],
  };
  AudioEngine.launch();
  showToast('Missile away');
}

function detonateMissile(x, y, hit) {
  missile = null;
  impacts.push({ x, y, life: 28 });
  shake = hit ? 9 : 3;
  burst(x, y, '#ff6a00');
  burst(x, y, '#fff1c2');
  if (!hit) return;
  const next = dropOldestEcho(echoes);
  echoes = next.echoes;
  score += 20;
  AudioEngine.blast();
  showToast('Oldest echo destroyed');
  announce('Oldest echo destroyed');
}

function stepMissile() {
  if (missile) {
    const target = ghostPoint(echoes[0], ghostFrame());
    if (!target) {
      detonateMissile(missile.x, missile.y, false);
    } else if (missile) {
      const next = stepHoming(missile, target, 13, 0.45);
      if (next.distance < 20) {
        detonateMissile(target.x, target.y, true);
      } else {
        missile.x = next.x;
        missile.y = next.y;
        missile.vx = next.vx;
        missile.vy = next.vy;
        missile.trail.push({ x: missile.x, y: missile.y });
        if (missile.trail.length > 14) missile.trail.shift();
        if (particles.length < 80 && Math.random() < 0.8) {
          particles.push({
            x: missile.x - missile.vx * 0.8,
            y: missile.y - missile.vy * 0.8,
            vx: -missile.vx * 0.05 + (Math.random() - 0.5) * 0.6,
            vy: -missile.vy * 0.05 + (Math.random() - 0.5) * 0.6,
            life: 12,
            color: Math.random() < 0.5 ? '#fff1c2' : '#ff4d00',
          });
        }
      }
    }
  }
  for (let i = impacts.length - 1; i >= 0; i -= 1) {
    impacts[i].life -= 1;
    if (impacts[i].life <= 0) impacts.splice(i, 1);
  }
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
  if (joystick.active && joystick.amount > JOYSTICK_DEADZONE) {
    const lead = (8 / 0.2) * joystick.amount;
    player.targetX = player.x + (joystick.x / joystick.amount) * lead;
    player.targetY = player.y + (joystick.y / joystick.amount) * lead;
  } else if (!isDragging) {
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
      color: Math.random() < 0.45 ? '#fff1c2' : '#ff6a00',
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
  stepMissile();
  tickShield();
  stepParticles();

  const vulnerable = grace <= 0 && activePowerup !== 'SHIELD';
  if (hitsEcho(player, echoes, ghostFrame(), player.radius * 2 - 8, vulnerable)) {
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
  missile = null;
  setMode('GAMEOVER');
  showScreen('game-over-screen');
  burst(player.x, player.y, '#fff1c2');
  burst(player.x, player.y, '#ff4d00');
  announce(`You lost. ${summary}`);
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let starfield = null;

function ensureStars() {
  if (starfield && starfield.w === view.w && starfield.h === view.h) return;
  const rand = mulberry32(11);
  const count = Math.round((view.w * view.h) / 3400);
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const roll = rand();
    points.push({
      x: rand() * view.w,
      y: rand() * view.h,
      r: roll > 0.96 ? 2.1 : roll > 0.9 ? 1.45 : 0.45 + rand() * 0.7,
      phase: rand() * Math.PI * 2,
      tint: roll > 0.86 ? '186, 206, 255' : roll > 0.74 ? '255, 226, 186' : '255, 255, 255',
    });
  }
  starfield = { w: view.w, h: view.h, points };
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
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
    glow.addColorStop(0, `rgba(${drift.color}, 0.07)`);
    glow.addColorStop(1, `rgba(${drift.color}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  ensureStars();
  for (const star of starfield.points) {
    const twinkle = 0.62 + Math.sin(now * 1.4 + star.phase) * 0.32;
    ctx.fillStyle = `rgba(${star.tint}, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
    if (star.r > 1.6) {
      ctx.strokeStyle = `rgba(${star.tint}, ${twinkle * 0.7})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(star.x - star.r * 2.2, star.y);
      ctx.lineTo(star.x + star.r * 2.2, star.y);
      ctx.moveTo(star.x, star.y - star.r * 2.2);
      ctx.lineTo(star.x, star.y + star.r * 2.2);
      ctx.stroke();
    }
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
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
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

function proximity(x, y) {
  const dist = Math.hypot(x - player.x, y - player.y);
  return clamp(1 - dist / 250, 0, 1);
}

function drawLitRibbon(points, color, width, alpha) {
  if (points.length < 2) return;
  const step = Math.max(1, Math.floor(points.length / 220));
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < points.length - 1; i += step) {
    const start = points[i];
    const end = points[Math.min(points.length - 1, i + step)];
    const near = proximity((start.x + end.x) / 2, (start.y + end.y) / 2);
    const strength = 0.62 + near * 1.25;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = hexAlpha(color, Math.min(0.95, alpha * 0.42 * strength));
    ctx.lineWidth = width * (3.4 + near * 3.2);
    ctx.stroke();
    ctx.strokeStyle = hexAlpha(color, Math.min(1, alpha * strength));
    ctx.lineWidth = width * (1.25 + near * 1.45);
    ctx.stroke();
  }
  ctx.restore();
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

function flameTongue(angle, length, width) {
  const px = Math.cos(angle);
  const py = Math.sin(angle);
  const nx = -py;
  const ny = px;
  const mid = length * 0.48;
  ctx.beginPath();
  ctx.moveTo(nx * width * 0.22, ny * width * 0.22);
  ctx.quadraticCurveTo(px * mid + nx * width, py * mid + ny * width, px * length, py * length);
  ctx.quadraticCurveTo(px * mid - nx * width, py * mid - ny * width, -nx * width * 0.22, -ny * width * 0.22);
  ctx.closePath();
}

function drawFireball(x, y, radius, phase, alpha, heading = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  const boiling = heading == null;

  const heat = ctx.createRadialGradient(0, radius * 0.08, radius * 0.1, 0, 0, radius * 2.8);
  heat.addColorStop(0, 'rgba(255, 244, 210, 0.95)');
  heat.addColorStop(0.22, 'rgba(255, 150, 30, 0.55)');
  heat.addColorStop(0.55, 'rgba(255, 40, 0, 0.18)');
  heat.addColorStop(1, 'rgba(90, 0, 0, 0)');
  ctx.fillStyle = heat;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.8, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 14; i += 1) {
    const flicker = Math.sin(phase * 3.6 + i * 1.55) * 0.28;
    const around = (i / 14) * Math.PI * 2 + flicker;
    const angle = boiling ? around : heading + (i / 13 - 0.5) * 2.2 + flicker * 0.7;
    const reach = boiling ? 1.05 : 1.65;
    const length = radius * (reach + Math.sin(phase * 4.8 + i * 1.1) * 0.48 + (i % 3 === 0 ? 0.38 : 0));
    const width = radius * (0.42 + (i % 2) * 0.14);
    const hot = i % 3 !== 1;
    const tongue = ctx.createLinearGradient(0, 0, Math.cos(angle) * length, Math.sin(angle) * length);
    tongue.addColorStop(0, hot ? 'rgba(255, 250, 220, 0.98)' : 'rgba(255, 186, 48, 0.95)');
    tongue.addColorStop(0.4, hot ? 'rgba(255, 110, 0, 0.9)' : 'rgba(255, 42, 0, 0.8)');
    tongue.addColorStop(1, 'rgba(120, 6, 0, 0)');
    ctx.fillStyle = tongue;
    flameTongue(angle, length, width);
    ctx.fill();
  }

  ctx.beginPath();
  for (let i = 0; i <= 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    const boil = 1 + Math.sin(phase * 5.2 + i * 1.15) * 0.18 + Math.sin(phase * 2.4 + i * 0.6) * 0.07;
    const px = Math.cos(angle) * radius * boil;
    const py = Math.sin(angle) * radius * boil * 0.94;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const body = ctx.createRadialGradient(-radius * 0.2, -radius * 0.24, radius * 0.04, 0, radius * 0.08, radius * 1.05);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(0.22, '#fff4c4');
  body.addColorStop(0.5, '#ffb000');
  body.addColorStop(0.78, '#ff4a00');
  body.addColorStop(1, 'rgba(120, 10, 0, 0.2)');
  ctx.fillStyle = body;
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 245, 0.96)';
  ctx.beginPath();
  ctx.arc(-radius * 0.08, -radius * 0.1, radius * 0.38, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 8; i += 1) {
    const life = (phase * 0.18 + i / 8) % 1;
    const drift = boiling ? (i / 8) * Math.PI * 2 : heading + (i - 3.5) * 0.28;
    const angle = drift + Math.sin(phase + i) * 0.2;
    const dist = radius * (0.4 + life * 2.5);
    ctx.globalAlpha = alpha * (1 - life) * 0.95;
    ctx.fillStyle = life < 0.3 ? '#fff8e4' : '#ff5a14';
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 1.2 + (1 - life) * 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFireTrail(points) {
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255, 48, 0, 0.28)';
  ctx.lineWidth = 18;
  strokePath(points);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 122, 16, 0.78)';
  ctx.lineWidth = 8;
  strokePath(points);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 236, 176, 0.9)';
  ctx.lineWidth = 2.6;
  strokePath(points);
  ctx.stroke();

  const start = Math.max(0, points.length - 14);
  const wobble = performance.now() / 70;
  for (let i = start; i < points.length; i += 1) {
    const t = (i - start) / 14;
    ctx.globalAlpha = 0.2 + t * 0.65;
    ctx.fillStyle = t > 0.72 ? '#fff3c8' : '#ff5310';
    ctx.beginPath();
    ctx.arc(
      points[i].x,
      points[i].y + Math.sin(wobble + i) * 1.6,
      2.4 + t * 5.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawHat(kind, radius, accent) {
  if (!kind || kind === 'none') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -radius * 0.15, radius * 0.42, 0, Math.PI * 2);
    ctx.moveTo(-radius * 0.28, radius * 0.12);
    ctx.lineTo(radius * 0.28, -radius * 0.42);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const r = radius;
  ctx.save();
  if (kind === 'cap') {
    ctx.fillStyle = '#162033';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.95, r * 0.72, r * 0.48, 0, Math.PI, 0, true);
    ctx.fill();
    ctx.fillStyle = accent || '#ff2a55';
    ctx.fillRect(-r * 0.7, -r * 0.98, r * 1.4, r * 0.08);
    ctx.fillStyle = '#162033';
    ctx.beginPath();
    ctx.ellipse(r * 0.55, -r * 0.62, r * 0.5, r * 0.13, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'beanie') {
    ctx.fillStyle = '#6d28d9';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.82, r * 0.78, r * 0.58, 0, Math.PI, 0, true);
    ctx.lineTo(r * 0.78, -r * 0.62);
    ctx.quadraticCurveTo(0, -r * 0.38, -r * 0.78, -r * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ddd6fe';
    ctx.fillRect(-r * 0.78, -r * 0.72, r * 1.56, r * 0.14);
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.arc(0, -r * 1.38, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'tophat') {
    ctx.fillStyle = '#12141c';
    ctx.fillRect(-r * 0.4, -r * 1.95, r * 0.8, r * 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.02, r * 0.9, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff2a55';
    ctx.fillRect(-r * 0.4, -r * 1.18, r * 0.8, r * 0.12);
  } else if (kind === 'crown') {
    ctx.fillStyle = '#f6c445';
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, -r * 0.55);
    ctx.lineTo(-r * 0.72, -r * 1.2);
    ctx.lineTo(-r * 0.36, -r * 0.78);
    ctx.lineTo(0, -r * 1.48);
    ctx.lineTo(r * 0.36, -r * 0.78);
    ctx.lineTo(r * 0.72, -r * 1.2);
    ctx.lineTo(r * 0.72, -r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -r * 0.72, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff2a55';
    ctx.beginPath();
    ctx.arc(-r * 0.36, -r * 0.66, r * 0.06, 0, Math.PI * 2);
    ctx.arc(r * 0.36, -r * 0.66, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGlasses(kind, radius) {
  if (!kind || kind === 'none') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.38, 0, Math.PI * 2);
    ctx.moveTo(-radius * 0.26, radius * 0.26);
    ctx.lineTo(radius * 0.26, -radius * 0.26);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const r = radius;
  const eyeY = -r * 0.18;
  ctx.save();
  if (kind === 'rounds') {
    ctx.strokeStyle = '#f4efe2';
    ctx.lineWidth = Math.max(1.4, r * 0.08);
    ctx.beginPath();
    ctx.arc(-r * 0.32, eyeY, r * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.3, eyeY, r * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.04, eyeY);
    ctx.lineTo(r * 0.02, eyeY);
    ctx.moveTo(-r * 0.58, eyeY);
    ctx.lineTo(-r * 0.82, eyeY - r * 0.04);
    ctx.moveTo(r * 0.56, eyeY);
    ctx.lineTo(r * 0.82, eyeY - r * 0.04);
    ctx.stroke();
  } else if (kind === 'shades') {
    ctx.fillStyle = 'rgba(8, 10, 18, 0.92)';
    roundBox(-r * 0.62, eyeY - r * 0.22, r * 0.52, r * 0.4, r * 0.08);
    roundBox(r * 0.08, eyeY - r * 0.22, r * 0.52, r * 0.4, r * 0.08);
    ctx.fillStyle = '#111';
    ctx.fillRect(-r * 0.1, eyeY - r * 0.04, r * 0.2, r * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.46, eyeY - r * 0.08, r * 0.08, r * 0.05, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'visor') {
    ctx.fillStyle = 'rgba(0, 240, 255, 0.38)';
    ctx.strokeStyle = '#d8fbff';
    ctx.lineWidth = 1.3;
    roundBox(-r * 0.78, eyeY - r * 0.2, r * 1.56, r * 0.38, r * 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

function roundBox(x, y, width, height, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, width, height, radius);
  else ctx.rect(x, y, width, height);
  ctx.fill();
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
    body.addColorStop(0, 'rgba(255, 255, 255, 0.78)');
    body.addColorStop(0.42, hexAlpha(color, 0.62));
    body.addColorStop(1, hexAlpha(color, 0.1));
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

  if (options.glasses && options.glasses !== 'none') drawGlasses(options.glasses, radius);
  if (options.hat && options.hat !== 'none') drawHat(options.hat, radius, color);

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
    const alpha = 0.55 + ((index + 1) / echoes.length) * 0.4;
    drawLitRibbon(echo, echoColor, 2.3, Math.min(1, alpha));
  });

  echoes.forEach((echo, index) => {
    if (!echo.length) return;
    const clock = ghostFrame();
    const frameIndex = ((clock % echo.length) + echo.length) % echo.length;
    const ghost = echo[frameIndex];
    const previous = echo[Math.max(0, frameIndex - 2)];
    const lean = clamp(ghost.x - previous.x, -8, 8) / 8 * 0.55;
    const newest = index === echoes.length - 1;
    const near = proximity(ghost.x, ghost.y);
    drawAfterimages(echo, frameIndex, echoColor, true);
    drawSpirit(ghost.x, ghost.y, {
      color: echoColor,
      radius: 17,
      alpha: Math.min(1, (newest ? 0.78 : 0.56) + near * 0.28),
      phase: performance.now() / 190 + index * 1.3,
      lean,
      hollow: true,
      hat: echoHat,
      glasses: echoGlasses,
    });
  });
}

function coinById(kind) {
  return COINS.find((coin) => coin.id === kind) ?? COINS[0];
}

function fillDiamond(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}

function quadPoint(start, control, end, t) {
  const u = 1 - t;
  return {
    x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
    y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
  };
}

function quadTangent(start, control, end, t) {
  const u = 1 - t;
  return {
    x: 2 * u * (control.x - start.x) + 2 * t * (end.x - control.x),
    y: 2 * u * (control.y - start.y) + 2 * t * (end.y - control.y),
  };
}

function fillRibbon(start, control, end, half) {
  const steps = 12;
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = quadPoint(start, control, end, t);
    const tangent = quadTangent(start, control, end, t);
    const length = Math.hypot(tangent.x, tangent.y) || 1;
    const nx = (-tangent.y / length) * half;
    const ny = (tangent.x / length) * half;
    left.push([point.x + nx, point.y + ny]);
    right.push([point.x - nx, point.y - ny]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  left.forEach(([x, y]) => ctx.lineTo(x, y));
  for (let i = right.length - 1; i >= 0; i -= 1) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
}

function paintBitcoin(radius, color) {
  const r = radius * 0.78;
  ctx.fillStyle = color;
  ctx.fillRect(-r * 0.18, -r * 0.7, r * 0.12, r * 1.4);
  ctx.fillRect(r * 0.04, -r * 0.7, r * 0.12, r * 1.4);
  ctx.beginPath();
  ctx.moveTo(-r * 0.38, -r * 0.46);
  ctx.lineTo(r * 0.02, -r * 0.46);
  ctx.arc(r * 0.02, -r * 0.23, r * 0.23, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-r * 0.38, 0);
  ctx.closePath();
  ctx.moveTo(-r * 0.16, -r * 0.34);
  ctx.lineTo(-r * 0.02, -r * 0.34);
  ctx.arc(-r * 0.02, -r * 0.23, r * 0.11, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(-r * 0.16, -r * 0.12);
  ctx.closePath();
  ctx.fill('evenodd');
  ctx.beginPath();
  ctx.moveTo(-r * 0.38, r * 0.04);
  ctx.lineTo(r * 0.06, r * 0.04);
  ctx.arc(r * 0.06, r * 0.26, r * 0.26, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-r * 0.38, r * 0.52);
  ctx.closePath();
  ctx.moveTo(-r * 0.16, r * 0.14);
  ctx.lineTo(r * 0.02, r * 0.14);
  ctx.arc(r * 0.02, r * 0.26, r * 0.12, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(-r * 0.16, r * 0.38);
  ctx.closePath();
  ctx.fill('evenodd');
}

function drawBitcoinMark(radius) {
  ctx.save();
  ctx.translate(radius * 0.045, radius * 0.06);
  paintBitcoin(radius, '#7a3404');
  ctx.restore();
  const metal = ctx.createLinearGradient(-radius, -radius, radius * 0.4, radius);
  metal.addColorStop(0, '#ffc56a');
  metal.addColorStop(0.42, '#f7931a');
  metal.addColorStop(1, '#c45c00');
  paintBitcoin(radius, metal);
}

function traceFacet(points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.closePath();
}

function drawEthereumMark(radius) {
  const w = radius * 0.52;
  const top = -radius * 0.58;
  const waist = -radius * 0.04;
  const notch = radius * 0.12;
  const under = radius * 0.22;
  const gap = radius * 0.3;
  const bottom = radius * 0.62;
  const faces = [
    [[0, top], [-w, waist], [0, notch], '#d5defc', '#9aafef'],
    [[0, top], [w, waist], [0, notch], '#8ea2e6', '#5d74c4'],
    [[-w, waist], [0, under], [0, notch], '#c3d0f8', '#8ea4e4'],
    [[w, waist], [0, under], [0, notch], '#6f86d4', '#4c63b4'],
    [[-w, gap], [0, bottom], [0, gap + radius * 0.1], '#c9d4f8', '#93a8ea'],
    [[w, gap], [0, bottom], [0, gap + radius * 0.1], '#7d92dc', '#556db8'],
  ];
  ctx.save();
  ctx.translate(radius * 0.03, radius * 0.05);
  ctx.globalAlpha = 0.28;
  faces.forEach((face) => {
    traceFacet(face.slice(0, 3));
    ctx.fillStyle = '#1d2a55';
    ctx.fill();
  });
  ctx.restore();
  faces.forEach((face) => {
    const [a, b, c, light, shade] = face;
    traceFacet([a, b, c]);
    const gradient = ctx.createLinearGradient(a[0], a[1], c[0], b[1]);
    gradient.addColorStop(0, light);
    gradient.addColorStop(1, shade);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(28, 42, 92, 0.35)';
    ctx.lineWidth = Math.max(0.6, radius * 0.03);
    ctx.stroke();
  });
}

function drawXrpMark(radius) {
  const bands = [
    [{ x: -radius * 0.62, y: -radius * 0.5 }, { x: 0, y: radius * 0.16 }, { x: radius * 0.62, y: -radius * 0.5 }],
    [{ x: -radius * 0.62, y: radius * 0.5 }, { x: 0, y: -radius * 0.16 }, { x: radius * 0.62, y: radius * 0.5 }],
  ];
  bands.forEach(([start, control, end]) => {
    ctx.save();
    ctx.translate(radius * 0.03, radius * 0.045);
    ctx.fillStyle = 'rgba(20, 12, 4, 0.45)';
    fillRibbon(start, control, end, radius * 0.15);
    ctx.restore();
    const ink = ctx.createLinearGradient(start.x, start.y, end.x, end.y + radius * 0.2);
    ink.addColorStop(0, '#3a2a18');
    ink.addColorStop(0.45, '#14110e');
    ink.addColorStop(1, '#2a2118');
    ctx.fillStyle = ink;
    fillRibbon(start, control, end, radius * 0.16);
  });
}

function drawSolanaMark(radius) {
  const rows = [
    ['#7ae7ff', '#3ef0c2'],
    ['#b08cff', '#6eb6ff'],
    ['#e56bff', '#9b86ff'],
  ];
  rows.forEach((pair, index) => {
    const y = (index - 1) * radius * 0.3;
    const h = radius * 0.15;
    const skew = radius * 0.16;
    const left = -radius * 0.48;
    const right = radius * 0.48;
    const points = [
      [left, y + h],
      [left + skew, y],
      [right, y],
      [right - skew, y + h],
    ];
    ctx.save();
    ctx.translate(radius * 0.03, radius * 0.04);
    traceFacet(points);
    ctx.fillStyle = 'rgba(18, 10, 40, 0.4)';
    ctx.fill();
    ctx.restore();
    traceFacet(points);
    const gradient = ctx.createLinearGradient(left, y, right, y + h);
    gradient.addColorStop(0, pair[0]);
    gradient.addColorStop(1, pair[1]);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(points[1][0], points[1][1]);
    ctx.lineTo(points[2][0], points[2][1]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = Math.max(0.7, radius * 0.035);
    ctx.stroke();
  });
}

function drawDogeMark(radius) {
  const paint = (color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.22, -radius * 0.46);
    ctx.lineTo(-radius * 0.22, radius * 0.46);
    ctx.lineTo(radius * 0.02, radius * 0.46);
    ctx.arc(radius * 0.02, 0, radius * 0.46, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath();
    ctx.moveTo(-radius * 0.04, -radius * 0.2);
    ctx.arc(radius * 0.04, 0, radius * 0.2, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-radius * 0.04, radius * 0.2);
    ctx.closePath();
    ctx.fill('evenodd');
    ctx.fillRect(-radius * 0.5, -radius * 0.07, radius * 0.42, radius * 0.14);
  };
  ctx.save();
  ctx.translate(radius * 0.04, radius * 0.05);
  paint('#120e08');
  ctx.restore();
  paint('#1c140c');
}

function drawBnbMark(radius) {
  const core = radius * 0.14;
  const arm = radius * 0.2;
  const reach = core + arm + radius * 0.07;
  const pieces = [
    [0, 0, core],
    [0, -reach, arm],
    [0, reach, arm],
    [-reach, 0, core],
    [reach, 0, core],
  ];
  ctx.save();
  ctx.translate(radius * 0.03, radius * 0.04);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#3a1e06';
  pieces.forEach(([x, y, size]) => fillDiamond(x, y, size));
  ctx.restore();
  pieces.forEach(([x, y, size]) => {
    traceFacet([
      [x, y - size],
      [x + size, y],
      [x, y + size],
      [x - size, y],
    ]);
    const face = ctx.createLinearGradient(x, y - size, x, y + size);
    face.addColorStop(0, '#ffe29a');
    face.addColorStop(0.55, '#e39b16');
    face.addColorStop(1, '#8a4e0a');
    ctx.fillStyle = face;
    ctx.fill();
  });
}

function drawCryptoMark(kind, radius) {
  if (kind === 'eth') drawEthereumMark(radius);
  else if (kind === 'xrp') drawXrpMark(radius);
  else if (kind === 'sol') drawSolanaMark(radius);
  else if (kind === 'doge') drawDogeMark(radius);
  else if (kind === 'bnb') drawBnbMark(radius);
  else drawBitcoinMark(radius);
}

function drawCryptoCoin(x, y, radius, kind) {
  ctx.save();
  ctx.translate(x, y);
  const haze = ctx.createRadialGradient(0, -radius * 0.1, radius * 0.2, 0, 0, radius * 2.5);
  haze.addColorStop(0, 'rgba(240, 193, 75, 0.18)');
  haze.addColorStop(1, 'rgba(240, 193, 75, 0)');
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.ellipse(1, radius * 1.02, radius * 0.86, radius * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4e2c0a';
  ctx.beginPath();
  ctx.arc(0, radius * 0.1, radius, 0, Math.PI * 2);
  ctx.fill();

  const rim = ctx.createLinearGradient(-radius, -radius, radius * 0.8, radius);
  rim.addColorStop(0, '#e4c98a');
  rim.addColorStop(0.28, '#c4963a');
  rim.addColorStop(0.62, '#8d6216');
  rim.addColorStop(1, '#4a2c0c');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.96, 0, Math.PI * 2);
  ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2, true);
  ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(74, 38, 8, 0.55)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 36; i += 1) {
    const angle = (i / 36) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.78, Math.sin(angle) * radius * 0.78);
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.stroke();
  }
  ctx.restore();

  const face = ctx.createRadialGradient(-radius * 0.32, -radius * 0.38, radius * 0.04, radius * 0.1, radius * 0.16, radius * 0.78);
  face.addColorStop(0, '#e6c98a');
  face.addColorStop(0.38, '#c99632');
  face.addColorStop(0.78, '#9a6c14');
  face.addColorStop(1, '#6e4510');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.74, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(92, 52, 8, 0.55)';
  ctx.lineWidth = Math.max(1, radius * 0.045);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 236, 196, 0.28)';
  ctx.lineWidth = Math.max(0.6, radius * 0.02);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.64, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.66, 0, Math.PI * 2);
  ctx.clip();
  drawCryptoMark(kind, radius);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 236, 196, 0.38)';
  ctx.lineWidth = Math.max(0.8, radius * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.88, Math.PI * 1.15, Math.PI * 1.72);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 244, 214, 0.42)';
  ctx.beginPath();
  ctx.arc(-radius * 0.42, -radius * 0.38, Math.max(0.8, radius * 0.045), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGlow(x, y, radius, color, peak) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const light = ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius);
  light.addColorStop(0, `rgba(${color}, ${peak})`);
  light.addColorStop(0.35, `rgba(${color}, ${peak * 0.35})`);
  light.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSceneLights() {
  drawGlow(player.x, player.y, 230, '255, 150, 60', 0.62);
  drawGlow(player.x, player.y, 70, '255, 230, 180', 0.5);
}

function drawPickups() {
  const now = performance.now();
  collectibles.forEach((coin, index) => {
    const bob = Math.sin(now / 220 + index) * 3;
    drawCryptoCoin(coin.x, coin.y + bob, coin.radius, coinById(coin.kind).id);
  });

  for (const power of powerups) {
    if (power.type === 'SHIELD') drawShieldIcon(power.x, power.y);
    else if (power.type === 'MISSILE') drawMissileIcon(power.x, power.y);
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

function drawRocket(angle) {
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = '#ffb423';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-18, -3.5);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-18, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff6e8';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-7, 5);
  ctx.lineTo(-7, -5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff3b30';
  ctx.beginPath();
  ctx.moveTo(-2, -5);
  ctx.lineTo(-8, -9);
  ctx.lineTo(-7, -4);
  ctx.closePath();
  ctx.moveTo(-2, 5);
  ctx.lineTo(-8, 9);
  ctx.lineTo(-7, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMissileIcon(x, y) {
  const bob = Math.sin(performance.now() / 220) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
  glow.addColorStop(0, 'rgba(255, 120, 40, 0.55)');
  glow.addColorStop(1, 'rgba(255, 60, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = '#ff5a1f';
  ctx.shadowBlur = 12;
  drawRocket(-Math.PI / 2);
  ctx.restore();
}

function drawMissile() {
  if (missile) {
    ctx.save();
    missile.trail.forEach((point, index) => {
      const t = (index + 1) / missile.trail.length;
      ctx.globalAlpha = t * 0.75;
      ctx.fillStyle = t > 0.65 ? '#fff1c2' : '#ff4a00';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.5 + t * 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.translate(missile.x, missile.y);
    const angle = Math.atan2(missile.vy, missile.vx);
    ctx.shadowColor = '#ff6a00';
    ctx.shadowBlur = 16;
    drawRocket(angle);
    ctx.restore();
  }

  for (const impact of impacts) {
    const t = 1 - impact.life / 28;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = '#ffb423';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, 8 + t * 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 244, 210, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, 4 + t * 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
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

function fireHeading() {
  const speed = Math.hypot(player.vx, player.vy);
  if (speed < 0.35) return -Math.PI / 2;
  return Math.atan2(-player.vy, -player.vx);
}

function drawPlayer() {
  const phase = performance.now() / 90;
  const flickering = grace > 0 && Math.floor(grace / 4) % 2 === 0;
  if (currentPath.length > 1) drawFireTrail(currentPath);
  const speed = Math.hypot(player.vx, player.vy);
  drawFireball(player.x, player.y, 20, phase, flickering ? 0.45 : 1, speed < 0.35 ? null : fireHeading());

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

function drawJoystick() {
  if (!joystick.active) return;
  ctx.save();
  ctx.translate(joystick.ox, joystick.oy);
  ctx.fillStyle = 'rgba(8, 12, 22, 0.42)';
  ctx.beginPath();
  ctx.arc(0, 0, JOYSTICK_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 148, 40, 0.95)';
  ctx.strokeStyle = 'rgba(255, 236, 190, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(joystick.x * JOYSTICK_RADIUS, joystick.y * JOYSTICK_RADIUS, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
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
  const cy = view.h * 0.5;
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
  drawSpirit(cx + Math.cos(time + 2.2) * 86, cy + Math.sin(time + 2.2) * 36, {
    color: echoColor,
    radius: 18,
    phase: time * 3,
    lean: Math.cos(time) * 0.3,
    hollow: true,
    hat: echoHat,
    glasses: echoGlasses,
  });
  drawFireball(
    cx + Math.cos(time) * 86,
    cy + Math.sin(time) * 36,
    18,
    time * 6,
    1,
    Math.atan2(-Math.cos(time) * 36, Math.sin(time) * 86),
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
    drawSceneLights();
    drawEchoes();
    drawPickups();
    drawParticles();
    drawMissile();
    drawPlayer();
    drawDragReticle();
    drawJoystick();
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
  if (!document.getElementById('shop-screen').classList.contains('hidden')) renderPreview();
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

let slide = null;

function fieldLimits() {
  return {
    minX: player.radius,
    maxX: view.w - player.radius,
    minY: player.radius,
    maxY: view.h - player.radius,
  };
}

function beginSlide(event) {
  if (slide || gameState !== 'PLAYING') return;
  const point = pointFromEvent(event);
  slide = { id: event.pointerId, x: point.x, y: point.y };
  isDragging = true;
  player.targetX = player.x;
  player.targetY = player.y;
  try { canvas.setPointerCapture(event.pointerId); } catch { /* synthetic pointers */ }
}

function moveSlide(event) {
  if (!slide || event.pointerId !== slide.id || gameState !== 'PLAYING') return;
  const point = pointFromEvent(event);
  const next = slideBy(player.x, player.y, point.x - slide.x, point.y - slide.y, fieldLimits());
  slide.x = point.x;
  slide.y = point.y;
  player.x = next.x;
  player.y = next.y;
  player.targetX = next.x;
  player.targetY = next.y;
}

function endSlide(event) {
  if (!slide) return;
  if (event && event.pointerId !== slide.id) return;
  slide = null;
  isDragging = false;
}

function endDrag() {
  isDragging = false;
  slide = null;
}

function updateJoystick(event) {
  const point = pointFromEvent(event);
  const vector = joystickVector(point.x - joystick.ox, point.y - joystick.oy, JOYSTICK_RADIUS);
  joystick.x = vector.x;
  joystick.y = vector.y;
  joystick.amount = vector.amount;
}

function endJoystick(event) {
  if (!joystick.active) return;
  if (event && event.pointerId !== joystick.pointerId) return;
  clearJoystick();
}

function bindInput() {
  canvas.addEventListener('pointerdown', (event) => {
    if (gameState !== 'PLAYING') return;
    AudioEngine.unlock();
    beginSlide(event);
  });
  canvas.addEventListener('pointermove', moveSlide);
  window.addEventListener('pointermove', moveSlide);
  window.addEventListener('pointerup', (event) => {
    endJoystick(event);
    endSlide(event);
  });
  window.addEventListener('pointercancel', (event) => {
    endJoystick(event);
    endSlide(event);
  });

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
    slide = null;
    clearJoystick();
  });
  window.addEventListener('resize', resizeCanvas);
}

function bindUI() {
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('retry-btn').addEventListener('click', startGame);
  document.getElementById('shop-btn').addEventListener('click', openShop);
  document.getElementById('close-shop').addEventListener('click', closeShop);
  document.getElementById('menu-btn').addEventListener('click', returnToMenu);
  document.getElementById('try-on-buy').addEventListener('click', confirmTryOn);
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
    buyCosmetic,
    confirmTryOn,
    tryOn: () => ({
      pinned: { ...pinnedTry },
      hover: hoverTry ? { ...hoverTry } : null,
      last: lastTry ? { ...lastTry } : null,
      caption: document.getElementById('try-on-caption')?.textContent ?? '',
      buyLabel: document.getElementById('try-on-buy')?.textContent ?? '',
      buyHidden: document.getElementById('try-on-buy')?.hidden ?? true,
    }),
    joystick: () => ({ ...joystick }),
    placePlayer(x, y) {
      player.x = x;
      player.y = y;
      player.targetX = x;
      player.targetY = y;
    },
    placeCoins(list) {
      collectibles = list.map((coin, index) => ({
        radius: COIN_RADIUS,
        kind: COINS[index % COINS.length].id,
        ...coin,
      }));
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
    setRound(round) {
      currentRound = round;
    },
    respawn() {
      spawnCollectibles();
    },
    state: () => ({
      gameState,
      score,
      coins,
      currentRound,
      echoCount: echoes.length,
      pathLength: currentPath.length,
      pathHead: currentPath[0] ? { ...currentPath[0] } : null,
      pathTail: currentPath.length ? { ...currentPath[currentPath.length - 1] } : null,
      missile: missile ? { x: missile.x, y: missile.y, trail: missile.trail.length } : null,
      collectibles: collectibles.map((coin) => ({ ...coin })),
      powerups: powerups.map((power) => ({ ...power })),
      activePowerup,
      powerupTimer,
      grace,
      roundFrame,
      pressure: roundPressure(currentRound),
      ghost: echoes[0]?.length ? { ...ghostPoint(echoes[0], ghostFrame()) } : null,
      player: { x: player.x, y: player.y, targetX: player.targetX, targetY: player.targetY, radius: player.radius },
      echoColor,
      echoHat,
      echoGlasses,
      unlockedColors: [...unlockedColors],
      unlockedHats: [...unlockedHats],
      unlockedGlasses: [...unlockedGlasses],
      bestScore,
      bestRound,
      gamesPlayed,
      bannerText,
      view: { w: view.w, h: view.h },
    }),
  };
}
