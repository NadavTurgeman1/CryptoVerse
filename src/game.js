import {
  applyCosmetic,
  buyCharge,
  clamp,
  clampInt,
  dropOldestEcho,
  echoClock,
  GHOST_SPEED,
  ghostPoint,
  roundPressure,
  stepHoming,
  joystickVector,
  meteorVelocity,
  pickMeteorEnds,
  pickPowerType,
  pickSpawn,
  shouldSpawnMeteor,
  previewLoadout,
  slideBy,
  safeJson,
  sanitizeUnlocks,
  sealPath,
  spendCharge,
  takeOverlaps,
  itemOffer,
} from './logic.js';
import { UI_LANGS, languageOffer, translate } from './i18n.js';
import { FLAGS, countryName, drawFlag, flagById, flagInk, flagTrail, flagsSorted, paintGhostFlag } from './flags.js';
import { openStore, showRewardedAd, storeUrl } from './ads.js';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const COLORS = [
  { id: '#ff2a55', nameKey: 'rose', price: 0, slot: 'color' },
  { id: '#00f0ff', nameKey: 'cyan', price: 50, slot: 'color' },
  { id: '#b388ff', nameKey: 'violet', price: 80, slot: 'color' },
  { id: '#00ff66', nameKey: 'matrix', price: 100, slot: 'color' },
  { id: '#ffbb00', nameKey: 'gold', price: 150, slot: 'color' },
  { id: '#ff5a1f', nameKey: 'ember', price: 70, slot: 'color' },
  { id: '#b6ff3b', nameKey: 'lime', price: 80, slot: 'color' },
  { id: '#d7f7ff', nameKey: 'ice', price: 90, slot: 'color' },
  { id: '#ff3dce', nameKey: 'magenta', price: 110, slot: 'color' },
  { id: '#3d5bff', nameKey: 'royal', price: 140, slot: 'color' },
  { id: '#ff9f1c', nameKey: 'amber', price: 120, slot: 'color' },
  { id: '#3dffe0', nameKey: 'mint', price: 130, slot: 'color' },
  { id: '#f7f1e3', nameKey: 'pearl', price: 160, slot: 'color' },
  { id: '#e11d48', nameKey: 'crimson', price: 170, slot: 'color' },
  { id: '#ff7a3c', nameKey: 'sunset', price: 180, slot: 'color' },
  { id: '#7c5cff', nameKey: 'void', price: 220, slot: 'color' },
  { id: '#ffb4a2', nameKey: 'peach', price: 95, slot: 'color' },
  { id: '#1478ff', nameKey: 'ocean', price: 150, slot: 'color' },
  { id: '#c6ff00', nameKey: 'toxic', price: 210, slot: 'color' },
  { id: 'prism', nameKey: 'prism', price: 980, slot: 'color' },
];

const HATS = [
  { id: 'none', nameKey: 'none', price: 0, slot: 'hat' },
  { id: 'cap', nameKey: 'cap', price: 40, slot: 'hat' },
  { id: 'beanie', nameKey: 'beanie', price: 75, slot: 'hat' },
  { id: 'tophat', nameKey: 'tophat', price: 120, slot: 'hat' },
  { id: 'crown', nameKey: 'crown', price: 200, slot: 'hat' },
  { id: 'santa', nameKey: 'santa', price: 180, slot: 'hat' },
  { id: 'dogears', nameKey: 'dogears', price: 140, slot: 'hat' },
  { id: 'catears', nameKey: 'catears', price: 140, slot: 'hat' },
  { id: 'bunny', nameKey: 'bunny', price: 160, slot: 'hat' },
  { id: 'pirate', nameKey: 'pirate', price: 240, slot: 'hat' },
  { id: 'astro', nameKey: 'astro', price: 520, slot: 'hat' },
  { id: 'party', nameKey: 'party', price: 90, slot: 'hat' },
  { id: 'cowboy', nameKey: 'cowboy', price: 200, slot: 'hat' },
  { id: 'wizard', nameKey: 'wizard', price: 280, slot: 'hat' },
  { id: 'beret', nameKey: 'beret', price: 110, slot: 'hat' },
  { id: 'halo', nameKey: 'halo', price: 360, slot: 'hat' },
  { id: 'viking', nameKey: 'viking', price: 210, slot: 'hat' },
  { id: 'chef', nameKey: 'chef', price: 150, slot: 'hat' },
  { id: 'flower', nameKey: 'flower', price: 130, slot: 'hat' },
  { id: 'horns', nameKey: 'horns', price: 170, slot: 'hat' },
  { id: 'propeller', nameKey: 'propeller', price: 160, slot: 'hat' },
  { id: 'sombrero', nameKey: 'sombrero', price: 220, slot: 'hat' },
  { id: 'headphones', nameKey: 'headphones', price: 190, slot: 'hat' },
  { id: 'banana', nameKey: 'banana', price: 250, slot: 'hat' },
  { id: 'bag', nameKey: 'bag', price: 80, slot: 'hat' },
  { id: 'imperial', nameKey: 'imperial', price: 640, slot: 'hat' },
];

const GLASSES = [
  { id: 'none', nameKey: 'none', price: 0, slot: 'glasses' },
  { id: 'rounds', nameKey: 'rounds', price: 45, slot: 'glasses' },
  { id: 'shades', nameKey: 'shades', price: 90, slot: 'glasses' },
  { id: 'visor', nameKey: 'visor', price: 130, slot: 'glasses' },
  { id: 'shade-red', nameKey: 'shadeRed', price: 100, slot: 'glasses' },
  { id: 'shade-blue', nameKey: 'shadeBlue', price: 100, slot: 'glasses' },
  { id: 'shade-gold', nameKey: 'shadeGold', price: 140, slot: 'glasses' },
  { id: 'shade-green', nameKey: 'shadeGreen', price: 100, slot: 'glasses' },
  { id: 'shade-pink', nameKey: 'shadePink', price: 110, slot: 'glasses' },
  { id: 'shade-violet', nameKey: 'shadeViolet', price: 110, slot: 'glasses' },
  { id: 'shade-white', nameKey: 'shadeWhite', price: 120, slot: 'glasses' },
  { id: 'shade-amber', nameKey: 'shadeAmber', price: 120, slot: 'glasses' },
  { id: 'patch', nameKey: 'patch', price: 160, slot: 'glasses' },
  { id: 'monocle', nameKey: 'monocle', price: 200, slot: 'glasses' },
  { id: 'stereo', nameKey: 'stereo', price: 120, slot: 'glasses' },
  { id: 'hearts', nameKey: 'hearts', price: 100, slot: 'glasses' },
  { id: 'stars', nameKey: 'stars', price: 110, slot: 'glasses' },
  { id: 'goggles', nameKey: 'goggles', price: 230, slot: 'glasses' },
  { id: 'aviator', nameKey: 'aviator', price: 180, slot: 'glasses' },
  { id: 'nerd', nameKey: 'nerd', price: 70, slot: 'glasses' },
  { id: 'mustache', nameKey: 'mustache', price: 90, slot: 'glasses' },
];

const ADS_10 = new Set(['prism']);
const ADS_5 = new Set(['void', 'toxic']);
for (const item of COLORS) {
  if (!(item.price > 0)) continue;
  const key = item.nameKey || item.id;
  const tier = ADS_10.has(key) ? 10 : ADS_5.has(key) ? 5 : 0;
  const multiplier = tier === 10 ? 20 : tier === 5 ? 18 : 15;
  const floor = tier === 10 ? 6000 : tier === 5 ? 3400 : 750;
  item.price = Math.max(floor, item.price * multiplier);
  if (tier > 0) {
    item.ads = tier;
    item.offer = 'either';
  }
}
/** Runner cape colors mirror the double color catalog (same ids, prices, offers). */
const PLAYER_BODIES = COLORS.map((item) => ({
  id: item.id,
  nameKey: item.nameKey,
  price: item.price,
  slot: 'player',
  ...(item.offer ? { offer: item.offer } : {}),
  ...(item.ads ? { ads: item.ads } : {}),
}));

const COIN_PACKS = [
  { id: 'gold', nameKey: 'packGold', price: 0, slot: 'coins' },
  { id: 'crypto', nameKey: 'packCrypto', price: 9000, slot: 'coins' },
  { id: 'benjamin', nameKey: 'packBenjamin', price: 14000, slot: 'coins' },
  { id: 'diamond', nameKey: 'packDiamond', price: 18000, slot: 'coins' },
  { id: 'ruby', nameKey: 'packRuby', price: 18000, slot: 'coins' },
  { id: 'emerald', nameKey: 'packEmerald', price: 18000, slot: 'coins' },
  { id: 'holo', nameKey: 'packHolo', price: 24000, slot: 'coins' },
  { id: 'pixel', nameKey: 'packPixel', price: 16000, slot: 'coins' },
  { id: 'nova', nameKey: 'packNova', price: 26000, slot: 'coins' },
];

const SHOP = { color: COLORS, player: PLAYER_BODIES, coins: COIN_PACKS };
const FLAG_IDS = FLAGS.map((flag) => flag.id);
const POWERS = [
  { id: 'missile', slot: 'power', nameKey: 'powerMissile', detailKey: 'powerMissileDetail', price: 780 },
  { id: 'shield', slot: 'power', nameKey: 'powerShield', detailKey: 'powerShieldDetail', price: 1320 },
];
const DEAL_CAP = 2200;

function dayStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

const DEAL_BY_SUBJECT = {
  echo: ['color'],
  player: ['player'],
  coins: ['coins'],
};

function dealPool(slot) {
  return (SHOP[slot] || []).filter((item) => {
    const offer = itemOffer(item);
    return offer.kind === 'coin' && offer.price > 0 && offer.price <= DEAL_CAP;
  });
}

function dailyDealId(slot) {
  const pool = dealPool(slot);
  if (!pool.length) return '';
  let hash = 2166136261;
  const text = `${dayStamp()}:${slot}`;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return pool[(hash >>> 0) % pool.length].id;
}

function isDailyDeal(item) {
  return Boolean(item?.slot) && dailyDealId(item.slot) === item.id;
}

function salePrice(item) {
  const price = Math.max(0, Math.floor(Number(item?.price)) || 0);
  if (!isDailyDeal(item) || price <= 0) return price;
  return Math.max(1, Math.round(price * 0.9));
}
const COIN_RADIUS = 20;
const COINS = [
  { id: 'btc' },
  { id: 'eth' },
  { id: 'xrp' },
  { id: 'sol' },
  { id: 'doge' },
  { id: 'bnb' },
];
const JOYSTICK_RADIUS = 64;
const JOYSTICK_DEADZONE = 0.12;
/** Pixels per frame at full stick tilt — close to a firm finger slide. */
const JOYSTICK_SPEED = 8.2;

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
  missiles: 'echo_missile_stock',
  shields: 'echo_shield_stock',
  settings: 'echo_settings',
  tutorial: 'echo_tutorial_seen',
  flags: 'echo_flags',
  ghostFlag: 'echo_ghost_flag',
  meteorBody: 'echo_meteor_body',
  meteorTrail: 'echo_meteor_trail',
  meteorFlag: 'echo_meteor_flag',
  meteors: 'echo_meteor_bodies',
  trails: 'echo_meteor_trails',
  adProgress: 'echo_ad_progress',
  coinPack: 'echo_coin_pack',
  coinPacks: 'echo_coin_packs',
};

