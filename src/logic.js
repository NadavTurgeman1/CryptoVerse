/** Pure game rules, kept separate so the shop, echoes, and pickups can be tested. */

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Move by the pointer's delta. A press with no movement leaves the point where it is. */
export function slideBy(x, y, dx, dy, bounds) {
  return {
    x: clamp(x + dx, bounds.minX, bounds.maxX),
    y: clamp(y + dy, bounds.minY, bounds.maxY),
  };
}

export function clampInt(value, fallback = 0) {
  const n = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

export function safeJson(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function sanitizeUnlocks(list, catalogIds) {
  const allowed = new Set(catalogIds);
  const cleaned = Array.isArray(list) ? list.filter((id) => allowed.has(id)) : [];
  if (catalogIds[0] && !cleaned.includes(catalogIds[0])) cleaned.unshift(catalogIds[0]);
  return cleaned;
}

/** Pixels traveled each frame when playback is 100. Round pressure scales this. */
export const GHOST_SPEED = 6;

/**
 * Walk the sealed route at a steady pace.
 * Reaching the last point jumps back to the first. The ghost never cuts
 * across empty space to close the loop.
 * Extra samples from standing still add no distance.
 */
export function ghostPoint(echo, frame, speed = GHOST_SPEED) {
  if (!echo?.length) return null;
  const home = { x: echo[0].x, y: echo[0].y };
  if (echo.length === 1) return home;

  const spans = [];
  let total = 0;
  const push = (from, to) => {
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    spans.push({ from, to, length });
    total += length;
  };
  for (let i = 1; i < echo.length; i += 1) push(echo[i - 1], echo[i]);
  if (!(total > 0)) return home;

  const ticks = Number(frame);
  const pace = Number(speed);
  const travel = (Number.isFinite(ticks) ? ticks : 0) * (Number.isFinite(pace) && pace > 0 ? pace : GHOST_SPEED);
  let distance = ((travel % total) + total) % total;
  for (const span of spans) {
    if (!(span.length > 0)) continue;
    if (distance <= span.length) {
      const t = distance / span.length;
      return {
        x: span.from.x + (span.to.x - span.from.x) * t,
        y: span.from.y + (span.to.y - span.from.y) * t,
      };
    }
    distance -= span.length;
  }
  return home;
}

/**
 * Later rounds tighten the route you just drew, a little at a time.
 * Playback climbs slowly. A round that only extends a ghost speeds them up,
 * and a round that adds a ghost slows them a little, without breaking the climb.
 * Grace is frames of safety, spacing is how far apart coins stay,
 * and reach pulls them toward the first coin.
 */
export function roundPressure(round) {
  const steps = Math.max(0, Math.floor(Number(round)) - 1);
  const safeSteps = Number.isFinite(steps) ? steps : 0;
  const wave = safeSteps % 2 === 1 ? -3 : 0;
  return {
    playback: Math.min(160, Math.max(90, 100 + safeSteps * 2 + wave)),
    grace: Math.max(40, 75 - safeSteps * 2),
    spacing: Math.max(56, 78 - safeSteps),
    reach: safeSteps === 0 ? Infinity : Math.max(170, 320 - safeSteps * 8),
  };
}

/** Travel time along a route. Playback 100 keeps the base speed, and later rounds scale it. */
export function echoClock(frame, round) {
  const ticks = Number(frame);
  const safe = Number.isFinite(ticks) ? Math.max(0, ticks) : 0;
  return (safe * roundPressure(round).playback) / 100;
}

/** The first sealed route is the oldest echo. Later routes stay in order. */
export function dropOldestEcho(echoes) {
  if (!Array.isArray(echoes) || echoes.length === 0) {
    return { echoes: Array.isArray(echoes) ? echoes : [], removed: false };
  }
  return { echoes: echoes.slice(1), removed: true };
}

/** One homing step. `turn` is 0..1, and `distance` is measured before the move. */
export function stepHoming(missile, target, speed, turn) {
  const dx = target.x - missile.x;
  const dy = target.y - missile.y;
  const distance = Math.hypot(dx, dy);
  if (!(distance > 0)) {
    return { x: target.x, y: target.y, vx: 0, vy: 0, distance: 0 };
  }
  const desiredVx = (dx / distance) * speed;
  const desiredVy = (dy / distance) * speed;
  const vx = missile.vx + (desiredVx - missile.vx) * turn;
  const vy = missile.vy + (desiredVy - missile.vy) * turn;
  return {
    x: missile.x + vx,
    y: missile.y + vy,
    vx,
    vy,
    distance,
  };
}

export function hitsEcho(player, echoes, frame, hitDist, vulnerable) {
  if (!vulnerable) return false;
  for (const echo of echoes) {
    const ghost = ghostPoint(echo, frame);
    if (!ghost) continue;
    if (Math.hypot(player.x - ghost.x, player.y - ghost.y) < hitDist) return true;
  }
  return false;
}

/**
 * Keep the finished route. Odd rounds add a ghost with that one path.
 * Even rounds extend the newest ghost, so it walks the first path and then the second.
 * Later edits to `path` must not rewrite history.
 */
export function sealPath(echoes, path, round) {
  const sealed = path.map((point) => ({ x: point.x, y: point.y }));
  const next = echoes.map((echo) => echo.map((point) => ({ x: point.x, y: point.y })));
  const finished = Math.max(1, Math.floor(Number(round)) || 1);
  if (finished % 2 === 1 || next.length === 0) next.push(sealed);
  else {
    const last = next[next.length - 1];
    next[next.length - 1] = [...last, ...sealed];
  }
  return {
    echoes: next,
    round: round + 1,
    frame: 0,
  };
}

/**
 * Collect every overlapping pickup. Iterating backwards or filtering matters:
 * splicing inside forEach skips the item that slides into the removed index.
 */
export function takeOverlaps(items, x, y, reachFor) {
  const kept = [];
  const taken = [];
  for (const item of items) {
    const reach = typeof reachFor === 'function' ? reachFor(item) : reachFor;
    if (Math.hypot(item.x - x, item.y - y) < reach) taken.push(item);
    else kept.push(item);
  }
  return { kept, taken };
}

export function pickSpawn(rand, bounds, blockers, cluster) {
  const spanX = Math.max(0, bounds.maxX - bounds.minX);
  const spanY = Math.max(0, bounds.maxY - bounds.minY);
  const clustered = cluster && Number.isFinite(cluster.reach);
  let fallback = {
    x: bounds.minX + spanX / 2,
    y: bounds.minY + spanY / 2,
  };

  for (let attempt = 0; attempt < 40; attempt += 1) {
    let point;
    if (clustered) {
      const angle = rand() * Math.PI * 2;
      const dist = rand() * cluster.reach;
      point = {
        x: clamp(cluster.x + Math.cos(angle) * dist, bounds.minX, bounds.maxX),
        y: clamp(cluster.y + Math.sin(angle) * dist, bounds.minY, bounds.maxY),
      };
    } else {
      point = {
        x: bounds.minX + rand() * spanX,
        y: bounds.minY + rand() * spanY,
      };
    }
    fallback = point;
    const clear = blockers.every((blocker) => {
      const minDist = blocker.minDist ?? 48;
      return Math.hypot(blocker.x - point.x, blocker.y - point.y) >= minDist;
    });
    const inside = !clustered || Math.hypot(point.x - cluster.x, point.y - cluster.y) <= cluster.reach + 0.5;
    if (clear && inside) return point;
  }

  if (!clustered) return fallback;
  const angle = rand() * Math.PI * 2;
  const dist = Math.min(cluster.reach, 52);
  return {
    x: clamp(cluster.x + Math.cos(angle) * dist, bounds.minX, bounds.maxX),
    y: clamp(cluster.y + Math.sin(angle) * dist, bounds.minY, bounds.maxY),
  };
}

/** Buy one stored charge. Stock has no cap. A short wallet buys nothing. */
export function buyCharge(coins, stock, price) {
  const owned = Math.max(0, Math.floor(Number(stock)) || 0);
  const wallet = Math.max(0, Math.floor(Number(coins)) || 0);
  const cost = Math.max(0, Math.floor(Number(price)) || 0);
  if (wallet < cost) return { coins: wallet, stock: owned, status: 'broke' };
  return { coins: wallet - cost, stock: owned + 1, status: 'bought' };
}

/** Spend one stored charge. An empty stock stays empty. */
export function spendCharge(stock) {
  const owned = Math.max(0, Math.floor(Number(stock)) || 0);
  if (owned <= 0) return { stock: 0, status: 'empty' };
  return { stock: owned - 1, status: 'spent' };
}

/** Coin price, rewarded ads, both, a store rating, or already free. */
export function itemOffer(item) {
  if (item?.offer === 'rate') return { kind: 'rate', ads: 0, price: 0 };
  const price = Math.max(0, Math.floor(Number(item?.price)) || 0);
  const listedAds = Math.floor(Number(item?.ads)) || 0;
  const ads = item?.offer === 'ad' ? Math.max(1, listedAds) : Math.max(0, listedAds);
  if (price > 0 && ads > 0) return { kind: 'either', ads, price };
  if (ads > 0) return { kind: 'ad', ads, price: 0 };
  if (price <= 0) return { kind: 'free', ads: 0, price: 0 };
  return { kind: 'coin', ads: 0, price };
}

export function resolvePurchase(state, item) {
  if (state.unlocked.includes(item.id)) {
    return {
      coins: state.coins,
      unlocked: state.unlocked,
      active: item.id,
      status: 'equipped',
    };
  }

  if (state.coins < item.price) {
    return {
      coins: state.coins,
      unlocked: state.unlocked,
      active: state.active,
      status: 'broke',
    };
  }

  return {
    coins: state.coins - item.price,
    unlocked: [...state.unlocked, item.id],
    active: item.id,
    status: 'bought',
  };
}

/**
 * The echo preview wears pinned try-ons, with a hover replacing only its slot.
 * Equipped ids fill any slot that is not being tried.
 */
export function previewLoadout(equipped, pinned, hover) {
  const look = {
    color: equipped.color,
    hat: equipped.hat,
    glasses: equipped.glasses,
  };
  for (const slot of ['color', 'hat', 'glasses']) {
    if (pinned?.[slot]) look[slot] = pinned[slot];
  }
  if (hover?.slot && hover.id) look[hover.slot] = hover.id;
  return look;
}

/** Stick deflection clamped to a radius. `amount` is 0 at rest and 1 at the edge. */
export function joystickVector(dx, dy, radius) {
  const distance = Math.hypot(dx, dy);
  if (!(distance > 0) || !(radius > 0)) return { x: 0, y: 0, amount: 0 };
  const amount = Math.min(1, distance / radius);
  return {
    x: (dx / distance) * amount,
    y: (dy / distance) * amount,
    amount,
  };
}

/** Equip one shop slot without clearing the others, so a color, hat, and glasses can be worn together. */
export function applyCosmetic(loadout, item) {
  const result = resolvePurchase({
    coins: loadout.coins,
    unlocked: loadout.unlocked[item.slot],
    active: loadout.active[item.slot],
  }, item);
  return {
    coins: result.coins,
    unlocked: { ...loadout.unlocked, [item.slot]: result.unlocked },
    active: { ...loadout.active, [item.slot]: result.active },
    status: result.status,
  };
}

/** Shield and the sack stay common. A missile is a bit more common than it used to be, and still rarer than both. */
const POWER_WEIGHTS = [
  ['SHIELD', 5],
  ['COIN', 5],
  ['MISSILE', 2.5],
];

export function pickPowerType(rand, allowMissile = true) {
  const table = allowMissile
    ? POWER_WEIGHTS
    : POWER_WEIGHTS.filter(([type]) => type !== 'MISSILE');
  const total = table.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rand() * total;
  for (const [type, weight] of table) {
    roll -= weight;
    if (roll < 0) return type;
  }
  return 'SHIELD';
}

/** About one meteor every fifty rounds, decided independently each round. */
export function shouldSpawnMeteor(rand) {
  return rand() < 1 / 50;
}

/** A fast diagonal from the top. The ends stay far enough apart that it is never a vertical drop. */
export function pickMeteorEnds(rand, width) {
  const span = Math.max(1, width);
  const startX = span * (0.08 + rand() * 0.84);
  let endX = span * (0.08 + rand() * 0.84);
  const minSpan = span * 0.38;
  if (Math.abs(endX - startX) < minSpan) {
    const dir = endX >= startX ? 1 : -1;
    endX = clamp(startX + dir * minSpan, span * 0.05, span * 0.95);
  }
  return { startX, endX };
}

export function meteorVelocity(startX, endX, height, frames) {
  const travel = Math.max(8, frames);
  return {
    vx: (endX - startX) / travel,
    vy: Math.max(1, height) / travel,
  };
}
