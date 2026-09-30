/** Pure game rules, kept separate so the shop, echoes, and pickups can be tested. */

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

export function pickSpawn(rand, bounds, blockers) {
  const spanX = Math.max(0, bounds.maxX - bounds.minX);
  const spanY = Math.max(0, bounds.maxY - bounds.minY);
  let fallback = {
    x: bounds.minX + spanX / 2,
    y: bounds.minY + spanY / 2,
  };

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const point = {
      x: bounds.minX + rand() * spanX,
      y: bounds.minY + spanY * rand(),
    };
    fallback = point;
    const clear = blockers.every((blocker) => {
      const minDist = blocker.minDist ?? 48;
      return Math.hypot(blocker.x - point.x, blocker.y - point.y) >= minDist;
    });
    if (clear) return point;
  }

  return fallback;
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