const STEP = 1000 / 60;
const SHIELD_FRAMES = 420;
const TRAIL_HOLD = 36;
const TRAIL_FADE = 28;
const SHIELD_END_GRACE = 24;
const COIN_BONUS = 5;
const COIN_SCORE = 250;
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
  musicVolume: 0.7,
  sfxVolume: 0.7,
  musicTimer: null,
  musicStep: 0,
  unlock() {
    this.ensure();
  },
  ensure(after) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
    }
    const go = () => {
      if (this.ctx.state !== 'running') return;
      if (this.musicVolume > 0) this.startMusic();
      if (after) after();
    };
    if (this.ctx.state === 'running') {
      go();
      return;
    }
    this.ctx.resume().then(go).catch(() => {});
  },
  apply(next) {
    this.musicVolume = clamp(Number(next.music) || 0, 0, 1);
    this.sfxVolume = clamp(Number(next.sfx) || 0, 0, 1);
    if (this.musicVolume > 0 && this.ctx) this.startMusic();
    else this.stopMusic();
  },
  play(freq, type, duration, level = 0.16, music = false) {
    const volume = music ? this.musicVolume : this.sfxVolume;
    if (volume <= 0) return;
    const fire = () => {
      try {
        if (!this.ctx || this.ctx.state !== 'running') return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        const peak = Math.max(0.0001, level * volume);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(peak, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(this.master || this.ctx.destination);
        osc.start();
        osc.stop(now + duration);
      } catch {
        /* sound is optional */
      }
    };
    if (!this.ctx || this.ctx.state !== 'running') {
      this.ensure(fire);
      return;
    }
    fire();
  },
  startMusic() {
    if (this.musicTimer || this.musicVolume <= 0) return;
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.musicTimer = -1;
    const notes = [196, 247, 294, 330, 294, 247];
    const tick = () => {
      if (this.musicVolume <= 0) {
        this.musicTimer = null;
        return;
      }
      this.play(notes[this.musicStep % notes.length], 'sine', 0.55, 0.055, true);
      this.musicStep += 1;
      this.musicTimer = window.setTimeout(tick, 780);
    };
    tick();
  },
  stopMusic() {
    if (typeof this.musicTimer === 'number' && this.musicTimer > 0) window.clearTimeout(this.musicTimer);
    this.musicTimer = null;
  },
  coin() { this.play(587.33, 'sine', 0.15); },
  sack() {
    this.play(311, 'triangle', 0.14, 0.07);
    window.setTimeout(() => this.play(466, 'sine', 0.16, 0.06), 70);
    window.setTimeout(() => this.play(698, 'sine', 0.28, 0.05), 150);
  },
  record() {
    this.play(523.25, 'triangle', 0.12, 0.07);
    window.setTimeout(() => this.play(659.25, 'triangle', 0.14, 0.07), 90);
    window.setTimeout(() => this.play(880, 'sine', 0.28, 0.06), 180);
  },
  hit() { this.play(120, 'sawtooth', 0.4); },
  powerup() { this.play(880, 'triangle', 0.3); },
  launch() { this.play(360, 'sawtooth', 0.16); },
  blast() { this.play(96, 'square', 0.22); },
  deny() { this.play(180, 'square', 0.08); },
  shieldBreak() {
    this.play(880, 'triangle', 0.07, 0.07);
    window.setTimeout(() => this.play(520, 'sine', 0.1, 0.06), 45);
    window.setTimeout(() => this.play(240, 'triangle', 0.18, 0.05), 100);
  },
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
let ghostFlag = '';
let unlockedFlags = [];
let playerBody = COLORS[0].id;
let playerFlag = '';
let unlockedBodies = [COLORS[0].id];
let adProgress = {};
let coinPack = 'gold';
let unlockedPacks = ['gold'];
let previewSubject = 'powers';
let continued = false;
let rateArmed = false;
let rateSawLeave = false;
let echoHat = 'none';
let unlockedHats = ['none'];
let echoGlasses = 'none';
let unlockedGlasses = ['none'];
let bestScore = 0;
let bestRound = 0;
let gamesPlayed = 0;
let missileStock = 0;
let shieldStock = 0;
let settings = { music: 0.7, sfx: 0.7, lang: 'en', control: 'touch' };
let shieldLayers = [];

const player = { x: 240, y: 400, radius: 14, targetX: 240, targetY: 400, vx: 0, vy: 0 };
let echoes = [];
let currentPath = [];
let collectibles = [];
let powerups = [];
let particles = [];
let missile = null;
let meteor = null;
let blasts = [];
let impacts = [];
let grace = 0;
let roundFrame = 0;
let skipFrameTick = false;
let bannerText = '';
let bannerTimer = 0;
let bannerQueue = [];
let tutorialActive = false;
let tutorialWallet = 0;
let tutorialStep = '';
let tutorialStepFrames = 0;
let tutorialAwaitMeteor = false;
let recordNoted = false;
let recordFlash = 0;
let coinFlashes = [];

const sackImage = new Image();
sackImage.src = '/art/sack.png';
const bitcoinImage = new Image();
bitcoinImage.src = '/art/bitcoin.png';
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
const pinnedTry = { color: null, hat: null, glasses: null, player: null, trail: null, echoFlag: null, playerFlag: null, coins: null };
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

function sanitizeIdList(list, allowed) {
  const ok = new Set(allowed);
  return Array.isArray(list) ? list.filter((id) => ok.has(id)) : [];
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

function isUiLang(lang) {
  return UI_LANGS.includes(lang);
}

function t(key, vars) {
  return translate(settings.lang, key, vars);
}

function isFlagSlot(slot) {
  return slot === 'echoFlag' || slot === 'playerFlag';
}

function flagSlot() {
  return previewSubject === 'player' ? 'playerFlag' : 'echoFlag';
}

function itemLabel(item) {
  if (isFlagSlot(item?.slot)) return countryName(item.id, settings.lang);
  return t(item.nameKey);
}

function savedLevel(value, fallback) {
  if (typeof value === 'number') return clamp(value, 0, 1);
  if (value === true) return fallback > 0 ? fallback : 0.7;
  if (value === false) return 0;
  return fallback;
}

function loadSettings() {
  const saved = safeJson(storageGet(STORAGE.settings), {});
  const legacy = typeof saved.volume === 'number' ? clamp(saved.volume, 0, 1) : 0.7;
  settings = {
    music: savedLevel(saved.music, legacy),
    sfx: savedLevel(saved.sfx, saved.effects === false ? 0 : legacy),
    lang: isUiLang(saved.lang) ? saved.lang : 'en',
    control: saved.control === 'joystick' ? 'joystick' : 'touch',
  };
  AudioEngine.apply(settings);
}

function usesJoystick() {
  return settings.control === 'joystick';
}

function saveSettings() {
  storageSet(STORAGE.settings, JSON.stringify(settings));
  AudioEngine.apply(settings);
}

function applyLanguage() {
  const root = document.getElementById('game-container');
  document.documentElement.lang = settings.lang;
  document.documentElement.dir = 'ltr';
  root.dataset.lang = settings.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  hudCache.clear();
  syncHUD();
  syncMenu();
  if (!document.getElementById('shop-screen').classList.contains('hidden')) renderShop();
  document.querySelectorAll('.flag-search').forEach((field) => {
    field.placeholder = t('flagSearch');
  });
  syncSettingsForm();
}

function savedLanguage() {
  const saved = safeJson(storageGet(STORAGE.settings), {});
  return isUiLang(saved.lang) ? saved.lang : null;
}

let offeredLang = null;

function offerLanguage() {
  const prompt = document.getElementById('lang-prompt');
  if (!prompt) return;
  offeredLang = languageOffer(navigator.languages || [navigator.language], savedLanguage());
  prompt.classList.toggle('hidden', !offeredLang);
  if (!offeredLang) return;
  document.getElementById('lang-prompt-text').textContent = translate(offeredLang, 'langPrompt');
  document.getElementById('lang-yes').textContent = translate(offeredLang, 'langYes');
}

function chooseLanguage(lang) {
  settings.lang = isUiLang(lang) ? lang : 'en';
  saveSettings();
  applyLanguage();
  document.getElementById('lang-prompt')?.classList.add('hidden');
  maybeShowTutorial();
}

function buzz(kind) {
  if (Capacitor.isNativePlatform()) {
    const pulse = kind === 'death'
      ? Haptics.notification({ type: NotificationType.Error })
      : Haptics.impact({ style: kind === 'shield' ? ImpactStyle.Medium : ImpactStyle.Light });
    void pulse.catch(() => {});
    return;
  }
  if (typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(kind === 'death' ? [24, 36, 70] : kind === 'shield' ? 22 : 14);
}

function openTutorial() {
  startTutorial();
}

function closeTutorial() {
  storageSet(STORAGE.tutorial, '1');
  showScreen('main-menu');
  syncMenu();
}

function maybeShowTutorial() {
  if (storageGet(STORAGE.tutorial)) return;
  if (!document.getElementById('lang-prompt')?.classList.contains('hidden')) return;
  if (gameState !== 'MENU') return;
  startTutorial();
}

function showBanner(text, frames) {
  bannerQueue = [];
  bannerText = text;
  bannerTimer = frames;
}

function queueBanner(text, frames, onShow) {
  bannerQueue.push({ text, frames, onShow });
  if (bannerTimer <= 0) revealBanner();
}

function revealBanner() {
  const next = bannerQueue.shift();
  if (!next) {
    bannerText = '';
    bannerTimer = 0;
    return;
  }
  bannerText = next.text;
  bannerTimer = next.frames;
  if (next.onShow) next.onShow();
}

function tickBanner() {
  if (tutorialActive && tutorialStep) return;
  if (bannerTimer <= 0) return;
  bannerTimer -= 1;
  if (bannerTimer > 0) return;
  revealBanner();
}

function syncSettingsForm() {
  const music = document.getElementById('set-music');
  const sfx = document.getElementById('set-sfx');
  const language = document.getElementById('set-language');
  const joystickToggle = document.getElementById('set-joystick');
  const musicReadout = document.getElementById('music-readout');
  const sfxReadout = document.getElementById('sfx-readout');
  if (music) music.value = String(Math.round(settings.music * 100));
  if (sfx) sfx.value = String(Math.round(settings.sfx * 100));
  if (language) language.value = settings.lang;
  if (joystickToggle) joystickToggle.checked = usesJoystick();
  if (musicReadout) musicReadout.textContent = String(Math.round(settings.music * 100));
  if (sfxReadout) sfxReadout.textContent = String(Math.round(settings.sfx * 100));
}

function loadSave() {
  loadSettings();
  coins = clampInt(storageGet(STORAGE.coins), 0);
  const color = loadSlot(STORAGE.colors, STORAGE.color, COLORS);
  const hat = loadSlot(STORAGE.hats, STORAGE.hat, HATS);
  const glasses = loadSlot(STORAGE.glassesOwned, STORAGE.glasses, GLASSES);
  unlockedColors = color.unlocked;
  echoColor = color.active;
  unlockedHats = hat.unlocked;
  unlockedGlasses = glasses.unlocked;
  unlockedFlags = sanitizeIdList(safeJson(storageGet(STORAGE.flags), []), FLAG_IDS);
  ghostFlag = unlockedFlags.includes(storageGet(STORAGE.ghostFlag)) ? storageGet(STORAGE.ghostFlag) : '';
  unlockedBodies = sanitizeUnlocks(
    safeJson(storageGet(STORAGE.meteors), [COLORS[0].id]),
    PLAYER_BODIES.map((item) => item.id),
  );
  playerBody = unlockedBodies.includes(storageGet(STORAGE.meteorBody))
    ? storageGet(STORAGE.meteorBody)
    : COLORS[0].id;
  playerFlag = unlockedFlags.includes(storageGet(STORAGE.meteorFlag)) ? storageGet(STORAGE.meteorFlag) : '';
  // Accessories retired from the shop — always bare heads.
  echoHat = 'none';
  echoGlasses = 'none';
  unlockedPacks = sanitizeUnlocks(safeJson(storageGet(STORAGE.coinPacks), ['gold']), COIN_PACKS.map((item) => item.id));
  coinPack = unlockedPacks.includes(storageGet(STORAGE.coinPack)) ? storageGet(STORAGE.coinPack) : 'gold';
  adProgress = safeJson(storageGet(STORAGE.adProgress), {});
  if (!adProgress || typeof adProgress !== 'object') adProgress = {};
  bestScore = clampInt(storageGet(STORAGE.bestScore), 0);
  bestRound = clampInt(storageGet(STORAGE.bestRound), 0);
  gamesPlayed = clampInt(storageGet(STORAGE.games), 0);
  missileStock = clampInt(storageGet(STORAGE.missiles), 0);
  shieldStock = clampInt(storageGet(STORAGE.shields), 0);
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
  storageSet(STORAGE.missiles, missileStock);
  storageSet(STORAGE.shields, shieldStock);
  storageSet(STORAGE.flags, JSON.stringify(unlockedFlags));
  storageSet(STORAGE.ghostFlag, ghostFlag);
  storageSet(STORAGE.meteors, JSON.stringify(unlockedBodies));
  storageSet(STORAGE.meteorBody, playerBody);
  storageSet(STORAGE.meteorFlag, playerFlag);
  storageSet(STORAGE.coinPacks, JSON.stringify(unlockedPacks));
  storageSet(STORAGE.coinPack, coinPack);
  storageSet(STORAGE.adProgress, JSON.stringify(adProgress));
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
  echoHat = 'none';
  echoGlasses = 'none';
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
  // Stop immediately — no leftover chase toward an old target.
  player.targetX = player.x;
  player.targetY = player.y;
  player.vx = 0;
  player.vy = 0;
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
  document.getElementById('game-container').dataset.screen = '';
}

function showScreen(id) {
  hideScreens();
  const screen = document.getElementById(id);
  screen.classList.remove('hidden');
  screen.inert = false;
  document.getElementById('game-container').dataset.screen = id;
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
  setText('powerup-status', shieldStatus());
  setText('missile-stock', missileStock);
  setText('shield-stock', shieldStock);
  document.getElementById('use-missile')?.classList.toggle('empty', missileStock <= 0);
  document.getElementById('use-shield')?.classList.toggle('empty', shieldStock <= 0);
}

function shieldStatus() {
  if (!shieldLayers.length) return '';
  const timed = shieldLayers.filter((layer) => layer.kind === 'timed');
  if (!timed.length) {
    return shieldLayers.length > 1 ? t('shieldStack', { n: shieldLayers.length }) : t('shieldUp');
  }
  const seconds = Math.ceil(Math.min(...timed.map((layer) => layer.life)) / 60);
  return shieldLayers.length > 1
    ? t('shieldStackTime', { n: shieldLayers.length, s: seconds })
    : t('shieldTime', { s: seconds });
}

function syncMenu() {
  setText(
    'menu-best',
    bestScore > 0 ? t('bestLine', { score: bestScore, round: bestRound }) : t('noRecord'),
  );
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
  pinnedTry.player = null;
  pinnedTry.trail = null;
  pinnedTry.echoFlag = null;
  pinnedTry.playerFlag = null;
  pinnedTry.coins = null;
  hoverTry = null;
  lastTry = null;
}

function catalogItem(slot, id) {
  if (isFlagSlot(slot)) {
    const flag = flagById(id);
    return flag ? { id: flag.id, slot, offer: 'ad', ads: 1, nameKey: '', flag } : null;
  }
  return SHOP[slot]?.find((item) => item.id === id) ?? null;
}

function trySlots() {
  if (previewSubject === 'coins') return ['coins'];
  if (previewSubject === 'powers') return [];
  if (previewSubject === 'player') return ['playerFlag', 'player'];
  return ['echoFlag', 'color'];
}

function subjectForSlot(slot) {
  if (slot === 'player' || slot === 'playerFlag') return 'player';
  if (slot === 'coins') return 'coins';
  if (slot === 'power') return 'powers';
  return 'echo';
}

function slotAsleep(slot) {
  if (slot === 'player') {
    if (hoverTry?.slot === 'player' || pinnedTry.player) return false;
    return Boolean(previewChoice('playerFlag', playerFlag));
  }
  if (slot === 'color') {
    if (hoverTry?.slot === 'color' || pinnedTry.color) return false;
    return Boolean(previewChoice('echoFlag', ghostFlag));
  }
  return false;
}

function progressKey(item) {
  if (isFlagSlot(item.slot)) return `flag:${item.id}`;
  return `${item.slot}:${item.id}`;
}

function ownsItem(item) {
  if (isFlagSlot(item.slot)) return unlockedFlags.includes(item.id);
  if (item.slot === 'player') return unlockedBodies.includes(item.id);
  if (item.slot === 'coins') return unlockedPacks.includes(item.id);
  return cosmeticLoadout().unlocked[item.slot]?.includes(item.id);
}

function isEquipped(item) {
  if (item.slot === 'echoFlag') return ghostFlag === item.id;
  if (item.slot === 'playerFlag') return playerFlag === item.id;
  if (item.slot === 'player') return !playerFlag && playerBody === item.id;
  if (item.slot === 'coins') return coinPack === item.id;
  if (item.slot === 'color') return !ghostFlag && cosmeticLoadout().active.color === item.id;
  return cosmeticLoadout().active[item.slot] === item.id;
}

function offerLabel(item, unlocked, selected) {
  if (selected) return t('equipped');
  if (unlocked) return t('owned');
  const offer = itemOffer(item);
  if (offer.kind === 'rate') return t('rateUnlock');
  if (offer.kind === 'either') {
    const done = clampInt(adProgress[progressKey(item)], 0);
    return t('priceOrAds', { price: offer.price, n: done, total: offer.ads });
  }
  if (offer.kind === 'ad') {
    const done = clampInt(adProgress[progressKey(item)], 0);
    if (offer.ads > 1) return t('adProgress', { n: done, total: offer.ads });
    return t('watchAd');
  }
  if (offer.kind === 'free') return t('owned');
  if (isDailyDeal(item)) return t('dailyDeal', { price: salePrice(item) });
  return `$${offer.price}`;
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
  const home = subjectForSlot(item.slot);
  if (home !== previewSubject) previewSubject = home;
  const rivals = {
    playerFlag: ['player'],
    player: ['playerFlag'],
    echoFlag: ['color'],
    color: ['echoFlag'],
  };
  for (const slot of rivals[item.slot] || []) pinnedTry[slot] = null;
  if (pinnedTry[item.slot] === item.id) pinnedTry[item.slot] = null;
  else pinnedTry[item.slot] = item.id;
  lastTry = pinnedTry[item.slot] ? { slot: item.slot, id: item.id } : nextPinnedTry();
  hoverTry = null;
  renderShop();
}

function nextPinnedTry() {
  for (const slot of trySlots()) {
    if (pinnedTry[slot]) return { slot, id: pinnedTry[slot] };
  }
  return null;
}

function actionItem() {
  const candidates = [];
  if (lastTry && trySlots().includes(lastTry.slot)) candidates.push(lastTry);
  for (const slot of trySlots()) {
    if (pinnedTry[slot]) candidates.push({ slot, id: pinnedTry[slot] });
  }
  for (const trial of candidates) {
    const item = catalogItem(trial.slot, trial.id);
    if (item && !isEquipped(item)) return item;
  }
  return null;
}

function refreshTryMarks() {
  document.querySelectorAll('.shop-item').forEach((button) => {
    button.classList.toggle('trying', isTrying(button.dataset.slot, button.dataset.id));
  });
}

function syncTryAction() {
  const button = document.getElementById('try-on-buy');
  const adButton = document.getElementById('try-on-ad');
  if (!button) return;
  const item = actionItem();
  const flagButton = document.getElementById('flag-buy');
  if (!item) {
    button.hidden = true;
    button.disabled = false;
    if (adButton) adButton.hidden = true;
    if (flagButton) flagButton.hidden = true;
    return;
  }
  const unlocked = ownsItem(item);
  const offer = itemOffer(item);
  button.hidden = false;
  button.disabled = false;
  if (adButton) adButton.hidden = true;
  if (unlocked) button.textContent = t('equip', { name: itemLabel(item) });
  else if (offer.kind === 'either') {
    button.disabled = coins < offer.price;
    button.textContent = coins >= offer.price
      ? t('buyNamed', { name: itemLabel(item), price: offer.price })
      : t('need', { price: offer.price });
    if (adButton) {
      const done = clampInt(adProgress[progressKey(item)], 0);
      adButton.hidden = false;
      adButton.disabled = false;
      adButton.textContent = t('adProgress', { n: done, total: offer.ads });
    }
  }   else if (offer.kind === 'ad') button.textContent = offer.ads > 1 ? offerLabel(item, false, false) : t('watchAd');
  else if (offer.kind === 'rate') button.textContent = t('rateUnlock');
  else if (offer.kind === 'coin' && coins >= salePrice(item)) button.textContent = t('buyNamed', { name: itemLabel(item), price: salePrice(item) });
  else if (offer.kind === 'coin') {
    button.disabled = true;
    button.textContent = t('need', { price: salePrice(item) });
  } else button.textContent = t('equip', { name: itemLabel(item) });
  if (flagButton) {
    flagButton.hidden = button.hidden;
    flagButton.disabled = button.disabled;
    flagButton.textContent = button.textContent;
  }
}

function stockOf(id) {
  return id === 'missile' ? missileStock : shieldStock;
}

function paintPowerIcon(canvas, kind) {
  if (!canvas) return;
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, size, size);
  paintOn(g, () => {
    if (kind === 'shield') drawShieldIcon(size / 2, size / 2);
    else {
      ctx.save();
      ctx.translate(size / 2, size / 2);
      drawRocket(-Math.PI / 2);
      ctx.restore();
    }
  });
}

function renderPowers() {
  const root = document.getElementById('power-shop');
  if (!root) return;
  root.replaceChildren();
  for (const item of POWERS) {
    const row = document.createElement('div');
    row.className = 'power-row';
    const iconWrap = document.createElement('div');
    iconWrap.className = 'power-icon-wrap';
    const icon = document.createElement('canvas');
    icon.className = 'power-thumb';
    icon.setAttribute('aria-hidden', 'true');
    paintPowerIcon(icon, item.id);
    const count = document.createElement('span');
    count.className = 'power-count';
    count.textContent = String(stockOf(item.id));
    iconWrap.append(icon, count);
    const copy = document.createElement('div');
    copy.className = 'power-copy';
    const title = document.createElement('strong');
    title.textContent = itemLabel(item);
    const detail = document.createElement('span');
    detail.textContent = t(item.detailKey);
    copy.append(title, detail);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn power-buy';
    const price = salePrice(item);
    button.disabled = coins < price;
    if (isDailyDeal(item)) button.textContent = t('dailyDeal', { price });
    else button.textContent = coins >= price ? t('buy', { price }) : t('need', { price });
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      buyPower(item);
    });
    row.addEventListener('click', () => showToast(t(item.detailKey)));
    row.append(iconWrap, copy, button);
    root.append(row);
  }
}

function buyPower(item) {
  const next = buyCharge(coins, stockOf(item.id), salePrice(item));
  if (next.status === 'broke') {
    AudioEngine.deny();
    showToast(t('broke'));
    return false;
  }
  coins = next.coins;
  if (item.id === 'missile') missileStock = next.stock;
  else shieldStock = next.stock;
  saveAll();
  AudioEngine.coin();
  showToast(t('stored', { name: itemLabel(item) }));
  renderShop();
  return true;
}

function useStoredMissile() {
  if (gameState !== 'PLAYING') return false;
  if (missile) {
    AudioEngine.deny();
    showToast(t('missileFlight'));
    return false;
  }
  if (!echoes.length) {
    AudioEngine.deny();
    showToast(t('noEcho'));
    return false;
  }
  const next = spendCharge(missileStock);
  if (next.status === 'empty') {
    AudioEngine.deny();
    showToast(t('noMissile'));
    return false;
  }
  missileStock = next.stock;
  saveAll();
  launchMissile();
  syncHUD();
  return true;
}

function useStoredShield() {
  if (gameState !== 'PLAYING') return false;
  const next = spendCharge(shieldStock);
  if (next.status === 'empty') {
    AudioEngine.deny();
    showToast(t('noShield'));
    return false;
  }
  shieldStock = next.stock;
  addShieldLayer('lasting');
  saveAll();
  AudioEngine.powerup();
  showToast(shieldLayers.length > 1 ? t('shieldStack', { n: shieldLayers.length }) : t('shieldUp'));
  syncHUD();
  return true;
}

function renderDeals() {
  const fold = document.getElementById('deal-fold');
  const container = document.getElementById('deal-shop');
  if (!fold || !container) return;
  container.replaceChildren();
  for (const slot of DEAL_BY_SUBJECT[previewSubject] || []) {
    const id = dailyDealId(slot);
    const item = id ? SHOP[slot]?.find((entry) => entry.id === id) : null;
    if (item) container.append(makeShopButton(item));
  }
  fold.hidden = container.childElementCount === 0;
}

const FLAG_PAGE = 12;
const flagShown = { echoFlag: FLAG_PAGE, playerFlag: FLAG_PAGE };

function renderFlagGrid(containerId, slot) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const searchId = slot === 'playerFlag' ? 'player-flag-search' : 'echo-flag-search';
  const query = document.getElementById(searchId)?.value.trim().toLocaleLowerCase(settings.lang) || '';
  const equippedId = slot === 'playerFlag' ? playerFlag : ghostFlag;
  const tryingId = hoverTry?.slot === slot ? hoverTry.id : pinnedTry[slot];
  const pinned = [];
  const rest = [];
  for (const flag of flagsSorted(settings.lang)) {
    const name = countryName(flag.id, settings.lang);
    if (query && !name.toLocaleLowerCase(settings.lang).includes(query) && !flag.id.includes(query)) continue;
    if (flag.id === equippedId || flag.id === tryingId) pinned.push(flag);
    else rest.push(flag);
  }
  const matches = [...pinned, ...rest];
  const limit = flagShown[slot] || FLAG_PAGE;
  container.replaceChildren();
  for (const flag of matches.slice(0, limit)) {
    const item = catalogItem(slot, flag.id);
    if (item) container.append(makeShopButton(item));
  }
  if (matches.length > limit) {
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'flag-more';
    more.textContent = t('showMore');
    more.addEventListener('click', () => {
      flagShown[slot] = limit + FLAG_PAGE;
      renderFlagGrid(containerId, slot);
    });
    container.append(more);
  }
}

function renderShop() {
  syncHUD();
  renderDeals();
  const echoShop = document.getElementById('echo-shop');
  const playerShop = document.getElementById('player-shop');
  const coinPanel = document.getElementById('coin-shop-panel');
  const powerPanel = document.getElementById('power-shop-panel');
  if (echoShop) echoShop.hidden = previewSubject !== 'echo';
  if (playerShop) playerShop.hidden = previewSubject !== 'player';
  if (coinPanel) coinPanel.hidden = previewSubject !== 'coins';
  if (powerPanel) powerPanel.hidden = previewSubject !== 'powers';
  document.getElementById('preview-echo')?.classList.toggle('active', previewSubject === 'echo');
  document.getElementById('preview-player')?.classList.toggle('active', previewSubject === 'player');
  document.getElementById('preview-coins')?.classList.toggle('active', previewSubject === 'coins');
  document.getElementById('preview-powers')?.classList.toggle('active', previewSubject === 'powers');
  if (previewSubject === 'echo') {
    renderFlagGrid('echo-flag-shop', 'echoFlag');
    renderSlot('color-shop', 'color');
  } else if (previewSubject === 'player') {
    renderFlagGrid('player-flag-shop', 'playerFlag');
    renderSlot('player-shop-grid', 'player');
  } else if (previewSubject === 'coins') {
    renderSlot('coin-shop', 'coins');
  } else {
    renderPowers();
  }
  syncTryAction();
  renderPreview();
  if (!document.getElementById('flag-screen')?.classList.contains('hidden')) renderFlags();
}

function swatchBackground(id) {
  if (id === 'prism' || id === 'shift' || id === 'aurora') {
    return 'conic-gradient(from 30deg, #ff4d6a, #ffd166, #7dff6b, #4cc9ff, #c084fc, #ff4d6a)';
  }
  if (id === 'classic') return 'linear-gradient(135deg, #fff6d0, #ff4d00)';
  return id;
}

function flagThumb(flag) {
  const thumb = document.createElement('canvas');
  thumb.className = 'thumb';
  thumb.width = 144;
  thumb.height = 104;
  const g = thumb.getContext('2d');
  g.setTransform(2, 0, 0, 2, 0, 0);
  drawFlag(g, 6, 8, 60, 36, flag);
  return thumb;
}

function makeShopButton(item) {
  const slot = item.slot;
  const unlocked = ownsItem(item);
  const selected = isEquipped(item);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `shop-item${selected ? ' selected' : ''}${slotAsleep(slot) ? ' asleep' : ''}${isTrying(slot, item.id) ? ' trying' : ''}`;
  button.dataset.slot = slot;
  button.dataset.id = item.id;
  button.setAttribute('aria-pressed', isTrying(slot, item.id) ? 'true' : 'false');

  if (isFlagSlot(slot) && item.flag) button.append(flagThumb(item.flag));
  else if (slot === 'coins') button.append(makeCoinThumb(item.id));
  else if (slot === 'color' || slot === 'player') {
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = swatchBackground(item.id);
    button.append(swatch);
  } else button.append(makeThumb(item));

  const name = document.createElement('span');
  name.className = 'shop-name';
  name.textContent = itemLabel(item);
  const meta = document.createElement('span');
  meta.className = 'shop-meta';
  meta.textContent = offerLabel(item, unlocked, selected);
  button.append(name, meta);
  button.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    setHoverTry(slot, item.id);
  });
  button.addEventListener('pointerleave', () => clearHoverTry(slot, item.id));
  button.addEventListener('focus', () => setHoverTry(slot, item.id));
  button.addEventListener('blur', () => clearHoverTry(slot, item.id));
  button.addEventListener('click', () => pinTry(item));
  return button;
}

function renderSlot(containerId, slot) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.replaceChildren();
  for (const item of SHOP[slot] || []) container.append(makeShopButton(item));
}

function makeThumb(item) {
  const thumb = document.createElement('canvas');
  thumb.className = 'thumb';
  thumb.width = 144;
  thumb.height = 104;
  const g = thumb.getContext('2d');
  g.setTransform(2, 0, 0, 2, 0, 0);
  paintOn(g, () => {
    ctx.translate(36, item.slot === 'hat' ? 40 : 30);
    if (item.slot === 'hat') drawHat(item.id, 22, '#ff2a55');
    else drawGlasses(item.id, 26);
  });
  return thumb;
}

function previewChoice(slot, equipped) {
  if (hoverTry?.slot === slot) return hoverTry.id;
  if (pinnedTry[slot]) return pinnedTry[slot];
  return equipped;
}

function renderPreview() {
  const preview = document.getElementById('loadout-preview');
  if (!preview) return;
  paintLoadoutPreview(preview);
}

