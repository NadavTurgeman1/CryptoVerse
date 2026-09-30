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

export function ghostPoint(echo, frame) {
  if (!echo?.length) return null;
  const index = ((frame % echo.length) + echo.length) % echo.length;
  return echo[index];
}

/**
 * Later rounds tighten the route you just drew, a little at a time.
 * Playback is a percent of the recorded speed, grace is frames of safety,
 * spacing is how far apart coins stay, and reach pulls them toward the first coin.
 * The hard floors land around round 20, so round 12 is still a climb.
 */
export function roundPressure(round) {
  const steps = Math.max(0, Math.floor(Number(round)) - 1);
  const safeSteps = Number.isFinite(steps) ? steps : 0;
  return {
    playback: Math.min(160, 100 + safeSteps * 4),
    grace: Math.max(40, 75 - safeSteps * 2),
    spacing: Math.max(56, 78 - safeSteps),
    reach: safeSteps === 0 ? Infinity : Math.max(170, 320 - safeSteps * 8),
  };
}

/** Path index for every echo. Round 1 stays on the recorded clock. */
export function echoClock(frame, round) {
  const ticks = Math.max(0, Math.floor(Number(frame)) || 0);
  return Math.floor((ticks * roundPressure(round).playback) / 100);
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

/** Copy the finished route into the echo list. Later edits to `path` must not rewrite history. */
export function sealPath(echoes, path, round) {
  const sealed = path.map((point) => ({ x: point.x, y: point.y }));
  return {
    echoes: [...echoes, sealed],
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