function paintLoadoutPreview(preview) {
  const g = preview.getContext('2d');
  const width = 240;
  const height = 160;
  const dpr = 2;
  if (preview.width !== width * dpr) {
    preview.width = width * dpr;
    preview.height = height * dpr;
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, width, height);
  paintOn(g, () => {
    if (previewSubject === 'player') {
      const style = previewPlayerStyle();
      const now = performance.now();
      drawFireball(width * 0.72, height * 0.52, 26, now / 90, 1, 0, style, 1.1);
      return;
    }
    if (previewSubject === 'coins') {
      const pack = previewChoice('coins', coinPack);
      drawCoinPack(pack === 'crypto' ? 'btc' : pack, width / 2, height * 0.55, 36);
      return;
    }
    if (previewSubject === 'powers') {
      drawMissileIcon(width * 0.36, height * 0.55);
      drawShieldIcon(width * 0.64, height * 0.55);
      return;
    }
    const look = previewLoadout(
      { color: echoColor, hat: echoHat, glasses: echoGlasses },
      pinnedTry,
      hoverTry,
    );
    const tryingColor = hoverTry?.slot === 'color' || pinnedTry.color;
    const flagId = tryingColor ? '' : previewChoice('echoFlag', ghostFlag);
    const now = performance.now();
    // Fist is pinned at this point; shift right so the cape sits in the preview center.
    drawSpirit(width * 0.72, height * 0.54, {
      color: flagId ? flagInk(flagById(flagId)) : (lookColor(look.color, 0) || look.color),
      radius: 34,
      phase: now / 180,
      heading: 0,
      wind: 1.1,
      hollow: true,
      aura: false,
      flagId,
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
    minX: 36,
    maxX: Math.max(72, view.w - 36),
    minY: 112,
    maxY: Math.max(150, view.h - 118),
  };
}

function clearOfHud(point) {
  const bounds = fieldBounds();
  if (point.x < bounds.minX || point.x > bounds.maxX) return false;
  if (point.y < bounds.minY || point.y > bounds.maxY) return false;
  if (Math.abs(point.x - view.w / 2) < 110 && point.y > view.h - 150) return false;
  return true;
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
  const bounds = fieldBounds();
  let point = pickSpawn(Math.random, bounds, spawnBlockers(), cluster);
  if (!clearOfHud(point) || Math.hypot(point.x - player.x, point.y - player.y) < 80) {
    point = {
      x: clamp(view.w * 0.5, bounds.minX, bounds.maxX),
      y: clamp(view.h * 0.42, bounds.minY, bounds.maxY),
    };
  }
  return point;
}

function spawnCoins() {
  collectibles = [];
  const kinds = coinPack === 'crypto' ? [...COINS].sort(() => Math.random() - 0.5) : [{ id: coinPack }, { id: coinPack }, { id: coinPack }];
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
}

function spawnCollectibles() {
  spawnCoins();
  if (tutorialActive) return;
  if (powerups.length < 2 && Math.random() < 0.4) {
    const point = spawnPoint();
    powerups.push({
      x: point.x,
      y: point.y,
      type: pickPowerType(Math.random, currentRound >= 6),
    });
  }
  if (currentRound > 1 && !meteor && shouldSpawnMeteor(Math.random)) spawnMeteor();
}

const METEOR_FRAMES = 34;

function spawnMeteor(frames = METEOR_FRAMES) {
  const ends = pickMeteorEnds(Math.random, view.w);
  const velocity = meteorVelocity(ends.startX, ends.endX, view.h + 48, frames);
  meteor = {
    x: ends.startX,
    y: -24,
    vx: velocity.vx,
    vy: velocity.vy,
    trail: [],
  };
}

function fieldPoint(xRatio, yRatio) {
  const bounds = fieldBounds();
  return {
    x: bounds.minX + (bounds.maxX - bounds.minX) * xRatio,
    y: bounds.minY + (bounds.maxY - bounds.minY) * yRatio,
  };
}

const TUTORIAL_METEOR_FRAMES = 100;

function showLesson(step, key) {
  tutorialStep = step;
  tutorialStepFrames = 0;
  bannerQueue = [];
  bannerText = t(key);
  bannerTimer = 1;
  announce(bannerText);
}

function clearLesson() {
  tutorialStep = '';
  tutorialStepFrames = 0;
  bannerQueue = [];
  bannerText = '';
  bannerTimer = 0;
}

function lessonPoint(xRatio, yRatio) {
  const point = fieldPoint(xRatio, yRatio);
  if (Math.hypot(point.x - player.x, point.y - player.y) >= 90) return point;
  return fieldPoint(1 - xRatio, Math.min(0.82, yRatio + 0.34));
}

function spawnCoinLesson() {
  showLesson('coins', 'tutorialBannerMove');
  spawnCoins();
}

function spawnShieldLesson() {
  showLesson('shield', 'tutorialBannerShield');
  const point = lessonPoint(0.22, 0.34);
  powerups = [{ ...point, type: 'SHIELD' }];
}

function spawnSackLesson() {
  showLesson('sack', 'tutorialBannerSack');
  const point = lessonPoint(0.78, 0.62);
  powerups = [{ ...point, type: 'COIN' }];
}

function spawnMissileLesson() {
  showLesson('missile', 'tutorialBannerMissile');
  const point = lessonPoint(0.5, 0.32);
  powerups = [{ ...point, type: 'MISSILE' }];
}

/** Place visible doubles so the meteor wipe is obvious in the tutorial. */
function seedTutorialEchoes(count = 2) {
  const paths = [];
  for (let i = 0; i < count; i += 1) {
    const cx = view.w * (0.3 + i * 0.34);
    const cy = view.h * (0.3 + (i % 2) * 0.2);
    const path = [];
    for (let step = 0; step < 48; step += 1) {
      const a = (step / 48) * Math.PI * 2;
      path.push({
        x: cx + Math.cos(a) * (42 + i * 8),
        y: cy + Math.sin(a) * (24 + i * 4),
      });
    }
    paths.push(path);
  }
  echoes = paths;
}

function spawnMeteorLesson() {
  seedTutorialEchoes(2);
  grace = Math.max(grace, 90);
  showLesson('meteor', 'tutorialBannerMeteor');
  spawnMeteor(TUTORIAL_METEOR_FRAMES);
}

function beginTutorialWrapUp() {
  showLesson('wrap', 'tutorialBannerMeteorDone');
}

function tutorialTravel() {
  if (currentPath.length < 2) return 0;
  const start = currentPath[0];
  const last = currentPath[currentPath.length - 1];
  return Math.hypot(last.x - start.x, last.y - start.y);
}

function lessonAllows(type) {
  if (tutorialStep === 'shield') return type === 'SHIELD';
  if (tutorialStep === 'sack') return type === 'COIN';
  if (tutorialStep === 'missile') return type === 'MISSILE';
  return false;
}

function advanceTutorialAfterPower(type) {
  if (!tutorialActive) return;
  if (type === 'SHIELD' && tutorialStep === 'shield') {
    clearLesson();
    spawnSackLesson();
    return;
  }
  if (type === 'COIN' && tutorialStep === 'sack') {
    clearLesson();
    spawnCoinLesson();
    return;
  }
  if (type === 'MISSILE' && tutorialStep === 'missile') {
    clearLesson();
    // Wait for the missile to finish, then show doubles + meteor wipe.
    tutorialAwaitMeteor = true;
    if (!missile) {
      tutorialAwaitMeteor = false;
      spawnMeteorLesson();
    }
  }
}

function beginTutorialRound() {
  powerups = [];
  meteor = null;
  collectibles = [];
  if (currentRound === 1) {
    spawnCoinLesson();
  } else if (currentRound === 2) {
    showLesson('echo', 'tutorialBannerEcho');
    grace = Math.max(grace, 170);
  } else if (currentRound === 3) {
    spawnMissileLesson();
    grace = Math.max(grace, 170);
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

function sparkle(x, y, color) {
  coinFlashes.push({ x, y, life: 18 });
  for (let i = 0; i < 10; i += 1) {
    if (particles.length > 90) particles.shift();
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 1.6;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.4,
      life: 14 + Math.floor(Math.random() * 8),
      color: i % 3 === 0 ? '#fff6d0' : color,
      size: 2.8,
    });
  }
}

function addScore(amount) {
  score += amount;
  noteRecord();
}

function noteRecord() {
  if (tutorialActive) return;
  const scoreBreak = bestScore > 0 && score > bestScore;
  const roundBreak = bestRound > 0 && currentRound > bestRound;
  if ((!scoreBreak && !roundBreak) || recordNoted) return;
  recordNoted = true;
  recordFlash = 50;
  bannerText = t('recordBanner');
  bannerTimer = 100;
  shake = 7;
  burst(player.x, player.y, '#ffe7a3');
  burst(player.x, player.y, '#fffdf2');
  AudioEngine.record();
}

function resetRun() {
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
  meteor = null;
  blasts = [];
  impacts = [];
  continued = false;
  shieldLayers = [];
  grace = 0;
  roundFrame = 0;
  skipFrameTick = false;
  shake = 0;
  bannerQueue = [];
  bannerText = '';
  bannerTimer = 0;
  tutorialStep = '';
  tutorialStepFrames = 0;
  tutorialAwaitMeteor = false;
  recordNoted = false;
  recordFlash = 0;
  coinFlashes = [];
  document.getElementById('game-over-screen')?.classList.remove('record');

  resizeCanvas();
  player.x = view.w / 2;
  player.y = view.h / 2;
  player.targetX = player.x;
  player.targetY = player.y;
}

function startGame() {
  tutorialActive = false;
  resetRun();
  gamesPlayed += 1;
  spawnCollectibles();
  saveAll();
  syncHUD();
  announce(t('roundBanner', { n: 1 }));
  AudioEngine.unlock();
}

function startTutorial() {
  if (gameState === 'PLAYING' && !tutorialActive) return;
  storageSet(STORAGE.tutorial, '1');
  tutorialWallet = coins;
  tutorialActive = true;
  resetRun();
  beginTutorialRound();
  syncHUD();
  AudioEngine.unlock();
  if (settings.music > 0) AudioEngine.startMusic();
}

function finishTutorial() {
  tutorialActive = false;
  meteor = null;
  missile = null;
  echoes = [];
  powerups = [];
  collectibles = [];
  coins = tutorialWallet;
  bannerQueue = [];
  bannerText = '';
  bannerTimer = 0;
  saveAll();
  returnToMenu();
  showToast(t('tutorialDone'));
}

function failTutorial() {
  AudioEngine.hit();
  buzz('death');
  shake = 14;
  coins = tutorialWallet;
  resetRun();
  tutorialActive = true;
  queueBanner(t('tutorialRetry'), 90);
  beginTutorialRound();
  syncHUD();
}

function returnToMenu() {
  if (tutorialActive) {
    tutorialActive = false;
    coins = tutorialWallet;
    meteor = null;
    bannerQueue = [];
    bannerText = '';
    bannerTimer = 0;
  }
  setMode('MENU');
  showScreen('main-menu');
  syncMenu();
  if (settings.music > 0) AudioEngine.startMusic();
}

function pauseGame() {
  if (gameState !== 'PLAYING') return;
  keys.clear();
  endDrag();
  clearJoystick();
  accumulator = 0;
  AudioEngine.stopMusic();
  setMode('PAUSED');
  showScreen('pause-screen');
  announce(t('paused'));
}

function resumeGame() {
  if (gameState !== 'PAUSED') return;
  hideScreens();
  setMode('PLAYING');
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  if (settings.music > 0) AudioEngine.startMusic();
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

function openSettings() {
  setMode('MENU');
  syncSettingsForm();
  showScreen('settings-screen');
}

function closeOverlay() {
  showScreen('main-menu');
  syncMenu();
}

function rememberUnlock(item) {
  if (isFlagSlot(item.slot)) {
    if (!unlockedFlags.includes(item.id)) unlockedFlags = [...unlockedFlags, item.id];
    return;
  }
  if (item.slot === 'player') {
    if (!unlockedBodies.includes(item.id)) unlockedBodies = [...unlockedBodies, item.id];
    return;
  }
  if (item.slot === 'coins') {
    if (!unlockedPacks.includes(item.id)) unlockedPacks = [...unlockedPacks, item.id];
    return;
  }
  const loadout = cosmeticLoadout();
  if (!loadout.unlocked[item.slot].includes(item.id)) {
    loadout.unlocked[item.slot] = [...loadout.unlocked[item.slot], item.id];
    applyLoadout({ ...loadout, active: loadout.active });
  }
}

function equipOwned(item) {
  if (item.slot === 'echoFlag') {
    ghostFlag = ghostFlag === item.id ? '' : item.id;
    return;
  }
  if (item.slot === 'playerFlag') {
    playerFlag = playerFlag === item.id ? '' : item.id;
    return;
  }
  if (item.slot === 'player') {
    playerBody = item.id;
    playerFlag = '';
    return;
  }
  if (item.slot === 'coins') {
    coinPack = item.id;
    return;
  }
  const loadout = cosmeticLoadout();
  loadout.active[item.slot] = item.id;
  applyLoadout(loadout);
  if (item.slot === 'color') ghostFlag = '';
}

function clearTry(item) {
  if (pinnedTry[item.slot] === item.id) pinnedTry[item.slot] = null;
  if (lastTry?.slot === item.slot && lastTry.id === item.id) lastTry = nextPinnedTry();
  if (hoverTry?.slot === item.slot && hoverTry.id === item.id) hoverTry = null;
}

function buyCosmetic(item) {
  const offer = itemOffer(item);
  if (offer.kind !== 'coin' && offer.kind !== 'free' && offer.kind !== 'either') return false;
  if (ownsItem(item)) {
    equipOwned(item);
    clearTry(item);
    saveAll();
    renderShop();
    return true;
  }
  if (item.slot === 'player' || item.slot === 'coins') {
    const price = salePrice(item);
    if (coins < price) {
      AudioEngine.deny();
      showToast(t('broke'));
      return false;
    }
    coins -= price;
    rememberUnlock(item);
    equipOwned(item);
    clearTry(item);
    saveAll();
    AudioEngine.coin();
    showToast(t('unlocked', { name: itemLabel(item) }));
    renderShop();
    return true;
  }
  const result = applyCosmetic(cosmeticLoadout(), { ...item, price: salePrice(item) });
  if (result.status === 'broke') {
    AudioEngine.deny();
    showToast(t('broke'));
    return false;
  }

  applyLoadout(result);
  if (item.slot === 'color') ghostFlag = '';
  clearTry(item);
  saveAll();
  if (result.status === 'bought') {
    AudioEngine.coin();
    showToast(t('unlocked', { name: itemLabel(item) }));
  }
  renderShop();
  return true;
}

function confirmTryOn() {
  const item = actionItem();
  if (!item) return;
  if (ownsItem(item)) {
    equipOwned(item);
    clearTry(item);
    saveAll();
    AudioEngine.coin();
    renderShop();
    return;
  }
  const offer = itemOffer(item);
  if (offer.kind === 'coin' || offer.kind === 'free' || offer.kind === 'either') {
    buyCosmetic(item);
    return;
  }
  if (offer.kind === 'rate') {
    openRatePrompt();
    return;
  }
  void watchForItem(item);
}

async function watchForItem(item) {
  const offer = itemOffer(item);
  const ok = await showRewardedAd({
    title: t('adTitle'),
    wait: (n) => t('adWait', { n }),
    claim: t('adClaim'),
    skip: t('adSkip'),
  });
  if (!ok) return;
  const key = progressKey(item);
  const next = clampInt(adProgress[key], 0) + 1;
  if (next >= offer.ads) {
    delete adProgress[key];
    rememberUnlock(item);
    equipOwned(item);
    clearTry(item);
    AudioEngine.coin();
    showToast(t('unlocked', { name: itemLabel(item) }));
  } else {
    adProgress[key] = next;
    showToast(t('adProgress', { n: next, total: offer.ads }));
  }
  saveAll();
  renderShop();
}

function openFlags() {
  const search = document.getElementById('flag-search');
  if (search) {
    search.placeholder = t('flagSearch');
    search.value = '';
  }
  const title = document.getElementById('flag-title');
  if (title) title.textContent = previewSubject === 'player' ? t('flagMeteor') : t('flagEcho');
  showScreen('flag-screen');
  renderFlags();
}

function closeFlags() {
  showScreen('shop-screen');
  renderShop();
}

function renderFlags() {
  const list = document.getElementById('flag-list');
  if (!list) return;
  const query = document.getElementById('flag-search')?.value.trim().toLocaleLowerCase(settings.lang) || '';
  list.replaceChildren();
  for (const flag of flagsSorted(settings.lang)) {
    const name = countryName(flag.id, settings.lang);
    if (query && !name.toLocaleLowerCase(settings.lang).includes(query) && !flag.id.includes(query)) continue;
    const slot = flagSlot();
    const item = catalogItem(slot, flag.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flag-row';
    button.classList.toggle('selected', isEquipped(item));
    button.classList.toggle('trying', isTrying(slot, flag.id));
    const thumb = document.createElement('canvas');
    thumb.className = 'flag-thumb';
    thumb.width = 84;
    thumb.height = 56;
    const g = thumb.getContext('2d');
    g.setTransform(2, 0, 0, 2, 0, 0);
    drawFlag(g, 0, 0, 42, 28, flag);
    const label = document.createElement('span');
    label.className = 'flag-name';
    label.textContent = name;
    const meta = document.createElement('span');
    meta.className = 'flag-meta';
    meta.textContent = offerLabel(item, ownsItem(item), isEquipped(item));
    button.append(thumb, label, meta);
    button.addEventListener('click', () => pinTry(item));
    list.append(button);
  }
}

function openRatePrompt() {
  const overlay = document.getElementById('rate-overlay');
  if (!overlay) return;
  document.getElementById('rate-title').textContent = t('rateTitle');
  document.getElementById('rate-body').textContent = t('rateBody');
  document.getElementById('rate-go').textContent = t('rateGo');
  document.getElementById('rate-later').textContent = t('rateLater');
  overlay.classList.remove('hidden');
  overlay.inert = false;
}

function closeRatePrompt() {
  const overlay = document.getElementById('rate-overlay');
  overlay?.classList.add('hidden');
  if (overlay) overlay.inert = true;
  rateArmed = false;
}

function goRate() {
  rateArmed = true;
  rateSawLeave = false;
  openStore(storeUrl());
}

function claimRate() {
  if (!rateArmed || !rateSawLeave) return;
  rateArmed = false;
  coins += 500;
  saveAll();
  closeRatePrompt();
  AudioEngine.coin();
  showToast(t('rateThanks'));
  syncHUD();
}

function noteRateLeave() {
  if (rateArmed) rateSawLeave = true;
}

function continueRun() {
  if (continued || gameState !== 'GAMEOVER' || tutorialActive) return;
  void showRewardedAd({
    title: t('adTitle'),
    wait: (n) => t('adWait', { n }),
    claim: t('adClaim'),
    skip: t('adSkip'),
  }).then((ok) => {
    if (!ok || gameState !== 'GAMEOVER') return;
    continued = true;
    missile = null;
    grace = 180;
    addShieldLayer('lasting');
    hideScreens();
    setMode('PLAYING');
    syncHUD();
  });
}

function setPreviewSubject(next) {
  previewSubject = next === 'player' || next === 'coins' || next === 'powers' ? next : 'echo';
  hoverTry = null;
  renderShop();
}

function advanceRound() {
  const priorClock = echoClock(roundFrame, currentRound);
  const next = sealPath(echoes, currentPath, currentRound, priorClock);
  echoes = next.echoes;
  currentPath = [];
  currentRound = next.round;
  roundFrame = next.frame;
  skipFrameTick = true;
  grace = roundPressure(currentRound).grace;
  if (tutorialActive) {
    if (currentRound > 3) {
      finishTutorial();
      return;
    }
    // Invincibility only when the next lesson needs it — avoids a post-coin blink ring.
    grace = 0;
    beginTutorialRound();
    AudioEngine.round();
    syncHUD();
    return;
  }
  noteRecord();
  AudioEngine.round();
  spawnCollectibles();
  announce(t('roundBanner', { n: currentRound }));
}

function applyPowerup(power) {
  const color = power.type === 'SHIELD' ? '#00f0ff' : power.type === 'MISSILE' ? '#ff5a1f' : '#ffbb00';
  burst(power.x, power.y, color);
  if (power.type === 'SHIELD') {
    addShieldLayer('timed');
    AudioEngine.powerup();
    return;
  }
  if (power.type === 'MISSILE') {
    launchMissile();
    return;
  }

  coins += COIN_BONUS;
  addScore(COIN_SCORE);
  if (!tutorialActive) saveAll();
  AudioEngine.sack();
  showToast(t('bonus', { n: COIN_BONUS }));
}

function launchMissile() {
  const target = ghostPoint(echoes[0], ghostFrame());
  if (!target) {
    AudioEngine.deny();
    showToast(t('noEcho'));
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
  showToast(t('missileAway'));
}

function detonateMissile(x, y, hit) {
  missile = null;
  impacts.push({ x, y, life: 28 });
  shake = hit ? 9 : 3;
  burst(x, y, '#ff6a00');
  burst(x, y, '#fff1c2');
  if (hit) {
    const next = dropOldestEcho(echoes);
    echoes = next.echoes;
    addScore(200);
    AudioEngine.blast();
    buzz('missile');
    showToast(t('echoDestroyed'));
    announce(t('echoDestroyed'));
  }
  if (tutorialActive && tutorialAwaitMeteor) {
    tutorialAwaitMeteor = false;
    spawnMeteorLesson();
  }
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

function catchMeteor() {
  const x = meteor?.x ?? player.x;
  const y = meteor?.y ?? player.y;
  const victims = echoes
    .map((echo) => ghostPoint(echo, ghostFrame()))
    .filter((ghost) => ghost);
  meteor = null;
  echoes = [];
  blasts.push({ x, y, life: 34, max: 34 });
  for (const ghost of victims) blasts.push({ x: ghost.x, y: ghost.y, life: 26, max: 26 });
  burst(x, y, '#ff5a1f');
  burst(x, y, '#fff1c2');
  burst(x, y, '#ffd27a');
  for (const ghost of victims) {
    burst(ghost.x, ghost.y, '#ff7a32');
    burst(ghost.x, ghost.y, '#fff6d8');
  }
  shake = 16;
  addScore(300);
  AudioEngine.blast();
  buzz('missile');
  showToast(t('meteorCatch'));
  announce(t('meteorCatch'));
  if (tutorialActive && tutorialStep === 'meteor') {
    clearLesson();
    beginTutorialWrapUp();
  }
}

function stepMeteor() {
  for (let i = blasts.length - 1; i >= 0; i -= 1) {
    blasts[i].life -= 1;
    if (blasts[i].life <= 0) blasts.splice(i, 1);
  }
  if (!meteor) return;
  const steps = 4;
  for (let i = 0; i < steps; i += 1) {
    meteor.x += meteor.vx / steps;
    meteor.y += meteor.vy / steps;
    const body = playerBodyHit();
    if (Math.hypot(meteor.x - body.x, meteor.y - body.y) < body.radius + 18) {
      catchMeteor();
      return;
    }
  }
  meteor.trail.push({ x: meteor.x, y: meteor.y });
  if (meteor.trail.length > 18) meteor.trail.shift();
  if (particles.length < 90) {
    particles.push({
      x: meteor.x - meteor.vx * 0.35,
      y: meteor.y - meteor.vy * 0.35,
      vx: -meteor.vx * 0.04 + (Math.random() - 0.5) * 0.8,
      vy: -meteor.vy * 0.04 + (Math.random() - 0.5) * 0.8,
      life: 14,
      color: Math.random() < 0.45 ? '#fff6d0' : '#ff4d00',
      size: 3.2,
    });
  }
  if (meteor.y > view.h + 36 || meteor.x < -80 || meteor.x > view.w + 80) {
    meteor = null;
    if (tutorialActive && tutorialStep === 'meteor') spawnMeteor(TUTORIAL_METEOR_FRAMES);
  }
}

function collectCoins() {
  if (tutorialActive && tutorialStep !== 'coins') return;
  const body = playerBodyHit();
  const hit = takeOverlaps(
    collectibles,
    body.x,
    body.y,
    (coin) => body.radius + coin.radius,
  );
  if (!hit.taken.length) return;

  collectibles = hit.kept;
  addScore(100 * hit.taken.length);
  coins += hit.taken.length;
  for (const coin of hit.taken) sparkle(coin.x, coin.y, '#ffbb00');
  AudioEngine.coin();
  if (!tutorialActive) saveAll();
  if (collectibles.length === 0) {
    if (tutorialActive) clearLesson();
    advanceRound();
  }
}

function collectPowerups() {
  const available = tutorialActive ? powerups.filter((power) => lessonAllows(power.type)) : powerups;
  const body = playerBodyHit();
  const hit = takeOverlaps(available, body.x, body.y, (power) => body.radius + (power.type === 'COIN' ? 26 : 12));
  if (!hit.taken.length) return;
  const taken = new Set(hit.taken);
  powerups = powerups.filter((power) => !taken.has(power));
  for (const power of hit.taken) {
    applyPowerup(power);
    advanceTutorialAfterPower(power.type);
  }
}

function movePlayer() {
  // Joystick: direct velocity from stick tilt — no chase-target lag or coasting.
  if (usesJoystick() && joystick.active) {
    const previousX = player.x;
    const previousY = player.y;
    if (joystick.amount > JOYSTICK_DEADZONE) {
      const live = (joystick.amount - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE);
      const scale = (live / joystick.amount) * JOYSTICK_SPEED;
      player.x += joystick.x * scale;
      player.y += joystick.y * scale;
    }
    player.x = clampToField(player.x, player.radius, view.w - player.radius);
    player.y = clampToField(player.y, player.radius, view.h - player.radius);
    player.targetX = player.x;
    player.targetY = player.y;
    player.vx = player.x - previousX;
    player.vy = player.y - previousY;
    if (player.vx * player.vx + player.vy * player.vy >= 0.12) {
      playerFace = Math.atan2(player.vy, player.vx);
    }
    return;
  }

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

  if (isDragging) {
    player.targetX = clampToField(player.targetX, player.radius, view.w - player.radius);
    player.targetY = clampToField(player.targetY, player.radius, view.h - player.radius);
    player.x = player.targetX;
    player.y = player.targetY;
    return;
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
  if (player.vx * player.vx + player.vy * player.vy >= 0.12) {
    playerFace = Math.atan2(player.vy, player.vx);
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

function addShieldLayer(kind) {
  if (kind === 'lasting') shieldLayers.push({ kind: 'lasting' });
  else shieldLayers.push({ kind: 'timed', life: SHIELD_FRAMES });
}

function tickShield() {
  if (!shieldLayers.length) return;
  let removed = false;
  for (let i = shieldLayers.length - 1; i >= 0; i -= 1) {
    const layer = shieldLayers[i];
    if (layer.kind !== 'timed') continue;
    layer.life -= 1;
    if (layer.life <= 0) {
      shieldLayers.splice(i, 1);
      removed = true;
    }
  }
  if (removed && shieldLayers.length === 0) grace = Math.max(grace, SHIELD_END_GRACE);
}

function absorbShieldHit() {
  shieldLayers.pop();
  grace = Math.max(grace, SHIELD_END_GRACE);
  burst(player.x, player.y, '#7af6ff');
  AudioEngine.shieldBreak();
  buzz('shield');
}

function update() {
  if (gameState !== 'PLAYING') return;

  movePlayer();
  currentPath.push({ x: player.x, y: player.y, t: roundFrame });
  collectCoins();
  collectPowerups();
  stepMeteor();
  stepMissile();
  tickShield();
  stepParticles();

  if (tutorialActive && tutorialStep) tutorialStepFrames += 1;
  if (tutorialActive && tutorialStep === 'echo' && tutorialStepFrames > 50 && tutorialTravel() > 70) {
    clearLesson();
    spawnShieldLesson();
  }
  if (tutorialActive && tutorialStep === 'wrap' && tutorialStepFrames > 140) {
    finishTutorial();
    return;
  }

  const readingLesson = tutorialActive && (bannerTimer > 0 || bannerQueue.length > 0);
  if (!readingLesson && grace <= 0 && playerTouchesEcho()) {
    if (shieldLayers.length > 0) absorbShieldHit();
    else {
      gameOver();
      return;
    }
  }

  if (grace > 0) grace -= 1;
  tickBanner();
  if (recordFlash > 0) recordFlash -= 1;
  for (let i = coinFlashes.length - 1; i >= 0; i -= 1) {
    coinFlashes[i].life -= 1;
    if (coinFlashes[i].life <= 0) coinFlashes.splice(i, 1);
  }
  if (skipFrameTick) skipFrameTick = false;
  else roundFrame += 1;
  syncHUD();
}

function gameOver() {
  if (tutorialActive) {
    failTutorial();
    return;
  }
  shieldLayers = [];
  AudioEngine.hit();
  buzz('death');
  shake = 14;
  const hadRecord = bestScore > 0 || bestRound > 0;
  const scoreRecord = score > bestScore;
  const roundRecord = currentRound > bestRound;
  if (scoreRecord) bestScore = score;
  if (roundRecord) bestRound = currentRound;
  saveAll();
  syncHUD();
  syncMenu();

  const brokeRecord = hadRecord && (scoreRecord || roundRecord);
  const celebrate = brokeRecord ? t('newRecord') : '';
  const summary = `${t('lostLine', { round: currentRound, score })}${celebrate}`;
  setText('final-stats', summary);
  setText('final-best', t('bestLine', { score: bestScore, round: bestRound }));
  const recordBanner = document.getElementById('record-banner');
  if (recordBanner) {
    recordBanner.hidden = !brokeRecord;
    recordBanner.textContent = t('recordBanner');
  }
  document.getElementById('game-over-screen')?.classList.toggle('record', brokeRecord);
  if (brokeRecord) {
    burst(player.x, player.y, '#ffe7a3');
    burst(player.x, player.y, '#fffdf2');
    window.setTimeout(() => AudioEngine.record(), 180);
  }
  missile = null;
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) continueBtn.hidden = continued;
  setMode('GAMEOVER');
  showScreen('game-over-screen');
  burst(player.x, player.y, '#fff1c2');
  burst(player.x, player.y, '#ff4d00');
  announce(t('lostAnnounce', { summary }));
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

function softBlob(g, x, y, radius, rgb, alpha) {
  if (!(radius > 0) || !(alpha > 0)) return;
  const glow = g.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(${rgb}, ${alpha})`);
  glow.addColorStop(0.45, `rgba(${rgb}, ${alpha * 0.35})`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = glow;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

function spiralGeometry() {
  const turns = 1.15;
  const maxTheta = turns * Math.PI * 2;
  const inner = 0.22;
  return { maxTheta, inner, growth: Math.log(1 / inner) / maxTheta };
}

function spiralAt(radius, theta, phase, geom) {
  const r = radius * geom.inner * Math.exp(geom.growth * theta);
  const angle = theta + phase;
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, angle };
}

/** A small smear of star dust wound into a spiral. Faint enough to sit in the background. */
function paintSpiralGalaxy(g, rand, radius, tilt) {
  const geom = spiralGeometry();
  g.save();
  g.scale(1, tilt);
  g.globalCompositeOperation = 'source-over';

  for (let arm = 0; arm < 2; arm += 1) {
    const phase = arm * Math.PI + (rand() - 0.5) * 0.35;
    const reach = 0.88 + rand() * 0.12;
    for (let i = 0; i < 32; i += 1) {
      const t = i / 31;
      const point = spiralAt(radius * reach, t * geom.maxTheta, phase, geom);
      const body = Math.sin(Math.PI * t);
      const width = radius * (0.18 + body * 0.34);
      softBlob(g, point.x, point.y, width, '186, 204, 232', 0.018 + body * 0.022);
      const scatter = (rand() - 0.5) * width * 1.8;
      const sx = point.x + Math.cos(point.angle + Math.PI / 2) * scatter;
      const sy = point.y + Math.sin(point.angle + Math.PI / 2) * scatter;
      g.fillStyle = `rgba(214, 224, 244, ${0.16 + rand() * 0.2})`;
      g.beginPath();
      g.arc(sx, sy, 0.42, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
  softBlob(g, 0, 0, radius * 0.2, '214, 206, 190', 0.04);
}

/** Edge-on disk as a thin dust smear, without a bright core. */
function paintEdgeGalaxy(g, rand, rx) {
  const ry = Math.max(2, rx * 0.16);
  g.globalCompositeOperation = 'source-over';
  g.save();
  g.scale(1, ry / rx);
  const disk = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  disk.addColorStop(0, 'rgba(198, 210, 232, 0.14)');
  disk.addColorStop(0.4, 'rgba(170, 188, 216, 0.06)');
  disk.addColorStop(1, 'rgba(170, 188, 216, 0)');
  g.fillStyle = disk;
  g.beginPath();
  g.arc(0, 0, rx, 0, Math.PI * 2);
  g.fill();
  g.restore();

  for (let i = 0; i < 18; i += 1) {
    const along = (rand() - 0.5) * 2;
    const x = along * rx * (0.2 + rand() * 0.7);
    const y = (rand() - 0.5) * ry * 0.8;
    g.fillStyle = `rgba(220, 228, 244, ${0.1 + rand() * 0.14})`;
    g.beginPath();
    g.arc(x, y, 0.35, 0, Math.PI * 2);
    g.fill();
  }
  softBlob(g, 0, 0, ry * 1.4, '210, 204, 190', 0.08);
}

function rasterizeGalaxy(paint, span, dpr, rot) {
  const size = Math.max(2, Math.ceil(span * 2 * dpr));
  const buffer = document.createElement('canvas');
  buffer.width = size;
  buffer.height = size;
  const g = buffer.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, size / 2, size / 2);
  g.save();
  g.rotate(rot);
  paint(g);
  g.restore();
  return buffer;
}

let starfield = null;

function ensureStars() {
  if (starfield && starfield.w === view.w && starfield.h === view.h && starfield.dpr === view.dpr) return;
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

  const area = view.w * view.h;
  const galaxyRand = mulberry32(29);
  const unit = Math.min(view.w, view.h);
  const blueprints = [
    { kind: 'spiral', tilt: 0.9, at: { x: 0.74, y: 0.28 } },
    { kind: 'edge', tilt: 1, at: { x: 0.7, y: 0.62 } },
    { kind: 'spiral', tilt: 0.62, at: { x: 0.26, y: 0.46 } },
  ];
  if (area > 500000) blueprints.push({ kind: 'spiral', tilt: 0.78, at: { x: 0.32, y: 0.78 } });
  blueprints.push(
    { kind: 'spiral', tilt: 0.88, at: { x: 0.16, y: 0.14 } },
    { kind: 'edge', at: { x: 0.46, y: 0.16 }, spin: 1.05 },
    { kind: 'edge', at: { x: 0.9, y: 0.4 }, spin: Math.PI / 2 },
    { kind: 'spiral', tilt: 0.55, at: { x: 0.18, y: 0.84 } },
    { kind: 'edge', at: { x: 0.58, y: 0.9 }, spin: -0.25 },
  );
  const galaxies = [];
  for (const blueprint of blueprints) {
    const edge = blueprint.kind === 'edge';
    const radius = clamp(unit * (edge ? 0.05 : 0.04) * (0.9 + galaxyRand() * 0.2), 12, edge ? 26 : 20);
    const tilt = edge ? 1 : clamp(blueprint.tilt + (galaxyRand() - 0.5) * 0.05, 0.5, 0.96);
    const span = radius * (edge ? 1.28 : 1.35);
    const rot = blueprint.spin != null
      ? blueprint.spin + (galaxyRand() - 0.5) * 0.2
      : edge
        ? (galaxyRand() - 0.5) * 0.7
        : galaxyRand() * Math.PI * 2;
    const x = view.w * clamp(blueprint.at.x + (galaxyRand() - 0.5) * 0.08, 0.1, 0.9);
    const y = view.h * clamp(blueprint.at.y + (galaxyRand() - 0.5) * 0.06, 0.08, 0.92);
    const image = rasterizeGalaxy((g) => {
      if (edge) paintEdgeGalaxy(g, galaxyRand, radius);
      else paintSpiralGalaxy(g, galaxyRand, radius, tilt);
    }, span, view.dpr, rot);
    galaxies.push({ x, y, span, image });
  }

  const nebulaColors = ['138, 108, 196', '28, 48, 82', '176, 104, 132', '92, 156, 158'];
  const nebulae = nebulaColors.slice(0, area > 500000 ? 4 : 3).map((color) => ({
    x: view.w * (0.18 + rand() * 0.64),
    y: view.h * (0.16 + rand() * 0.68),
    r: Math.min(view.w, view.h) * (0.2 + rand() * 0.1),
    color,
    phase: rand() * Math.PI * 2,
    drift: 10 + rand() * 16,
  }));

  const comets = [];
  const cometCount = area > 500000 ? 3 : 2;
  for (let i = 0; i < cometCount; i += 1) {
    comets.push({
      y0: view.h * (0.12 + rand() * 0.76),
      slope: -0.28 + rand() * 0.56,
      period: 26 + rand() * 24,
      offset: rand(),
      tail: 34 + rand() * 38,
      angle: -0.55 + rand() * 0.7,
    });
  }

  starfield = { w: view.w, h: view.h, dpr: view.dpr, points, galaxies, nebulae, comets };
}

function drawNebulae(now, scroll = 0, driftX = 0, driftY = 0) {
  for (const cloud of starfield.nebulae) {
    const x = wrapField(
      cloud.x + Math.sin(now * 0.045 + cloud.phase) * cloud.drift + scroll * driftX * 0.22,
      view.w,
    );
    const y = wrapField(
      cloud.y + Math.cos(now * 0.037 + cloud.phase) * cloud.drift * 0.55 + scroll * driftY * 0.22,
      view.h,
    );
    const glow = ctx.createRadialGradient(x, y, 0, x, y, cloud.r);
    glow.addColorStop(0, `rgba(${cloud.color}, 0.16)`);
    glow.addColorStop(0.42, `rgba(${cloud.color}, 0.07)`);
    glow.addColorStop(1, `rgba(${cloud.color}, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, cloud.r, 0, Math.PI * 2);
    ctx.fill();

    const wx = x + Math.cos(cloud.phase) * cloud.r * 0.38;
    const wy = y - cloud.r * 0.12;
    const wispRadius = cloud.r * 0.48;
    const wisp = ctx.createRadialGradient(wx, wy, 0, wx, wy, wispRadius);
    wisp.addColorStop(0, `rgba(${cloud.color}, 0.09)`);
    wisp.addColorStop(1, `rgba(${cloud.color}, 0)`);
    ctx.fillStyle = wisp;
    ctx.beginPath();
    ctx.arc(wx, wy, wispRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGalaxies(scroll = 0, driftX = 0, driftY = 0) {
  for (const galaxy of starfield.galaxies) {
    const x = wrapField(galaxy.x + scroll * driftX * 0.12, view.w);
    const y = wrapField(galaxy.y + scroll * driftY * 0.12, view.h);
    ctx.drawImage(
      galaxy.image,
      x - galaxy.span,
      y - galaxy.span,
      galaxy.span * 2,
      galaxy.span * 2,
    );
  }
}

function drawTwinkle(x, y, radius, tint, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.4);
  glow.addColorStop(0, `rgba(${tint}, 0.45)`);
  glow.addColorStop(1, `rgba(${tint}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.4, 0, Math.PI * 2);
  ctx.fill();
  const arm = radius * 2.4;
  const waist = Math.max(0.35, radius * 0.28);
  ctx.fillStyle = `rgba(${tint}, 0.92)`;
  ctx.beginPath();
  ctx.moveTo(0, -arm);
  ctx.quadraticCurveTo(waist, -waist, arm * 0.72, 0);
  ctx.quadraticCurveTo(waist, waist, 0, arm);
  ctx.quadraticCurveTo(-waist, waist, -arm * 0.72, 0);
  ctx.quadraticCurveTo(-waist, -waist, 0, -arm);
  ctx.fill();
  ctx.restore();
}

function drawComets(now) {
  for (const comet of starfield.comets) {
    const cycle = (now / comet.period + comet.offset) % 1;
    if (cycle > 0.2) continue;
    const travel = cycle / 0.2;
    const fade = Math.sin(travel * Math.PI);
    const x = -comet.tail + travel * (view.w + comet.tail * 2);
    const y = comet.y0 + (x - view.w * 0.5) * comet.slope;
    const dx = Math.cos(comet.angle) * comet.tail;
    const dy = Math.sin(comet.angle) * comet.tail;
    const tail = ctx.createLinearGradient(x, y, x - dx, y - dy);
    tail.addColorStop(0, `rgba(255, 246, 226, ${0.38 * fade})`);
    tail.addColorStop(0.45, `rgba(186, 206, 255, ${0.12 * fade})`);
    tail.addColorStop(1, 'rgba(186, 206, 255, 0)');
    ctx.strokeStyle = tail;
    ctx.lineWidth = 1.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - dx, y - dy);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 250, 242, ${0.62 * fade})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.25, 0, Math.PI * 2);
    ctx.fill();
  }
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

function wrapField(value, size) {
  return ((value % size) + size) % size;
}

function drawAtmosphere() {
  const now = performance.now() / 1000;
  // Seamless space scroll — feels like flying through the field.
  const scroll = now * 42;
  const driftX = -1;
  const driftY = 0.38;
  ctx.save();
  const drifts = [
    { x: 0.25, y: 0.3, color: '255, 40, 90', r: 0.55 },
    { x: 0.75, y: 0.62, color: '10, 28, 62', r: 0.48 },
    { x: 0.5, y: 0.85, color: '120, 40, 255', r: 0.36 },
  ];
  for (const drift of drifts) {
    const x = wrapField((drift.x + Math.sin(now * 0.12 + drift.y) * 0.08) * view.w + scroll * driftX * 0.08, view.w);
    const y = wrapField((drift.y + Math.cos(now * 0.1 + drift.x) * 0.06) * view.h + scroll * driftY * 0.08, view.h);
    const radius = Math.max(view.w, view.h) * drift.r;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, `rgba(${drift.color}, 0.07)`);
    glow.addColorStop(1, `rgba(${drift.color}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  ensureStars();
  drawNebulae(now, scroll, driftX, driftY);
  drawGalaxies(scroll, driftX, driftY);
  for (const star of starfield.points) {
    const depth = star.r < 0.8 ? 0.4 : star.r < 1.5 ? 0.85 : 1.35;
    const x = wrapField(star.x + scroll * driftX * depth, view.w);
    const y = wrapField(star.y + scroll * driftY * depth, view.h);
    if (star.r > 1.6) {
      const spark = 0.78 + Math.sin(now * 1.7 + star.phase) * 0.22;
      drawTwinkle(x, y, star.r * spark, star.tint, star.phase);
      continue;
    }
    const twinkle = 0.62 + Math.sin(now * 1.4 + star.phase) * 0.32;
    ctx.fillStyle = `rgba(${star.tint}, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(x, y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  drawComets(now);
  ctx.restore();
}

function drawVignette() {
  const glow = ctx.createRadialGradient(
    view.w / 2,
    view.h / 2,
    Math.min(view.w, view.h) * 0.46,
    view.w / 2,
    view.h / 2,
    Math.max(view.w, view.h) * 0.82,
  );
  glow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(0.62, 'rgba(0, 0, 0, 0)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
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

function resamplePath(points, spacing) {
  if (points.length < 2) return points;
  const out = [points[0]];
  let anchor = points[0];
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    const dist = Math.hypot(point.x - anchor.x, point.y - anchor.y);
    const last = i === points.length - 1;
    if (dist >= spacing || (last && dist > 0.5)) {
      out.push(point);
      anchor = point;
    }
  }
  return out;
}

function traceRibbon(points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
}

function drawLitRibbon(points, color, width, alpha) {
  const ribbon = resamplePath(points, 8);
  if (ribbon.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  traceRibbon(ribbon);
  ctx.strokeStyle = hexAlpha(color, Math.min(0.5, alpha * 0.32));
  ctx.lineWidth = width * 3.1;
  ctx.stroke();
  ctx.strokeStyle = hexAlpha(color, Math.min(1, alpha * 0.82));
  ctx.lineWidth = width * 1.15;
  ctx.stroke();

  let run = [];
  const paintRun = () => {
    if (run.length < 2) {
      run = [];
      return;
    }
    const span = Math.hypot(run[run.length - 1].x - run[0].x, run[run.length - 1].y - run[0].y);
    if (span >= 28) {
      const mid = run[Math.floor(run.length / 2)];
      const near = proximity(mid.x, mid.y);
      traceRibbon(run);
      ctx.strokeStyle = hexAlpha(color, Math.min(1, alpha * (0.55 + near * 0.45)));
      ctx.lineWidth = width * (1.35 + near * 0.7);
      ctx.stroke();
    }
    run = [];
  };
  for (const point of ribbon) {
    if (proximity(point.x, point.y) > 0.22) run.push(point);
    else paintRun();
  }
  paintRun();
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

function paintCapsule(x0, y0, x1, y1, width, fill, stroke) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.hypot(dx, dy) || 1;
  ctx.save();
  ctx.translate(x0, y0);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.beginPath();
  ctx.arc(0, 0, width / 2, Math.PI / 2, -Math.PI / 2);
  ctx.arc(length, 0, width / 2, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1.05, width * 0.14);
    ctx.stroke();
  }
  ctx.restore();
}

/** Tapered limb segment (upper arm, thigh, etc.). */
function paintTaperedLimb(x0, y0, x1, y1, w0, w1, fill, stroke) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len);
  const ny = (dx / len);
  ctx.beginPath();
  ctx.moveTo(x0 + nx * w0, y0 + ny * w0);
  ctx.lineTo(x1 + nx * w1, y1 + ny * w1);
  ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
  ctx.lineTo(x0 - nx * w0, y0 - ny * w0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1, (w0 + w1) * 0.12);
    ctx.stroke();
  }
}

function paintJoint(x, y, radius, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1, radius * 0.35);
    ctx.stroke();
  }
}

/** Clenched fist at the flight tip — top-down rear view. */
function paintFlightFist(x, y, angle, r, fill, stroke, hollow, sleeve) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const cuff = hollow ? 'rgba(255,255,255,0.85)' : (sleeve || fill);
  const glove = hollow ? 'rgba(255,255,255,0.96)' : fill;
  ctx.fillStyle = cuff;
  ctx.beginPath();
  ctx.ellipse(-r * 0.12, 0, r * 0.1, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.stroke();
  }
  ctx.fillStyle = glove;
  ctx.beginPath();
  ctx.ellipse(r * 0.02, 0, r * 0.16, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1, r * 0.045);
    ctx.stroke();
  }
  // Knuckles
  ctx.fillStyle = hollow ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.12)';
  for (const ky of [-0.08, -0.02, 0.04, 0.1]) {
    ctx.beginPath();
    ctx.ellipse(r * 0.1, ky * r, r * 0.035, r * 0.028, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Top-down rear flight pose: local +x is forward (fist), cape & boot soles trail in −x.
 * HEAD_LINE is the lateral center of the head (y).
 */
const HEAD_LINE = 0;
const HEAD_X = 0.16;
const FIST_X = 0.92;
const FIST_Y = 0.28;
const FLY_FORWARD = 0;

/** Lighten a hex while keeping its hue — faded double, still color-readable. */
function washHex(hex, amount) {
  const t = Math.max(0, Math.min(1, amount));
  const [r, g, b] = hexRgb(hex);
  const mix = (c) => Math.round(c + (238 - c) * t);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Cape silhouette — wide top-down sail that billows in the wind. */
function traceCape(r, flutter) {
  const f = flutter || {
    w1: 0, w2: 0, w3: 0, stretch: r * 1.85, sway: 0, billow: 0, flap: 0,
  };
  const neckX = -r * 0.1;
  const midX = -r * 0.85 + f.sway * 0.15;
  const tipX = -f.stretch + f.sway * 0.35;
  const neckW = r * 0.22;
  // Opposite sides swell out of phase so the cloth reads as flying.
  const midWTop = r * 0.68 + f.w1 * 0.55 + f.billow * 0.35;
  const midWBot = r * 0.68 - f.w1 * 0.4 + f.billow * 0.25;
  const tipWTop = r * 1.02 + f.w3 * 0.7 + f.flap * 0.45;
  const tipWBot = r * 1.02 - f.w3 * 0.55 + f.flap * 0.3;
  const hemJag = f.w2 * 0.55 + f.flap * 0.25;
  ctx.beginPath();
  ctx.moveTo(neckX, -neckW);
  ctx.lineTo(neckX + r * 0.04, neckW);
  ctx.quadraticCurveTo(midX + f.sway * 0.1, midWBot + f.w2 * 0.2, tipX + r * 0.12, tipWBot);
  // Jagged hem flutters point-by-point.
  ctx.lineTo(tipX - r * 0.04 + f.w1 * 0.15, tipWBot * 0.4 + hemJag);
  ctx.lineTo(tipX - r * 0.18 + f.flap * 0.2, f.w1 * 0.25 + f.sway * 0.2);
  ctx.lineTo(tipX - r * 0.04 - f.w2 * 0.12, -tipWTop * 0.4 - hemJag * 0.85);
  ctx.lineTo(tipX + r * 0.12, -tipWTop);
  ctx.quadraticCurveTo(midX - f.sway * 0.08, -midWTop + f.w1 * 0.15, neckX, -neckW);
  ctx.closePath();
}

function fistOffset(radius) {
  return { x: FIST_X * radius, y: FIST_Y * radius };
}

/** World point of a local flight-space offset when the fist is pinned at `x, y`. */
function flightWorld(x, y, radius, heading, localX, localY) {
  const fist = fistOffset(radius);
  const angle = (heading ?? 0) - FLY_FORWARD;
  const dx = localX - fist.x;
  const dy = localY - fist.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x + cos * dx - sin * dy,
    y: y + sin * dx + cos * dy,
  };
}

/** Hit circle on the cape / upper back — not on the leading fist. */
function bodyHit(x, y, radius, heading) {
  const center = flightWorld(x, y, radius, heading, -radius * 0.55, HEAD_LINE * radius);
  return { x: center.x, y: center.y, radius: radius * 0.78 };
}

function playerBodyHit() {
  return bodyHit(player.x, player.y, 20, fireHeading());
}

/** Trail tip sits under the cape (mid-rear), so the ribbon emerges from beneath it. */
function trailAnchor(x, y, radius, heading) {
  return flightWorld(x, y, radius, heading, -radius * 1.05, HEAD_LINE * radius);
}

/**
 * Rebuild the drawn trail from fist path points so each sample sits under the
 * body for that heading — keeps the ribbon glued to the character.
 */
function bodyTrailFromPath(points, radius, tipHeading) {
  if (points.length < 2) return points;
  const out = [];
  let heading = tipHeading ?? 0;
  for (let i = 0; i < points.length; i += 1) {
    if (i > 0) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      if (dx * dx + dy * dy >= 0.25) heading = Math.atan2(dy, dx);
    } else if (points.length > 1) {
      const dx = points[1].x - points[0].x;
      const dy = points[1].y - points[0].y;
      if (dx * dx + dy * dy >= 0.25) heading = Math.atan2(dy, dx);
    }
    const useHeading = i === points.length - 1 && tipHeading != null ? tipHeading : heading;
    const hips = trailAnchor(points[i].x, points[i].y, radius, useHeading);
    out.push({ x: hips.x, y: hips.y, t: points[i].t });
  }
  return out;
}

function echoBodyHit(ghost, heading) {
  if (!ghost) return null;
  return bodyHit(ghost.x, ghost.y, 17, heading ?? 0);
}

function playerTouchesEcho() {
  const me = playerBodyHit();
  const clock = ghostFrame();
  for (const echo of echoes) {
    const ghost = ghostPoint(echo, clock);
    const other = echoBodyHit(ghost, faceAlong(echo, clock));
    if (!other) continue;
    if (Math.hypot(me.x - other.x, me.y - other.y) < me.radius + other.radius) return true;
  }
  return false;
}

/** Put the leading fist on `x, y` and turn the body behind it. */
function placeFlight(x, y, radius, heading) {
  const fist = fistOffset(radius);
  ctx.translate(x, y);
  ctx.rotate((heading ?? 0) - FLY_FORWARD);
  ctx.translate(-fist.x, -fist.y);
}

/** Top-down rear silhouette shared by the runner and the hollow double. */
function paintRunner(radius, phase, look) {
  const r = radius;
  const faded = Boolean(look.hollow);
  // Suit/hair wash keeps doubles readable; cape keeps full shop/flag color.
  const bodyWash = faded ? 0.55 : 0;
  const cloth = look.cloth || '#ffb000';
  const skin = '#f0d2b0';
  const shade = look.shade || cloth;
  const edge = faded ? 'rgba(70, 78, 96, 0.7)' : 'rgba(12, 16, 28, 0.55)';
  const wind = Math.min(1.55, Math.max(0.55, look.wind ?? 1));
  const headY = HEAD_LINE * r;
  const headX = HEAD_X * r;
  // Multi-frequency wind so the cape billows instead of sitting still.
  const w1 = Math.sin(phase * 1.15) * r * 0.28 * wind;
  const w2 = Math.sin(phase * 1.7 + 1.1) * r * 0.34 * wind;
  const w3 = Math.sin(phase * 2.25 + 2.3) * r * 0.26 * wind;
  const sway = Math.sin(phase * 0.85 + 0.4) * r * 0.22 * wind;
  const billow = (0.55 + Math.sin(phase * 1.4 + 0.7) * 0.45) * r * 0.2 * wind;
  const flap = Math.sin(phase * 2.8 + 1.6) * r * 0.2 * wind;
  const stretch = r * (1.85 + wind * 0.35 + Math.sin(phase * 1.05) * 0.12 * wind);
  const flutter = { w1, w2, w3, stretch, sway, billow, flap };
  const capeCloth = cloth;
  const [cr, cg, cb] = hexRgb(capeCloth);
  const capeFill = (scale) =>
    `rgb(${Math.round(cr * scale)}, ${Math.round(cg * scale)}, ${Math.round(cb * scale)})`;
  // Soles follow flag / cape shade; hand color stays fixed.
  const bootBase = look.flag ? flagInk(look.flag) : shade;
  const bootFill = bootBase;
  const suitFill = washHex('#cfd6e2', bodyWash);
  const suitShade = washHex('#8b96a8', bodyWash);
  const hair = washHex('#141824', bodyWash * 0.7);
  const soleGap = r * 0.22;
  const capeTipX = -flutter.stretch;
  const fist = fistOffset(r);
  const shoulderX = -r * 0.18;
  const shoulderY = r * 0.4;
  const elbowX = r * 0.4;
  const elbowY = r * 0.38 + w1 * 0.04;

  // 1) Legs start under the cape, then extend straight back to the soles.
  const legRootX = capeTipX + r * 0.32;
  const ankleX = capeTipX - r * 0.32;
  const soleAt = ankleX - r * 0.1;
  for (const side of [-1, 1]) {
    const sy = side * soleGap + w1 * 0.06;
    paintTaperedLimb(legRootX, sy, ankleX, sy, r * 0.085, r * 0.095, suitShade, edge);
    paintJoint(ankleX + r * 0.02, sy, r * 0.07, suitFill, edge);
    ctx.beginPath();
    ctx.ellipse(soleAt, sy, r * 0.18, r * 0.13, 0, 0, Math.PI * 2);
    ctx.fillStyle = bootFill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.max(1.25, r * 0.05);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(soleAt - r * 0.02, sy, r * 0.09, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = Math.max(0.85, r * 0.032);
    ctx.beginPath();
    ctx.moveTo(soleAt - r * 0.09, sy - r * 0.045);
    ctx.lineTo(soleAt + r * 0.07, sy - r * 0.045);
    ctx.moveTo(soleAt - r * 0.09, sy + r * 0.035);
    ctx.lineTo(soleAt + r * 0.07, sy + r * 0.035);
    ctx.stroke();
  }

  // 2) Arm starts under the cape side, reaches the fist.
  paintTaperedLimb(shoulderX, shoulderY, elbowX, elbowY, r * 0.11, r * 0.095, suitFill, edge);
  paintTaperedLimb(elbowX, elbowY, fist.x - r * 0.12, fist.y, r * 0.095, r * 0.085, suitFill, edge);
  paintJoint(shoulderX, shoulderY, r * 0.1, suitShade, edge);

  // 3) Cape on top — covers the limb roots so they read as coming from under it.
  // Flag / shop color fully replaces the default orange — never leave a classic underlayer.
  traceCape(r, flutter);
  if (look.flag) {
    ctx.fillStyle = flagInk(look.flag);
    ctx.fill();
    const capeMidX = (-r * 0.1 - flutter.stretch) * 0.5 - r * 0.22;
    const flagR = r * 0.9;
    ctx.save();
    traceCape(r, flutter);
    ctx.clip();
    ctx.translate(capeMidX, headY);
    ctx.translate(0, flagR * 0.45);
    ctx.scale(1.55, 1.4);
    paintGhostFlag(ctx, flagR, look.flag);
    ctx.restore();
  } else {
    const cape = ctx.createLinearGradient(-r * 0.1, -r * 0.5, -flutter.stretch, r * 0.5);
    cape.addColorStop(0, capeFill(1.05));
    cape.addColorStop(0.45, capeFill(0.95));
    cape.addColorStop(1, capeFill(0.78));
    ctx.fillStyle = cape;
    ctx.fill();
    // Wind-driven fold lines that travel down the cape.
    const [sr, sg, sb] = hexRgb(capeCloth);
    ctx.strokeStyle = `rgba(${Math.round(sr * 0.45)}, ${Math.round(sg * 0.35)}, ${Math.round(sb * 0.3)}, 0.5)`;
    ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.beginPath();
    ctx.moveTo(-r * 0.22, -r * 0.06 + w1 * 0.08);
    ctx.quadraticCurveTo(
      -r * 0.85 + sway * 0.2,
      -r * 0.28 + w2 * 0.45,
      -flutter.stretch + r * 0.22 + flap * 0.15,
      -r * 0.55 + w3 * 0.35,
    );
    ctx.moveTo(-r * 0.24, r * 0.08 - w1 * 0.06);
    ctx.quadraticCurveTo(
      -r * 0.9 - sway * 0.15,
      r * 0.32 + w1 * 0.35,
      -flutter.stretch + r * 0.2 - flap * 0.1,
      r * 0.58 + w2 * 0.25,
    );
    ctx.moveTo(-r * 0.35, w2 * 0.05);
    ctx.quadraticCurveTo(
      -r * 1.05 + sway * 0.1,
      billow * 0.4,
      -flutter.stretch + r * 0.15,
      flap * 0.3,
    );
    ctx.stroke();
  }

  traceCape(r, flutter);
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1.35, r * 0.055);
  ctx.stroke();

  // 4) Shoulders / upper back (suit).
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.32);
  ctx.quadraticCurveTo(r * 0.08, 0, -r * 0.05, r * 0.32);
  ctx.quadraticCurveTo(-r * 0.28, r * 0.18, -r * 0.3, 0);
  ctx.quadraticCurveTo(-r * 0.28, -r * 0.18, -r * 0.05, -r * 0.32);
  ctx.closePath();
  const suit = ctx.createLinearGradient(-r * 0.3, 0, r * 0.05, 0);
  suit.addColorStop(0, suitShade);
  suit.addColorStop(1, suitFill);
  ctx.fillStyle = suit;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1.1, r * 0.04);
  ctx.stroke();

  // 5) Back of head with hair texture (reads as scalp, not a ball).
  ctx.beginPath();
  ctx.arc(headX, headY, r * 0.34, 0, Math.PI * 2);
  const scalp = ctx.createRadialGradient(headX - r * 0.06, headY, r * 0.02, headX, headY, r * 0.36);
  scalp.addColorStop(0, washHex('#2a3144', bodyWash));
  scalp.addColorStop(0.45, hair);
  scalp.addColorStop(1, washHex('#0a0c12', bodyWash * 0.45));
  ctx.fillStyle = scalp;
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(headX, headY, r * 0.34, 0, Math.PI * 2);
  ctx.clip();
  // Layered strands from a crown part — classic back-of-head look.
  const strand = faded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.16)';
  const shadeStrand = faded ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.38)';
  ctx.lineCap = 'round';
  for (let i = -5; i <= 5; i += 1) {
    const a = (i / 5) * 1.15;
    const ox = Math.cos(a) * r * 0.02;
    const oy = Math.sin(a) * r * 0.02;
    ctx.strokeStyle = i % 2 === 0 ? shadeStrand : strand;
    ctx.lineWidth = Math.max(0.9, r * (0.028 + (Math.abs(i) % 3) * 0.006));
    ctx.beginPath();
    ctx.moveTo(headX + ox, headY + oy);
    ctx.quadraticCurveTo(
      headX - r * 0.06 + oy * 0.8,
      headY + Math.sin(a) * r * 0.18,
      headX - r * 0.28 + Math.cos(a) * r * 0.08,
      headY + Math.sin(a) * r * 0.28,
    );
    ctx.stroke();
  }
  // Crown swirl / cowlick
  ctx.strokeStyle = shadeStrand;
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.beginPath();
  ctx.arc(headX + r * 0.02, headY - r * 0.02, r * 0.1, -0.4, 2.4);
  ctx.stroke();
  ctx.strokeStyle = strand;
  ctx.lineWidth = Math.max(0.8, r * 0.03);
  ctx.beginPath();
  ctx.arc(headX, headY + r * 0.02, r * 0.16, 0.6, 2.8);
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(headX, headY, r * 0.34, 0, Math.PI * 2);
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.stroke();

  // 6) Fist on top — fixed hand color (not skin/flag).
  paintFlightFist(fist.x, fist.y, 0, r, skin, edge, false, suitFill);
}

function drawFireball(x, y, radius, phase, alpha, heading = null, style = null, wind = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  placeFlight(x, y, radius, heading);
  const palette = firePalette(style);
  // Prefer shop body color for the cape; trail cool is only the classic/fallback shade.
  const cloth = style?.body || palette.body[2];
  const shade = style?.body || palette.body[3];
  paintRunner(radius, phase, {
    hollow: false,
    cloth,
    skin: palette.body[1],
    shade,
    flag: palette.flag,
    wind,
  });
  ctx.restore();
}

function trailStrength(point) {
  const age = roundFrame - (point.t ?? roundFrame);
  if (age <= TRAIL_HOLD) return 1;
  const fade = (age - TRAIL_HOLD) / TRAIL_FADE;
  if (fade >= 1) return 0;
  return 1 - fade;
}

function drawTaper(points, widthAt, rgb, alpha) {
  const lens = [0];
  for (let i = 1; i < points.length; i += 1) {
    const span = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    lens.push(lens[i - 1] + span);
  }
  const total = lens[lens.length - 1];
  if (total < 1) return;
  const dirs = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const span = lens[i + 1] - lens[i] || 1;
    dirs.push({
      x: (points[i + 1].x - points[i].x) / span,
      y: (points[i + 1].y - points[i].y) / span,
    });
  }
  const left = [];
  const right = [];
  for (let i = 0; i < points.length; i += 1) {
    const half = widthAt(lens[i] / total) / 2;
    const incoming = dirs[Math.max(0, i - 1)];
    const outgoing = dirs[Math.min(dirs.length - 1, i)];
    const nx = -incoming.y - outgoing.y;
    const ny = incoming.x + outgoing.x;
    const nlen = Math.hypot(nx, ny) || 1;
    const mx = nx / nlen;
    const my = ny / nlen;
    const denom = mx * -outgoing.y + my * outgoing.x;
    if (denom < 0.45) {
      const ax = -incoming.y;
      const ay = incoming.x;
      const bx = -outgoing.y;
      const by = outgoing.x;
      left.push({ x: points[i].x + ax * half, y: points[i].y + ay * half });
      left.push({ x: points[i].x + bx * half, y: points[i].y + by * half });
      right.push({ x: points[i].x - ax * half, y: points[i].y - ay * half });
      right.push({ x: points[i].x - bx * half, y: points[i].y - by * half });
    } else {
      const scale = Math.min(1.8, 1 / denom);
      left.push({ x: points[i].x + mx * half * scale, y: points[i].y + my * half * scale });
      right.push({ x: points[i].x - mx * half * scale, y: points[i].y - my * half * scale });
    }
  }
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < left.length; i += 1) ctx.lineTo(left[i].x, left[i].y);
  for (let i = right.length - 1; i >= 0; i -= 1) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
  ctx.fill();
}

function drawFireTrail(points, style = null) {
  let first = 0;
  while (first < points.length - 1 && trailStrength(points[first]) <= 0) first += 1;
  const ribbon = resamplePath(points.slice(first), 6);
  if (ribbon.length < 2) return;
  ctx.save();
  const layers = firePalette(style).ribbon;
  for (const [thin, thick, rgb, alpha] of layers) {
    drawTaper(ribbon, (t) => thin + (thick - thin) * t * t * t, rgb, alpha);
  }
  ctx.restore();
}

function fillDot(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(x, y, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawCrownShape(r, tall) {
  const gold = ctx.createLinearGradient(0, -r * 1.8, 0, -r * 0.4);
  gold.addColorStop(0, '#fff4c2');
  gold.addColorStop(0.5, '#f0c14b');
  gold.addColorStop(1, '#9a6410');
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.52);
  ctx.lineTo(-r * 0.8, -r * 1.22);
  ctx.lineTo(-r * 0.48, -r * 0.78);
  ctx.lineTo(-r * 0.36, tall ? -r * 1.35 : -r * 1.18);
  ctx.lineTo(-r * 0.16, -r * 0.78);
  ctx.lineTo(0, tall ? -r * 1.78 : -r * 1.55);
  ctx.lineTo(r * 0.16, -r * 0.78);
  ctx.lineTo(r * 0.36, tall ? -r * 1.35 : -r * 1.18);
  ctx.lineTo(r * 0.48, -r * 0.78);
  ctx.lineTo(r * 0.8, -r * 1.22);
  ctx.lineTo(r * 0.8, -r * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7f4ea';
  ctx.fillRect(-r * 0.8, -r * 0.58, r * 1.6, r * 0.12);
  ctx.fillStyle = '#1a1204';
  for (let i = -3; i <= 3; i += 1) fillDot(i * r * 0.2, -r * 0.52, r * 0.028, '#1a1204');
  fillDot(0, -r * 0.72, r * 0.07, '#38bdf8');
  fillDot(-r * 0.36, -r * 0.68, r * 0.05, '#ff2a55');
  fillDot(r * 0.36, -r * 0.68, r * 0.05, '#34d399');
  if (tall) {
    ctx.strokeStyle = '#fff4c2';
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.78);
    ctx.lineTo(0, -r * 1.98);
    ctx.moveTo(-r * 0.08, -r * 1.9);
    ctx.lineTo(r * 0.08, -r * 1.9);
    ctx.stroke();
  }
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
  if (kind === 'laurel') {
    ctx.strokeStyle = '#e6c15a';
    ctx.fillStyle = '#f0c14b';
    ctx.lineWidth = Math.max(1, r * 0.05);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * r * 0.28, -r * 0.95, r * 0.16, r * 0.4, side * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      for (let leaf = 0; leaf < 4; leaf += 1) {
        ctx.beginPath();
        ctx.ellipse(side * r * (0.16 + leaf * 0.07), -r * (1.22 - leaf * 0.14), r * 0.09, r * 0.15, side * (0.9 - leaf * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }
  if (kind === 'cap' || kind === 'propeller') {
    ctx.translate(0, -r * 0.34);
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
    if (kind === 'propeller') {
      ctx.strokeStyle = '#e8eef8';
      ctx.lineWidth = Math.max(1, r * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.15);
      ctx.lineTo(0, -r * 1.42);
      ctx.stroke();
      ctx.fillStyle = '#ff4d6a';
      ctx.beginPath();
      ctx.ellipse(0, -r * 1.48, r * 0.42, r * 0.1, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7ec8ff';
      ctx.beginPath();
      ctx.ellipse(0, -r * 1.48, r * 0.42, r * 0.1, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'beanie') {
    ctx.translate(0, -r * 0.08);
    ctx.fillStyle = '#6d28d9';
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, -r * 0.7);
    ctx.quadraticCurveTo(-r * 0.88, -r * 1.48, 0, -r * 1.58);
    ctx.quadraticCurveTo(r * 0.88, -r * 1.48, r * 0.78, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ddd6fe';
    ctx.beginPath();
    ctx.moveTo(-r * 0.82, -r * 0.78);
    ctx.quadraticCurveTo(0, -r * 0.52, r * 0.82, -r * 0.78);
    ctx.lineTo(r * 0.76, -r * 0.96);
    ctx.quadraticCurveTo(0, -r * 0.74, -r * 0.76, -r * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = Math.max(1, r * 0.045);
    ctx.beginPath();
    for (let i = -2; i <= 2; i += 1) {
      ctx.moveTo(i * r * 0.24, -r * 0.92);
      ctx.lineTo(i * r * 0.24, -r * 0.7);
    }
    ctx.stroke();
    fillDot(0, -r * 1.64, r * 0.16, '#f9a8d4');
  } else if (kind === 'tophat') {
    ctx.translate(0, -r * 0.22);
    ctx.fillStyle = '#12141c';
    ctx.fillRect(-r * 0.4, -r * 1.7, r * 0.8, r * 0.85);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.88, r * 0.9, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff2a55';
    ctx.fillRect(-r * 0.4, -r * 1.05, r * 0.8, r * 0.1);
  } else if (kind === 'crown') {
    ctx.translate(0, -r * 0.42);
    drawCrownShape(r, false);
  } else if (kind === 'imperial') {
    ctx.translate(0, -r * 0.42);
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.05, r * 0.55, r * 0.62, 0, Math.PI, 0, true);
    ctx.fill();
    drawCrownShape(r, true);
  } else if (kind === 'santa') {
    ctx.translate(0, -r * 0.54);
    ctx.fillStyle = '#d0122d';
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, -r * 0.55);
    ctx.quadraticCurveTo(-r * 0.1, -r * 1.15, r * 0.42, -r * 1.55);
    ctx.quadraticCurveTo(r * 0.05, -r * 0.85, r * 0.72, -r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-r * 0.8, -r * 0.68, r * 1.6, r * 0.18);
    fillDot(r * 0.46, -r * 1.52, r * 0.16, '#fff');
  } else if (kind === 'dogears') {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * r * 0.58, -r * 1.38);
      ctx.rotate(side * 0.72);
      ctx.fillStyle = '#a56a3a';
      ctx.beginPath();
      ctx.moveTo(-r * 0.22, r * 0.34);
      ctx.quadraticCurveTo(-r * 0.46, -r * 0.05, -r * 0.16, -r * 0.46);
      ctx.quadraticCurveTo(r * 0.22, -r * 0.58, r * 0.4, -r * 0.08);
      ctx.quadraticCurveTo(r * 0.42, r * 0.32, r * 0.06, r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e56b93';
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, -r * 0.22);
      ctx.lineTo(r * 0.12, -r * 0.08);
      ctx.lineTo(-r * 0.02, r * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (kind === 'catears') {
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#2a241c';
      ctx.beginPath();
      ctx.moveTo(side * r * 0.22, -r * 1.12);
      ctx.lineTo(side * r * 0.4, -r * 1.98);
      ctx.lineTo(side * r * 0.7, -r * 1.05);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f3b6b0';
      ctx.beginPath();
      ctx.moveTo(side * r * 0.32, -r * 1.16);
      ctx.lineTo(side * r * 0.42, -r * 1.62);
      ctx.lineTo(side * r * 0.58, -r * 1.12);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === 'bunny') {
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#f4efe8';
      ctx.beginPath();
      ctx.ellipse(side * r * 0.48, -r * 1.35, r * 0.16, r * 0.48, side * -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f7c1d4';
      ctx.beginPath();
      ctx.ellipse(side * r * 0.46, -r * 1.32, r * 0.07, r * 0.28, side * -0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'pirate') {
    ctx.translate(0, -r * 0.22);
    ctx.fillStyle = '#141820';
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.62);
    ctx.quadraticCurveTo(-r * 0.72, -r * 1.22, -r * 1.2, -r * 0.88);
    ctx.quadraticCurveTo(-r * 0.55, -r * 0.62, 0, -r * 0.86);
    ctx.quadraticCurveTo(r * 0.55, -r * 0.62, r * 1.2, -r * 0.88);
    ctx.quadraticCurveTo(r * 0.72, -r * 1.22, 0, -r * 1.62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e6c15a';
    ctx.lineWidth = Math.max(1.4, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, -r * 0.92);
    ctx.quadraticCurveTo(-r * 0.42, -r * 0.7, 0, -r * 0.88);
    ctx.quadraticCurveTo(r * 0.42, -r * 0.7, r * 0.95, -r * 0.92);
    ctx.stroke();
    fillDot(0, -r * 1.16, r * 0.16, '#f8fafc');
    fillDot(-r * 0.055, -r * 1.18, r * 0.035, '#141820');
    fillDot(r * 0.055, -r * 1.18, r * 0.035, '#141820');
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = Math.max(1.2, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(-r * 0.14, -r * 0.98);
    ctx.lineTo(r * 0.14, -r * 1.06);
    ctx.moveTo(r * 0.14, -r * 0.98);
    ctx.lineTo(-r * 0.14, -r * 1.06);
    ctx.stroke();
  } else if (kind === 'astro') {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1.5, r * 0.055);
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-r * 0.98, r * 0.24);
    ctx.quadraticCurveTo(-r * 1.12, -r * 0.55, -r * 0.68, -r * 1.38);
    ctx.quadraticCurveTo(0, -r * 1.78, r * 0.68, -r * 1.38);
    ctx.quadraticCurveTo(r * 1.12, -r * 0.55, r * 0.98, r * 0.24);
    ctx.closePath();
    ctx.roundRect(-r * 0.58, -r * 0.5, r * 1.16, r * 0.58, r * 0.16);
    ctx.fill('evenodd');
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 120, 190, 0.22)';
    ctx.beginPath();
    ctx.roundRect(-r * 0.58, -r * 0.5, r * 1.16, r * 0.58, r * 0.16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(1.2, r * 0.045);
    ctx.beginPath();
    ctx.moveTo(-r * 0.36, -r * 0.32);
    ctx.quadraticCurveTo(-r * 0.05, -r * 0.46, r * 0.16, -r * 0.26);
    ctx.stroke();
    ctx.fillStyle = '#7dd3fc';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = Math.max(1.5, r * 0.055);
    ctx.beginPath();
    ctx.roundRect(-r * 1.02, r * 0.16, r * 2.04, r * 0.16, r * 0.06);
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'party') {
    ctx.translate(0, -r * 0.4);
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.5);
    ctx.lineTo(0, -r * 1.65);
    ctx.lineTo(r * 0.55, -r * 0.5);
    ctx.closePath();
    ctx.fill();
    fillDot(-r * 0.12, -r * 0.9, r * 0.06, '#fde68a');
    fillDot(r * 0.12, -r * 1.15, r * 0.05, '#fb7185');
    fillDot(0, -r * 1.65, r * 0.1, '#fde68a');
  } else if (kind === 'cowboy') {
    ctx.translate(0, -r * 0.36);
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.72, r * 1.05, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-r * 0.32, -r * 1.45, r * 0.64, r * 0.78);
    ctx.fillStyle = '#5c3b16';
    ctx.fillRect(-r * 0.32, -r * 0.95, r * 0.64, r * 0.1);
  } else if (kind === 'wizard') {
    ctx.translate(0, -r * 0.4);
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.55);
    ctx.lineTo(r * 0.08, -r * 1.7);
    ctx.lineTo(r * 0.7, -r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.85, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    drawStar(-r * 0.08, -r * 1.05, r * 0.1, r * 0.04, 5);
    ctx.fill();
  } else if (kind === 'beret') {
    ctx.translate(0, -r * 0.24);
    ctx.fillStyle = '#9f1239';
    ctx.beginPath();
    ctx.ellipse(r * 0.08, -r * 0.95, r * 0.78, r * 0.32, -0.3, 0, Math.PI * 2);
    ctx.fill();
    fillDot(r * 0.55, -r * 1.05, r * 0.08, '#1a1204');
  } else if (kind === 'halo') {
    ctx.strokeStyle = '#f6e27a';
    ctx.lineWidth = Math.max(1.4, r * 0.08);
    ctx.beginPath();
    ctx.ellipse(0, -r * 1.45, r * 0.55, r * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'viking') {
    ctx.translate(0, -r * 0.16);
    for (const side of [-1, 1]) {
      const horn = ctx.createLinearGradient(side * r * 0.4, -r * 0.7, side * r * 1.35, -r * 1.7);
      horn.addColorStop(0, '#b7aa96');
      horn.addColorStop(0.55, '#efe6d4');
      horn.addColorStop(1, '#f6f1e6');
      ctx.fillStyle = horn;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.5, -r * 0.84);
      ctx.quadraticCurveTo(side * r * 1.48, -r * 0.42, side * r * 1.28, -r * 1.78);
      ctx.quadraticCurveTo(side * r * 0.82, -r * 1.02, side * r * 0.42, -r * 1.06);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(110, 96, 74, 0.32)';
      ctx.lineWidth = Math.max(0.7, r * 0.026);
      ctx.beginPath();
      ctx.moveTo(side * r * 0.62, -r * 0.96);
      ctx.quadraticCurveTo(side * r * 1.15, -r * 0.7, side * r * 1.12, -r * 1.28);
      ctx.moveTo(side * r * 0.58, -r * 0.9);
      ctx.quadraticCurveTo(side * r * 1.02, -r * 0.78, side * r * 1.02, -r * 1.22);
      ctx.stroke();
    }
    ctx.fillStyle = '#9aa3ad';
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = Math.max(1.3, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, -r * 0.7);
    ctx.quadraticCurveTo(-r * 0.86, -r * 1.52, 0, -r * 1.66);
    ctx.quadraticCurveTo(r * 0.86, -r * 1.52, r * 0.78, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(-r * 0.1, -r * 1.5, r * 0.2, r * 0.95);
    ctx.fillRect(-r * 0.8, -r * 0.82, r * 1.6, r * 0.14);
    for (const y of [-1.32, -1.08, -0.84]) fillDot(0, r * y, r * 0.035, '#e5e7eb');
    for (const x of [-0.52, -0.26, 0.26, 0.52]) fillDot(r * x, -r * 0.75, r * 0.03, '#e5e7eb');
  } else if (kind === 'chef') {
    ctx.translate(0, -r * 0.3);
    ctx.fillStyle = '#f8fafc';
    fillDot(-r * 0.28, -r * 1.05, r * 0.28, '#f8fafc');
    fillDot(r * 0.28, -r * 1.05, r * 0.28, '#f8fafc');
    fillDot(0, -r * 1.28, r * 0.32, '#f8fafc');
    ctx.fillRect(-r * 0.42, -r * 0.85, r * 0.84, r * 0.28);
  } else if (kind === 'flower') {
    ctx.translate(0, -r * 0.2);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = Math.max(1.2, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(-r * 0.22, -r * 0.98);
    ctx.quadraticCurveTo(0, -r * 1.08, r * 0.22, -r * 0.98);
    ctx.stroke();
    const petals = ['#fb7185', '#fbbf24', '#f472b6', '#38bdf8', '#a3e635'];
    petals.forEach((color, index) => {
      const angle = -Math.PI / 2 + index * 0.55 - 1.1;
      fillDot(Math.cos(angle) * r * 0.28, -r * 1.15 + Math.sin(angle) * r * 0.16, r * 0.12, color);
    });
    fillDot(0, -r * 1.15, r * 0.08, '#fde68a');
  } else if (kind === 'horns') {
    const hornOutline = (side) => {
      const steps = 16;
      const spine = (t) => {
        const x = side * r * (0.34 + Math.sin(t * Math.PI * 0.82) * 0.62);
        const y = -r * (1.02 + t * 1.18);
        return [x, y];
      };
      const points = Array.from({ length: steps + 1 }, (_, index) => spine(index / steps));
      const edge = (index, sign) => {
        const t = index / steps;
        const current = points[index];
        const next = points[Math.min(steps, index + 1)];
        const prev = points[Math.max(0, index - 1)];
        let dx = next[0] - prev[0];
        let dy = next[1] - prev[1];
        const length = Math.hypot(dx, dy) || 1;
        dx /= length;
        dy /= length;
        const width = r * (0.2 * (1 - t) * (1 - t) + 0.012);
        return [current[0] + -dy * width * sign, current[1] + dx * width * sign];
      };
      ctx.beginPath();
      for (let index = 0; index <= steps; index += 1) {
        const [x, y] = edge(index, 1);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let index = steps; index >= 0; index -= 1) {
        const [x, y] = edge(index, -1);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
    };
    for (const side of [-1, 1]) {
      const grad = ctx.createLinearGradient(side * r * 0.2, -r * 0.95, side * r * 0.7, -r * 2.15);
      grad.addColorStop(0, '#3f0614');
      grad.addColorStop(0.45, '#dc2626');
      grad.addColorStop(1, '#fda4af');
      hornOutline(side);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.save();
      hornOutline(side);
      ctx.clip();
      ctx.strokeStyle = 'rgba(60, 8, 12, 0.38)';
      ctx.lineWidth = Math.max(0.7, r * 0.028);
      ctx.beginPath();
      for (const offset of [0.08, 0.16]) {
        ctx.moveTo(side * r * (0.34 + offset), -r * 1.08);
        ctx.bezierCurveTo(
          side * r * (0.7 + offset), -r * 1.25,
          side * r * (0.85 + offset * 0.4), -r * 1.7,
          side * r * (0.55 + offset * 0.2), -r * 2.05,
        );
      }
      ctx.stroke();
      ctx.restore();
    }
  } else if (kind === 'sombrero') {
    ctx.translate(0, -r * 0.16);
    ctx.fillStyle = '#e7c27a';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.9, r * 1.28, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * 0.96);
    ctx.quadraticCurveTo(-r * 0.18, -r * 1.58, 0, -r * 1.82);
    ctx.quadraticCurveTo(r * 0.18, -r * 1.58, r * 0.42, -r * 0.96);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(-r * 0.32, -r * 1.16);
    ctx.lineTo(r * 0.32, -r * 1.16);
    ctx.lineTo(r * 0.28, -r * 1.28);
    ctx.lineTo(-r * 0.28, -r * 1.28);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'headphones') {
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = Math.max(1.6, r * 0.1);
    ctx.beginPath();
    ctx.arc(0, -r * 0.2, r * 0.85, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.fillStyle = '#111827';
    ctx.fillRect(-r * 0.95, -r * 0.35, r * 0.22, r * 0.42);
    ctx.fillRect(r * 0.73, -r * 0.35, r * 0.22, r * 0.42);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-r * 0.9, -r * 0.28, r * 0.12, r * 0.28);
    ctx.fillRect(r * 0.78, -r * 0.28, r * 0.12, r * 0.28);
  } else if (kind === 'banana') {
    ctx.translate(0, -r * 0.58);
    ctx.fillStyle = '#f5d90a';
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 0.4);
    ctx.quadraticCurveTo(r * 0.85, -r * 0.2, r * 0.35, -r * 1.55);
    ctx.quadraticCurveTo(r * 0.15, -r * 0.7, -r * 0.35, -r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(r * 0.28, -r * 1.62, r * 0.1, r * 0.16);
  } else if (kind === 'bag') {
    const top = -r * 1.48;
    const bot = r * 0.42;
    ctx.fillStyle = '#c9a36b';
    ctx.beginPath();
    ctx.moveTo(-r * 1.12, bot);
    ctx.lineTo(-r * 1.08, top);
    ctx.lineTo(r * 1.08, top);
    ctx.lineTo(r * 1.12, bot);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a8845a';
    ctx.fillRect(-r * 1.14, top - r * 0.02, r * 2.28, r * 0.26);
    ctx.strokeStyle = 'rgba(80, 52, 24, 0.4)';
    ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.beginPath();
    ctx.moveTo(0, top + r * 0.24);
    ctx.lineTo(0, bot - r * 0.02);
    ctx.stroke();
    ctx.fillStyle = '#1a1204';
    ctx.beginPath();
    ctx.ellipse(-r * 0.32, -r * 0.22, r * 0.16, r * 0.2, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.32, -r * 0.22, r * 0.16, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const SHADE_LENS = {
  shades: 'rgba(8, 10, 18, 0.92)',
  'shade-red': 'rgba(190, 18, 40, 0.9)',
  'shade-blue': 'rgba(20, 90, 210, 0.9)',
  'shade-gold': 'rgba(212, 160, 23, 0.9)',
  'shade-green': 'rgba(22, 140, 70, 0.9)',
  'shade-pink': 'rgba(230, 70, 140, 0.9)',
  'shade-violet': 'rgba(110, 50, 200, 0.9)',
  'shade-white': 'rgba(236, 242, 250, 0.88)',
  'shade-amber': 'rgba(230, 120, 20, 0.9)',
};

function drawShades(r, eyeY, lens) {
  ctx.fillStyle = lens;
  roundBox(-r * 0.62, eyeY - r * 0.22, r * 0.52, r * 0.4, r * 0.08);
  roundBox(r * 0.08, eyeY - r * 0.22, r * 0.52, r * 0.4, r * 0.08);
  ctx.fillStyle = '#111';
  ctx.fillRect(-r * 0.1, eyeY - r * 0.04, r * 0.2, r * 0.08);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.46, eyeY - r * 0.08, r * 0.08, r * 0.05, -0.4, 0, Math.PI * 2);
  ctx.fill();
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
  const eyeY = -r * 0.68;
  ctx.save();
  if (kind === 'rounds' || kind === 'nerd') {
    ctx.strokeStyle = kind === 'nerd' ? '#111827' : '#f4efe2';
    ctx.lineWidth = Math.max(1.4, r * (kind === 'nerd' ? 0.12 : 0.08));
    const box = kind === 'nerd';
    if (box) {
      ctx.strokeRect(-r * 0.62, eyeY - r * 0.24, r * 0.5, r * 0.42);
      ctx.strokeRect(r * 0.1, eyeY - r * 0.24, r * 0.5, r * 0.42);
    } else {
      ctx.beginPath();
      ctx.arc(-r * 0.32, eyeY, r * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.3, eyeY, r * 0.28, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, eyeY);
    ctx.lineTo(r * 0.08, eyeY);
    ctx.moveTo(box ? -r * 0.62 : -r * 0.58, eyeY);
    ctx.lineTo(-r * 0.86, eyeY - r * 0.04);
    ctx.moveTo(box ? r * 0.6 : r * 0.56, eyeY);
    ctx.lineTo(r * 0.86, eyeY - r * 0.04);
    ctx.stroke();
  } else if (SHADE_LENS[kind]) {
    drawShades(r, eyeY, SHADE_LENS[kind]);
  } else if (kind === 'visor') {
    ctx.fillStyle = 'rgba(0, 240, 255, 0.38)';
    ctx.strokeStyle = '#d8fbff';
    ctx.lineWidth = 1.3;
    roundBox(-r * 0.78, eyeY - r * 0.2, r * 1.56, r * 0.38, r * 0.12);
    ctx.stroke();
  } else if (kind === 'patch') {
    ctx.fillStyle = '#1a1208';
    ctx.beginPath();
    ctx.ellipse(-r * 0.32, eyeY, r * 0.4, r * 0.32, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6234';
    ctx.lineWidth = Math.max(1.4, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, eyeY - r * 0.12);
    ctx.lineTo(-r * 0.95, -r * 0.85);
    ctx.moveTo(0, eyeY);
    ctx.quadraticCurveTo(r * 0.45, -r * 0.35, r * 0.9, -r * 0.72);
    ctx.stroke();
  } else if (kind === 'monocle') {
    ctx.strokeStyle = '#e7c27a';
    ctx.lineWidth = Math.max(1.3, r * 0.07);
    ctx.beginPath();
    ctx.arc(r * 0.3, eyeY, r * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.48, eyeY + r * 0.2);
    ctx.quadraticCurveTo(r * 0.7, r * 0.35, r * 0.4, r * 0.55);
    ctx.stroke();
  } else if (kind === 'stereo') {
    ctx.fillStyle = 'rgba(220, 38, 38, 0.75)';
    roundBox(-r * 0.62, eyeY - r * 0.2, r * 0.48, r * 0.38, r * 0.06);
    ctx.fillStyle = 'rgba(14, 165, 233, 0.75)';
    roundBox(r * 0.12, eyeY - r * 0.2, r * 0.48, r * 0.38, r * 0.06);
  } else if (kind === 'hearts') {
    ctx.fillStyle = '#fb7185';
    for (const x of [-r * 0.32, r * 0.28]) {
      fillDot(x - r * 0.08, eyeY - r * 0.04, r * 0.1, '#fb7185');
      fillDot(x + r * 0.08, eyeY - r * 0.04, r * 0.1, '#fb7185');
      ctx.beginPath();
      ctx.moveTo(x - r * 0.18, eyeY);
      ctx.lineTo(x, eyeY + r * 0.2);
      ctx.lineTo(x + r * 0.18, eyeY);
      ctx.fill();
    }
  } else if (kind === 'stars') {
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#fde68a';
    drawStar(-r * 0.32, eyeY, r * 0.22, r * 0.09, 5);
    ctx.fill();
    drawStar(r * 0.3, eyeY, r * 0.22, r * 0.09, 5);
    ctx.fill();
  } else if (kind === 'goggles') {
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = Math.max(1.4, r * 0.08);
    ctx.beginPath();
    ctx.arc(0, -r * 0.55, r * 0.7, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.fillStyle = 'rgba(251, 146, 60, 0.8)';
    ctx.beginPath();
    ctx.arc(-r * 0.32, eyeY, r * 0.24, 0, Math.PI * 2);
    ctx.arc(r * 0.3, eyeY, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fafaf9';
    ctx.stroke();
  } else if (kind === 'aviator') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#e7c27a';
    ctx.lineWidth = Math.max(1, r * 0.05);
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sign * r * 0.08, eyeY - r * 0.16);
      ctx.lineTo(sign * r * 0.62, eyeY - r * 0.12);
      ctx.quadraticCurveTo(sign * r * 0.7, eyeY + r * 0.28, sign * r * 0.28, eyeY + r * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-r * 0.08, eyeY - r * 0.08);
    ctx.lineTo(r * 0.08, eyeY - r * 0.08);
    ctx.stroke();
  } else if (kind === 'mustache') {
    ctx.fillStyle = '#3a2414';
    ctx.beginPath();
    ctx.ellipse(-r * 0.22, eyeY + r * 0.4, r * 0.28, r * 0.12, -0.35, 0, Math.PI * 2);
    ctx.ellipse(r * 0.22, eyeY + r * 0.4, r * 0.28, r * 0.12, 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function roundBox(x, y, width, height, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, width, height, radius);
  else ctx.rect(x, y, width, height);
  ctx.fill();
}

function drawSpirit(x, y, options) {
  const radius = options.radius ?? 17;
  const color = options.color ?? '#00f0ff';
  const alpha = options.alpha ?? 1;
  const phase = options.phase ?? 0;
  const hollow = options.hollow ?? false;
  const aura = options.aura !== false;
  ctx.save();
  ctx.globalAlpha = alpha;
  placeFlight(x, y, radius, options.heading);

  if (aura) {
    const haze = ctx.createRadialGradient(-radius * 0.5, 0, radius * 0.15, -radius * 0.7, 0, radius * 1.25);
    haze.addColorStop(0, hexAlpha(color, hollow ? 0.14 : 0.2));
    haze.addColorStop(1, hexAlpha(color, 0));
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.ellipse(-radius * 0.65, 0, radius * 1.15, radius * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const flag = options.flagId ? flagById(options.flagId) : null;
  paintRunner(radius, phase, {
    hollow,
    cloth: color,
    skin: '#f0d2b0',
    shade: color,
    flag,
    wind: options.wind ?? 1,
  });

  // Hats sit on the back-of-head from the top-down view.
  if (options.hat && options.hat !== 'none') {
    ctx.save();
    ctx.translate(HEAD_X * radius, HEAD_LINE * radius);
    ctx.scale(0.62, 0.62);
    if (hollow) ctx.globalAlpha *= 0.72;
    drawHat(options.hat, radius, color);
    ctx.restore();
  }
  // Glasses read as a thin band across the back of the head.
  if (options.glasses && options.glasses !== 'none') {
    ctx.save();
    ctx.translate(HEAD_X * radius + radius * 0.06, HEAD_LINE * radius);
    ctx.scale(0.5, 0.55);
    if (hollow) ctx.globalAlpha *= 0.72;
    drawGlasses(options.glasses, radius);
    ctx.restore();
  }

  ctx.restore();
}

const echoFace = new WeakMap();

function pathHeading(echo, clock) {
  const here = ghostPoint(echo, clock);
  // Longer look-ahead damps twitchy turns; reject wrap jumps.
  const next = ghostPoint(echo, clock + 2.2);
  if (!here || !next) return null;
  const dx = next.x - here.x;
  const dy = next.y - here.y;
  const span = dx * dx + dy * dy;
  if (span < 1 || span > 28 * 28) return null;
  return Math.atan2(dy, dx);
}

function faceAlong(echo, clock) {
  const heading = pathHeading(echo, clock);
  if (heading == null) return echoFace.get(echo) ?? 0;
  const prev = echoFace.get(echo);
  if (prev == null) {
    echoFace.set(echo, heading);
    return heading;
  }
  // Blend heading so the cape does not snap on every path kink.
  let delta = heading - prev;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const blended = prev + delta * 0.22;
  echoFace.set(echo, blended);
  return blended;
}

function drawAfterimages(echo, clock, color, hollow) {
  const count = hollow ? 4 : 6;
  for (let step = count; step >= 1; step -= 1) {
    const at = clock - step * 2;
    const point = ghostPoint(echo, at);
    if (!point) continue;
    const fade = 1 - step / (count + 1);
    drawSpirit(point.x, point.y, {
      color,
      flagId: ghostFlag,
      radius: hollow ? 10 + fade * 4 : 9 + fade * 5,
      alpha: fade * (hollow ? 0.22 : 0.28),
      phase: performance.now() / 220 - step,
      heading: pathHeading(echo, at) ?? faceAlong(echo, clock),
      hollow,
      aura: false,
    });
  }
}

function drawEchoes() {
  echoes.forEach((echo, index) => {
    if (!echo.length) return;
    const clock = ghostFrame();
    const guide = echoGuideRibbon(echo, clock);
    if (guide.length >= 2) {
      const alpha = 0.5 + ((index + 1) / echoes.length) * 0.45;
      drawLitRibbon(guide, echoRouteTint(index), 2.6, Math.min(1, alpha));
    }
  });

  echoes.forEach((echo, index) => {
    if (!echo.length) return;
    const clock = ghostFrame();
    const ghost = ghostPoint(echo, clock);
    if (!ghost) return;
    const heading = faceAlong(echo, clock);
    const newest = index === echoes.length - 1;
    const near = proximity(ghost.x, ghost.y);
    const cape = wornEchoColor();
    drawAfterimages(echo, clock, cape, true);
    drawSpirit(ghost.x, ghost.y, {
      color: cape,
      flagId: ghostFlag,
      radius: 17,
      alpha: Math.min(1, (newest ? 0.98 : 0.92) + near * 0.06),
      phase: performance.now() / 190 + index * 1.3,
      heading,
      hollow: true,
    });
  });
}

function coinById(kind) {
  return COINS.find((coin) => coin.id === kind) ?? COINS[0];
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

function drawBitcoinMark(radius) {
  if (!bitcoinImage.complete || !bitcoinImage.naturalWidth) return;
  const height = radius * 1.2;
  const width = height * (bitcoinImage.naturalWidth / bitcoinImage.naturalHeight);
  ctx.drawImage(bitcoinImage, -width / 2, -height / 2, width, height);
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
  const r = radius * 0.84;
  ctx.fillStyle = '#0d0d0d';
  ctx.beginPath();
  ctx.moveTo(-r * 0.32, -r * 0.54);
  ctx.lineTo(-r * 0.32, r * 0.54);
  ctx.lineTo(-r * 0.02, r * 0.54);
  ctx.arc(-r * 0.02, 0, r * 0.54, Math.PI / 2, -Math.PI / 2, true);
  ctx.closePath();
  ctx.moveTo(-r * 0.12, -r * 0.3);
  ctx.lineTo(-r * 0.12, r * 0.3);
  ctx.arc(-r * 0.02, 0, r * 0.3, Math.PI / 2, -Math.PI / 2, true);
  ctx.closePath();
  ctx.fill('evenodd');
  ctx.fillRect(-r * 0.45, -r * 0.058, r * 0.56, r * 0.116);
}

function fillMark(points, scale) {
  ctx.beginPath();
  ctx.moveTo(points[0][0] * scale, points[0][1] * scale);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x * scale, y * scale));
  ctx.closePath();
  ctx.fill();
}

function drawBnbMark(radius) {
  const scale = radius * 0.58;
  ctx.fillStyle = '#0d0d0d';
  fillMark([
    [0, -1],
    [0.62, -0.38],
    [0.4, -0.16],
    [0.18, -0.38],
    [0, -0.56],
    [-0.18, -0.38],
    [-0.4, -0.16],
    [-0.62, -0.38],
  ], scale);
  fillMark([
    [0, 1],
    [-0.62, 0.38],
    [-0.4, 0.16],
    [-0.18, 0.38],
    [0, 0.56],
    [0.18, 0.38],
    [0.4, 0.16],
    [0.62, 0.38],
  ], scale);
  [[-0.78, 0, 0.2], [0, 0, 0.18], [0.78, 0, 0.2]].forEach(([x, y, arm]) => {
    fillMark([[x, y - arm], [x + arm, y], [x, y + arm], [x - arm, y]], scale);
  });
}

function drawCryptoMark(kind, radius) {
  if (kind === 'gold') {
    drawStar(0, 0, radius * 0.32, radius * 0.14, 5);
    ctx.fillStyle = '#fff6d4';
    ctx.fill();
    return;
  }
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

  ctx.globalAlpha = 0.92;
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
  const style = equippedPlayerStyle();
  const body = playerBodyHit();
  if (classicFire(style)) {
    drawGlow(body.x, body.y, 230, '255, 150, 60', 0.62);
    drawGlow(body.x, body.y, 70, '255, 230, 180', 0.5);
    return;
  }
  drawGlow(body.x, body.y, 230, rgbCss(style.body || style.trail[1]), 0.62);
  drawGlow(body.x, body.y, 70, rgbCss(style.body || style.trail[0]), 0.5);
}

function traceGem(cut, radius) {
  const r = radius;
  ctx.beginPath();
  if (cut === 'emerald') {
    const w = r * 0.78;
    const h = r * 0.92;
    const c = r * 0.22;
    ctx.moveTo(-w + c, -h);
    ctx.lineTo(w - c, -h);
    ctx.lineTo(w, -h + c);
    ctx.lineTo(w, h - c * 0.7);
    ctx.lineTo(w - c, h);
    ctx.lineTo(-w + c, h);
    ctx.lineTo(-w, h - c * 0.7);
    ctx.lineTo(-w, -h + c);
    ctx.closePath();
    return;
  }
  if (cut === 'oval') {
    ctx.ellipse(0, r * 0.04, r * 0.62, r * 0.9, 0, 0, Math.PI * 2);
    return;
  }
  ctx.moveTo(-r * 0.32, -r * 0.72);
  ctx.lineTo(r * 0.32, -r * 0.72);
  ctx.lineTo(r * 0.82, -r * 0.12);
  ctx.lineTo(r * 0.58, r * 0.12);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.58, r * 0.12);
  ctx.lineTo(-r * 0.82, -r * 0.12);
  ctx.closePath();
}

function drawGem(x, y, radius, colors, cut = 'brilliant') {
  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius * 1.8);
  glow.addColorStop(0, colors[1]);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  traceGem(cut, radius);
  const face = ctx.createLinearGradient(-radius, -radius, radius, radius);
  face.addColorStop(0, colors[0]);
  face.addColorStop(0.45, colors[1]);
  face.addColorStop(1, colors[2]);
  ctx.fillStyle = face;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.beginPath();
  if (cut === 'emerald') {
    ctx.moveTo(-radius * 0.42, -radius * 0.55);
    ctx.lineTo(radius * 0.42, -radius * 0.55);
    ctx.lineTo(radius * 0.5, radius * 0.55);
    ctx.lineTo(-radius * 0.5, radius * 0.55);
    ctx.closePath();
  } else if (cut === 'oval') {
    ctx.ellipse(0, -radius * 0.08, radius * 0.28, radius * 0.22, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(-radius * 0.32, -radius * 0.72);
    ctx.lineTo(0, -radius * 0.28);
    ctx.lineTo(radius * 0.32, -radius * 0.72);
    ctx.moveTo(-radius * 0.82, -radius * 0.12);
    ctx.lineTo(radius * 0.82, -radius * 0.12);
    ctx.moveTo(0, -radius * 0.28);
    ctx.lineTo(0, radius);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBenjamin(x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  const w = radius * 2.25;
  const h = radius * 1.2;
  ctx.fillStyle = 'rgba(80, 180, 90, 0.2)';
  ctx.fillRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6);
  ctx.fillStyle = '#1c7a43';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = '#d7f5df';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
  ctx.fillStyle = '#b7e7c4';
  ctx.beginPath();
  ctx.ellipse(-w * 0.22, 0, radius * 0.28, radius * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#145c32';
  ctx.beginPath();
  ctx.arc(-w * 0.22, -radius * 0.08, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-w * 0.3, radius * 0.08, radius * 0.16, radius * 0.16);
  ctx.fillStyle = '#e9fff0';
  ctx.font = `700 ${Math.max(8, radius * 0.42)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('100', w * 0.22, 0);
  ctx.restore();
}

function drawHoloCoin(x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  const hue = (performance.now() / 18) % 360;
  const face = ctx.createLinearGradient(-radius, -radius, radius, radius);
  face.addColorStop(0, `hsl(${hue} 90% 72%)`);
  face.addColorStop(0.5, `hsl(${(hue + 80) % 360} 85% 62%)`);
  face.addColorStop(1, `hsl(${(hue + 180) % 360} 90% 70%)`);
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `700 ${Math.max(8, radius * 0.55)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', 0, 1);
  ctx.restore();
}

function drawPixelCoin(x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  const cell = radius * 0.28;
  const pixels = [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ];
  ctx.fillStyle = '#f0c14b';
  pixels.forEach((row, iy) => {
    row.forEach((on, ix) => {
      if (!on) return;
      ctx.fillRect((ix - 2) * cell, (iy - 2) * cell, cell - 1, cell - 1);
    });
  });
  ctx.fillStyle = '#fff4c4';
  ctx.fillRect(-cell, -cell, cell - 1, cell - 1);
  ctx.restore();
}

function drawNova(x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255, 220, 120, 0.28)';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();
  drawStar(0, 0, radius, radius * 0.42, 4);
  ctx.fillStyle = '#fff8dc';
  ctx.fill();
  ctx.fillStyle = '#ffb000';
  drawStar(0, 0, radius * 0.45, radius * 0.16, 4);
  ctx.fill();
  ctx.restore();
}

function drawCoinPack(id, x, y, radius) {
  if (id === 'crypto' || COINS.some((coin) => coin.id === id)) {
    drawCryptoCoin(x, y, radius, COINS.some((coin) => coin.id === id) ? id : 'btc');
    return;
  }
  if (id === 'benjamin') {
    drawBenjamin(x, y, radius);
    return;
  }
  if (id === 'diamond') {
    drawGem(x, y, radius, ['#f4fbff', '#9fd7ff', '#3d7edb'], 'brilliant');
    return;
  }
  if (id === 'ruby') {
    drawGem(x, y, radius, ['#ffd0d8', '#e11d48', '#7f1028'], 'oval');
    return;
  }
  if (id === 'emerald') {
    drawGem(x, y, radius, ['#d9ffe8', '#1fbf6a', '#0c6b3c'], 'emerald');
    return;
  }
  if (id === 'holo') {
    drawHoloCoin(x, y, radius);
    return;
  }
  if (id === 'pixel') {
    drawPixelCoin(x, y, radius);
    return;
  }
  if (id === 'nova') {
    drawNova(x, y, radius);
    return;
  }
  drawCryptoCoin(x, y, radius, 'gold');
}

function makeCoinThumb(id) {
  const thumb = document.createElement('canvas');
  thumb.className = 'thumb';
  thumb.width = 112;
  thumb.height = 80;
  const g = thumb.getContext('2d');
  g.setTransform(2, 0, 0, 2, 0, 0);
  paintOn(g, () => {
    drawCoinPack(id, 28, 22, 16);
  });
  return thumb;
}

function drawPickups() {
  collectibles.forEach((coin) => {
    const look = coinPack === 'crypto' ? coinById(coin.kind).id : coinPack;
    drawCoinPack(look, coin.x, coin.y, coin.radius);
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
  const bob = Math.sin(performance.now() / 260) * 2.2;
  const pulse = 0.42 + Math.sin(performance.now() / 180) * 0.12;
  ctx.save();
  ctx.translate(x, y + bob);
  const glow = ctx.createRadialGradient(0, 4, 6, 0, 4, 54);
  glow.addColorStop(0, `rgba(255, 210, 80, ${pulse})`);
  glow.addColorStop(0.45, 'rgba(255, 170, 40, 0.22)');
  glow.addColorStop(1, 'rgba(255, 170, 40, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 4, 54, 0, Math.PI * 2);
  ctx.fill();
  if (sackImage.complete && sackImage.naturalWidth) {
    const size = 84;
    ctx.rotate(-0.08);
    ctx.drawImage(sackImage, -size / 2, -size / 2, size, size);
  }
  ctx.restore();
}

function drawCoinFlashes() {
  for (const flash of coinFlashes) {
    const t = 1 - flash.life / 18;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 214, 90, ${0.85 * (1 - t)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, 6 + t * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawRecordFlash() {
  if (recordFlash <= 0) return;
  const t = recordFlash / 50;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 220, 120, ${t})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 18 + (1 - t) * 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 236, 170, ${t * 0.18})`;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 18 + (1 - t) * 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

let playerFace = 0;

function fireHeading() {
  if (currentPath.length) {
    const last = currentPath[currentPath.length - 1];
    const liveDx = player.x - last.x;
    const liveDy = player.y - last.y;
    if (liveDx * liveDx + liveDy * liveDy >= 0.64) {
      playerFace = Math.atan2(liveDy, liveDx);
      return playerFace;
    }
  }
  if (currentPath.length >= 2) {
    const tip = currentPath[currentPath.length - 1];
    let i = currentPath.length - 2;
    let dist = Math.hypot(tip.x - currentPath[i].x, tip.y - currentPath[i].y);
    while (i > 0 && dist < 16) {
      i -= 1;
      dist += Math.hypot(currentPath[i + 1].x - currentPath[i].x, currentPath[i + 1].y - currentPath[i].y);
    }
    const dx = tip.x - currentPath[i].x;
    const dy = tip.y - currentPath[i].y;
    if (dx * dx + dy * dy >= 2.25) {
      playerFace = Math.atan2(dy, dx);
      return playerFace;
    }
  }
  const speed = Math.hypot(player.vx, player.vy);
  if (speed >= 0.2) playerFace = Math.atan2(player.vy, player.vx);
  return playerFace;
}

function drawPlayer() {
  const phase = performance.now() / 90;
  const style = equippedPlayerStyle();
  const heading = fireHeading();
  const wind = Math.min(1.4, 0.45 + Math.hypot(player.vx, player.vy) * 0.18);
  // Grace still protects — no blink or loading ring.
  drawFireball(player.x, player.y, 20, phase, 1, heading, style, wind);

  if (shieldLayers.length === 0) return;
  const body = playerBodyHit();
  ctx.save();
  const spin = performance.now() / 260;
  ctx.lineWidth = 1.6;
  shieldLayers.forEach((layer, index) => {
    const radius = body.radius + 12 + index * 8;
    const start = spin + index * 0.7;
    ctx.strokeStyle = layer.kind === 'lasting' ? '#d8fbff' : '#7af6ff';
    ctx.globalAlpha = layer.kind === 'lasting' ? 0.95 : 0.72;
    ctx.beginPath();
    ctx.arc(body.x, body.y, radius, start, start + Math.PI * 1.45);
    ctx.stroke();
    for (let i = 0; i < 3; i += 1) {
      const angle = start + (i * Math.PI * 2) / 3;
      ctx.fillStyle = '#e8fdff';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(
        body.x + Math.cos(angle) * radius,
        body.y + Math.sin(angle) * (radius * 0.56),
        2.1,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawParticles() {
  for (const particle of particles) {
    const alpha = Math.max(0, particle.life / (particle.size ? 12 : 24));
    const haze = particle.size ?? 5;
    const core = particle.size ? particle.size * 0.65 : 1.8;
    ctx.save();
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, haze, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, core, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function bannerLines(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawBlasts() {
  for (const blast of blasts) {
    const t = 1 - blast.life / blast.max;
    const radius = 14 + t * 86;
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.95;
    ctx.strokeStyle = '#fff6d0';
    ctx.lineWidth = 4 + (1 - t) * 6;
    ctx.beginPath();
    ctx.arc(blast.x, blast.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = (1 - t) * 0.7;
    ctx.fillStyle = '#ff4d00';
    ctx.beginPath();
    ctx.arc(blast.x, blast.y, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = (1 - t) * 0.9;
    ctx.fillStyle = '#fff1c2';
    ctx.beginPath();
    ctx.arc(blast.x, blast.y, Math.max(6, radius * 0.24), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function lookColor(id, shift) {
  if (id === 'prism') return hslToHex((performance.now() / 18 + shift) % 360, 0.9, 0.62);
  if (id === 'shift') return hslToHex((performance.now() / 30 + shift) % 360, 0.72, 0.56);
  if (id === 'aurora') return hslToHex((150 + Math.sin(performance.now() / 380) * 50 + shift) % 360, 0.75, 0.55);
  if (!id || id === 'classic') return null;
  return id;
}

function trailPair(id) {
  if (!id || id === 'classic') return ['#fff6d0', '#ff4d00'];
  if (id === 'prism' || id === 'shift' || id === 'aurora') return [lookColor(id, 0), lookColor(id, 48)];
  return ['#fff6d0', id];
}

function playerStyle(bodyId, flagId) {
  const flag = flagById(flagId);
  if (flag) return { flag, trail: flagTrail(flag), body: null };
  const body = lookColor(bodyId, 0) || bodyId || COLORS[0].id;
  return {
    flag: null,
    trail: [body, body],
    body,
  };
}

function equippedPlayerStyle() {
  return playerStyle(playerBody, playerFlag);
}

function previewPlayerStyle() {
  const tryingLook = hoverTry?.slot === 'player' || pinnedTry.player;
  return playerStyle(
    previewChoice('player', playerBody),
    tryingLook ? '' : previewChoice('playerFlag', playerFlag),
  );
}

function classicFire(style) {
  return !style?.flag && !style?.body && style?.trail?.[0] === '#fff6d0' && style?.trail?.[1] === '#ff4d00';
}

function hexRgb(hex) {
  const raw = String(hex || '').replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return [255, 77, 0];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbaHex(hex, alpha) {
  const [red, green, blue] = hexRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function rgbCss(hex) {
  return hexRgb(hex).join(', ');
}

function classicPalette() {
  return {
    heat: ['rgba(255, 244, 210, 0.95)', 'rgba(255, 150, 30, 0.55)', 'rgba(255, 40, 0, 0.18)', 'rgba(90, 0, 0, 0)'],
    tongueHot: ['rgba(255, 250, 220, 0.98)', 'rgba(255, 110, 0, 0.9)'],
    tongueCool: ['rgba(255, 186, 48, 0.95)', 'rgba(255, 42, 0, 0.8)'],
    tongueEnd: 'rgba(120, 6, 0, 0)',
    body: ['#ffffff', '#fff4c4', '#ffb000', '#ff4a00', 'rgba(120, 10, 0, 0.2)'],
    core: 'rgba(255, 255, 245, 0.96)',
    sparkHot: '#fff8e4',
    sparkCool: '#ff5a14',
    flag: null,
    ribbon: [
      [2.2, 16, '255, 48, 0', 0.22],
      [1.1, 7, '255, 122, 16', 0.72],
      [0.4, 2.4, '255, 244, 210', 0.9],
    ],
  };
}

function firePalette(style) {
  const classic = classicPalette();
  if (!style || classicFire(style)) return classic;
  const hot = style.trail[0];
  const cool = style.trail[1];
  // Cape cloth: shop body color, else flag ink, else trail — never keep classic orange under a skin.
  const mid = style.body || (style.flag ? flagInk(style.flag) : cool);
  const ribbon = [
    [2.2, 16, rgbCss(cool), 0.22],
    [1.1, 7, rgbCss(mid), 0.72],
    [0.4, 2.4, rgbCss(hot), 0.9],
  ];
  return {
    heat: [rgbaHex(hot, 0.95), rgbaHex(mid, 0.55), rgbaHex(cool, 0.2), rgbaHex(cool, 0)],
    tongueHot: [rgbaHex(hot, 0.98), rgbaHex(mid, 0.9)],
    tongueCool: [rgbaHex(hot, 0.9), rgbaHex(cool, 0.8)],
    tongueEnd: rgbaHex(cool, 0),
    body: ['#ffffff', hot, mid, cool, rgbaHex(cool, 0.2)],
    core: rgbaHex(hot, 0.96),
    sparkHot: hot,
    sparkCool: cool,
    flag: style.flag || null,
    ribbon,
  };
}

function wornEchoColor() {
  const flag = flagById(ghostFlag);
  if (flag) return flagInk(flag);
  return lookColor(echoColor, 0) || echoColor || '#ff2a55';
}

/** Distinct route tint per echo index so overlapping guides stay readable. */
const ECHO_ROUTE_TINTS = ['#00f0ff', '#ff3dce', '#b6ff3b', '#ffbb00', '#b388ff', '#ff5a1f'];

function echoRouteTint(index) {
  return ECHO_ROUTE_TINTS[index % ECHO_ROUTE_TINTS.length];
}

/**
 * Short wake + lookahead along a sealed route — not the full scribble.
 * Stops at the loop reset so the teleport home never draws as a shortcut.
 */
function echoGuideRibbon(echo, clock, behindPx = 70, aheadPx = 230, stepPx = 10) {
  if (!echo?.length) return [];
  const points = [];
  let prev = null;
  for (let dist = -behindPx; dist <= aheadPx; dist += stepPx) {
    const at = clock + dist / GHOST_SPEED;
    const point = ghostPoint(echo, at);
    if (!point) continue;
    if (prev) {
      const jump = Math.hypot(point.x - prev.x, point.y - prev.y);
      if (jump > stepPx * 3) {
        if (dist <= 0) points.length = 0;
        else break;
      }
    }
    points.push({ x: point.x, y: point.y });
    prev = point;
  }
  return points;
}

function drawMeteorSprite(x, y, angle, scale, style) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  const [hot, cool] = style.trail;
  const flame = ctx.createLinearGradient(-34, 0, 8, 0);
  flame.addColorStop(0, 'rgba(255, 255, 255, 0)');
  flame.addColorStop(0.45, cool);
  flame.addColorStop(1, hot);
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(-34, 9);
  ctx.lineTo(-22, 0);
  ctx.lineTo(-34, -9);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -1, 16, 0, Math.PI * 2);
  ctx.clip();
  if (style.flag) drawFlag(ctx, -12, -17, 32, 32, style.flag);
  else {
    ctx.fillStyle = style.body;
    ctx.fillRect(-8, -14, 26, 28);
    ctx.fillStyle = hot;
    ctx.beginPath();
    ctx.arc(8, -3, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMeteor() {
  drawBlasts();
  if (!meteor) return;
  const style = { flag: null, trail: ['#fff6d0', '#ff4d00'], body: '#6a5344' };
  const [hot, cool] = style.trail;
  ctx.save();
  meteor.trail.forEach((point, index) => {
    const t = (index + 1) / meteor.trail.length;
    ctx.globalAlpha = t * 0.85;
    ctx.fillStyle = t > 0.55 ? hot : cool;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4 + t * 11, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = hot;
  ctx.beginPath();
  ctx.arc(meteor.x, meteor.y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawMeteorSprite(meteor.x, meteor.y, Math.atan2(meteor.vy, meteor.vx), 1, style);
}

function drawBanner() {
  if (bannerTimer <= 0 || !bannerText) return;
  ctx.save();
  ctx.font = '700 16px system-ui, "DejaVu Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = bannerLines(bannerText, Math.max(120, view.w - 48));
  const lineHeight = 20;
  const height = lines.length * lineHeight + 16;
  const width = Math.min(view.w - 24, Math.max(...lines.map((line) => ctx.measureText(line).width)) + 28);
  const y = Math.max(132, view.h * 0.22);
  const x = view.w / 2 - width / 2;
  ctx.fillStyle = 'rgba(8, 10, 16, 0.82)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y - height / 2, width, height, 16);
  else ctx.rect(x, y - height / 2, width, height);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  lines.forEach((line, index) => {
    const lineY = y - ((lines.length - 1) * lineHeight) / 2 + index * lineHeight;
    ctx.fillText(line, view.w / 2, lineY);
  });
  ctx.restore();
}

function drawJoystick() {
  if (!usesJoystick() || !joystick.active) return;
  ctx.save();
  ctx.translate(joystick.ox, joystick.oy);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.28)';
  ctx.beginPath();
  ctx.arc(0, 0, JOYSTICK_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = 'rgba(255, 148, 40, 0.7)';
  ctx.strokeStyle = 'rgba(255, 236, 190, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(joystick.x * JOYSTICK_RADIUS, joystick.y * JOYSTICK_RADIUS, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawDragReticle() {
  if (usesJoystick() || !isDragging || gameState !== 'PLAYING') return;
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
  const echoOrbit = time + 2.2;
  drawSpirit(cx + Math.cos(echoOrbit) * 86, cy + Math.sin(echoOrbit) * 36, {
    color: wornEchoColor(),
    flagId: ghostFlag,
    radius: 18,
    phase: time * 3,
    heading: Math.atan2(Math.cos(echoOrbit) * 36, -Math.sin(echoOrbit) * 86),
    hollow: true,
  });
  drawFireball(
    cx + Math.cos(time) * 86,
    cy + Math.sin(time) * 36,
    18,
    time * 6,
    1,
    Math.atan2(Math.cos(time) * 36, -Math.sin(time) * 86),
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

  ctx.fillStyle = '#050814';
  ctx.fillRect(0, 0, view.w, view.h);
  drawGrid();
  drawAtmosphere();
  if (gameState === 'MENU') {
    drawMenuBackdrop();
  } else {
    drawSceneLights();
    drawEchoes();
    drawPickups();
    drawCoinFlashes();
    drawParticles();
    drawMissile();
    drawMeteor();
    drawPlayer();
    drawRecordFlash();
    drawDragReticle();
    drawJoystick();
    drawBanner();
  }
  drawVignette();
  ctx.restore();
}

function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const channel = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * channel).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function ghostHex(color) {
  if (color !== 'prism') return color || '#ff2a55';
  return hslToHex((performance.now() / 16) % 360, 0.86, 0.58);
}

function hexAlpha(hex, alpha) {
  const value = ghostHex(hex).replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

let simFrozen = false;

function frame(now) {
  if (view.w < 2 || view.h < 2) resizeCanvas();
  if (!lastTime) lastTime = now;
  const delta = Math.min(100, now - lastTime);
  lastTime = now;
  if (!simFrozen) {
    accumulator += delta;
    let steps = 0;
    while (accumulator >= STEP && steps < 5) {
      update();
      accumulator -= STEP;
      steps += 1;
    }
    if (steps === 5) accumulator = 0;
  } else {
    accumulator = 0;
  }
  draw();
  if (!document.getElementById('shop-screen').classList.contains('hidden')) renderPreview();
  if (!document.getElementById('flag-screen')?.classList.contains('hidden')) {
    const flagPreview = document.getElementById('flag-preview');
    if (flagPreview) paintLoadoutPreview(flagPreview);
  }
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
  if (slide || gameState !== 'PLAYING' || usesJoystick()) return;
  const point = pointFromEvent(event);
  slide = { id: event.pointerId, x: point.x, y: point.y };
  isDragging = true;
  player.targetX = player.x;
  player.targetY = player.y;
  try { canvas.setPointerCapture(event.pointerId); } catch { /* synthetic pointers */ }
}

function beginJoystick(event) {
  if (!usesJoystick() || joystick.active || gameState !== 'PLAYING') return;
  const point = pointFromEvent(event);
  joystick.active = true;
  joystick.pointerId = event.pointerId;
  joystick.ox = clamp(point.x, JOYSTICK_RADIUS + 8, view.w - JOYSTICK_RADIUS - 8);
  joystick.oy = clamp(point.y, JOYSTICK_RADIUS + 8, view.h - JOYSTICK_RADIUS - 8);
  joystick.x = 0;
  joystick.y = 0;
  joystick.amount = 0;
  try { canvas.setPointerCapture(event.pointerId); } catch { /* synthetic pointers */ }
  updateJoystick(event);
}

function moveSlide(event) {
  if (!slide || event.pointerId !== slide.id || gameState !== 'PLAYING') return;
  const point = pointFromEvent(event);
  const next = slideBy(player.x, player.y, point.x - slide.x, point.y - slide.y, fieldLimits());
  const dx = next.x - player.x;
  const dy = next.y - player.y;
  slide.x = point.x;
  slide.y = point.y;
  player.x = next.x;
  player.y = next.y;
  player.targetX = next.x;
  player.targetY = next.y;
  player.vx = dx;
  player.vy = dy;
  if (dx * dx + dy * dy >= 0.25) playerFace = Math.atan2(dy, dx);
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
  if (!joystick.active || event.pointerId !== joystick.pointerId) return;
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
  document.getElementById('game-container')?.addEventListener('pointerdown', () => {
    AudioEngine.unlock();
  });
  canvas.addEventListener('pointerdown', (event) => {
    if (gameState !== 'PLAYING') return;
    AudioEngine.unlock();
    if (usesJoystick()) beginJoystick(event);
    else beginSlide(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (usesJoystick()) updateJoystick(event);
    else moveSlide(event);
  });
  window.addEventListener('pointermove', (event) => {
    if (usesJoystick()) updateJoystick(event);
    else moveSlide(event);
  });
  window.addEventListener('pointerup', (event) => {
    endJoystick(event);
    endSlide(event);
  });
  window.addEventListener('pointercancel', (event) => {
    endJoystick(event);
    endSlide(event);
  });

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      event.preventDefault();
      if (gameState === 'PLAYING') pauseGame();
      else if (gameState === 'PAUSED') resumeGame();
      return;
    }
    if (gameState === 'PLAYING' && event.code === 'KeyM') {
      event.preventDefault();
      useStoredMissile();
      return;
    }
    if (gameState === 'PLAYING' && event.code === 'KeyF') {
      event.preventDefault();
      useStoredShield();
      return;
    }
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
    pauseGame();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      noteRateLeave();
      pauseGame();
    } else claimRate();
  });
  window.addEventListener('pagehide', () => pauseGame());
  if (Capacitor.isNativePlatform()) {
    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        noteRateLeave();
        pauseGame();
      } else claimRate();
    });
  }
  window.addEventListener('resize', resizeCanvas);
}

function bindUI() {
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('tutorial-btn').addEventListener('click', openTutorial);
  document.getElementById('close-tutorial').addEventListener('click', closeTutorial);
  document.getElementById('retry-btn').addEventListener('click', startGame);
  document.getElementById('shop-btn').addEventListener('click', openShop);
  document.getElementById('close-shop').addEventListener('click', closeShop);
  document.getElementById('open-settings').addEventListener('click', openSettings);
  document.getElementById('close-settings').addEventListener('click', closeOverlay);
  document.getElementById('menu-btn').addEventListener('click', returnToMenu);
  document.getElementById('pause-btn').addEventListener('click', pauseGame);
  document.getElementById('resume-btn').addEventListener('click', resumeGame);
  document.getElementById('pause-menu-btn').addEventListener('click', returnToMenu);
  document.getElementById('try-on-buy').addEventListener('click', confirmTryOn);
  document.getElementById('try-on-ad')?.addEventListener('click', () => {
    const item = actionItem();
    if (item && !ownsItem(item) && itemOffer(item).ads > 0) void watchForItem(item);
  });
  document.getElementById('flag-buy')?.addEventListener('click', confirmTryOn);
  document.getElementById('continue-btn')?.addEventListener('click', continueRun);
  document.getElementById('open-flags')?.addEventListener('click', openFlags);
  document.getElementById('open-player-flags')?.addEventListener('click', openFlags);
  document.getElementById('close-flags')?.addEventListener('click', closeFlags);
  document.getElementById('flag-search')?.addEventListener('input', renderFlags);
  document.getElementById('echo-flag-search')?.addEventListener('input', () => renderFlagGrid('echo-flag-shop', 'echoFlag'));
  document.getElementById('player-flag-search')?.addEventListener('input', () => renderFlagGrid('player-flag-shop', 'playerFlag'));
  document.getElementById('preview-echo')?.addEventListener('click', () => setPreviewSubject('echo'));
  document.getElementById('preview-player')?.addEventListener('click', () => setPreviewSubject('player'));
  document.getElementById('preview-coins')?.addEventListener('click', () => setPreviewSubject('coins'));
  document.getElementById('preview-powers')?.addEventListener('click', () => setPreviewSubject('powers'));
  document.getElementById('rate-go')?.addEventListener('click', goRate);
  document.getElementById('rate-later')?.addEventListener('click', closeRatePrompt);
  const previewDock = document.getElementById('preview-dock');
  let previewSwipe = null;
  previewDock?.addEventListener('pointerdown', (event) => {
    previewSwipe = { x: event.clientX, y: event.clientY };
  });
  previewDock?.addEventListener('pointerup', (event) => {
    if (!previewSwipe) return;
    const dx = event.clientX - previewSwipe.x;
    const dy = event.clientY - previewSwipe.y;
    previewSwipe = null;
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy)) return;
    const order = ['powers', 'echo', 'player', 'coins'];
    const index = Math.max(0, order.indexOf(previewSubject));
    const step = dx > 0 ? 1 : -1;
    setPreviewSubject(order[(index + step + order.length) % order.length]);
  });
  document.getElementById('use-missile').addEventListener('click', useStoredMissile);
  document.getElementById('use-shield').addEventListener('click', useStoredShield);
  document.getElementById('set-music').addEventListener('input', (event) => {
    AudioEngine.unlock();
    settings.music = Number(event.target.value) / 100;
    document.getElementById('music-readout').textContent = event.target.value;
    saveSettings();
  });
  document.getElementById('set-sfx').addEventListener('input', (event) => {
    settings.sfx = Number(event.target.value) / 100;
    document.getElementById('sfx-readout').textContent = event.target.value;
    saveSettings();
  });
  document.getElementById('set-sfx').addEventListener('change', () => {
    if (settings.sfx > 0) AudioEngine.coin();
  });
  document.getElementById('set-language').addEventListener('change', (event) => {
    chooseLanguage(event.target.value);
  });
  document.getElementById('set-joystick')?.addEventListener('change', (event) => {
    settings.control = event.target.checked ? 'joystick' : 'touch';
    clearJoystick();
    endDrag();
    saveSettings();
  });
  document.getElementById('lang-yes').addEventListener('click', () => chooseLanguage(offeredLang || 'en'));
  document.getElementById('lang-no').addEventListener('click', () => chooseLanguage('en'));
  paintPowerIcon(document.getElementById('missile-icon'), 'missile');
  paintPowerIcon(document.getElementById('shield-icon'), 'shield');
}

loadSave();
resizeCanvas();
document.querySelectorAll('.screen.hidden').forEach((screen) => {
  screen.inert = true;
});
document.getElementById('game-container').dataset.screen = 'main-menu';
syncHUD();
syncMenu();
bindInput();
bindUI();
applyLanguage();
offerLanguage();
maybeShowTutorial();
requestAnimationFrame(frame);

if (import.meta.env.DEV) {
  window.__echo = {
    start: startGame,
    pause: pauseGame,
    resume: resumeGame,
    openShop,
    closeShop,
    returnToMenu,
    buyCosmetic,
    confirmTryOn,
    audio: () => ({
      state: AudioEngine.ctx?.state || 'none',
      music: AudioEngine.musicVolume,
      sfx: AudioEngine.sfxVolume,
      playing: typeof AudioEngine.musicTimer === 'number',
    }),
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
    setWallet(amount) {
      coins = clampInt(amount, 0);
      saveAll();
      syncHUD();
    },
    placeEcho(path, options) {
      echoes = [path.map((point) => ({ ...point }))];
      roundFrame = 0;
      grace = 0;
      if (!options?.keepShields) shieldLayers = [];
    },
    freeze(on) {
      simFrozen = Boolean(on);
      accumulator = 0;
    },
    step(count = 1) {
      const n = Math.max(0, Math.floor(count) || 0);
      for (let i = 0; i < n; i += 1) update();
      draw();
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
      meteor: meteor ? { x: meteor.x, y: meteor.y, vx: meteor.vx, vy: meteor.vy } : null,
      tutorialActive,
      bannerText,
      collectibles: collectibles.map((coin) => ({ ...coin })),
      powerups: powerups.map((power) => ({ ...power })),
      shieldLayers: shieldLayers.map((layer) =>
        layer.kind === 'timed' ? { kind: 'timed', life: layer.life } : { kind: 'lasting' },
      ),
      grace,
      roundFrame,
      missileStock,
      shieldStock,
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
