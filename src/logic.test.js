import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCosmetic,
  buyCharge,
  dropOldestEcho,
  spendCharge,
  echoClock,
  ghostPoint,
  hitsEcho,
  roundPressure,
  stepHoming,
  joystickVector,
  pickSpawn,
  previewLoadout,
  slideBy,
  resolvePurchase,
  safeJson,
  sanitizeUnlocks,
  sealPath,
  takeOverlaps,
} from './logic.js';

test('corrupt color saves fall back instead of throwing', () => {
  assert.deepEqual(safeJson('{', ['#00f0ff']), ['#00f0ff']);
  assert.deepEqual(safeJson(null, ['#00f0ff']), ['#00f0ff']);
  assert.deepEqual(
    sanitizeUnlocks(['#ff0055', '#nope', 12], ['#00f0ff', '#ff0055', '#00ff66']),
    ['#00f0ff', '#ff0055'],
  );
});

test('collecting removes every overlapping pickup, not every other one', () => {
  const items = [
    { id: 'a', x: 0, y: 0 },
    { id: 'b', x: 1, y: 0 },
    { id: 'c', x: 80, y: 0 },
  ];
  const { kept, taken } = takeOverlaps(items, 0, 0, 20);
  assert.deepEqual(taken.map((item) => item.id), ['a', 'b']);
  assert.deepEqual(kept.map((item) => item.id), ['c']);
});

test('a sealed echo is a snapshot, and the ghost loops with the round clock', () => {
  const path = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
  const sealed = sealPath([], path, 1);
  path.push({ x: 9, y: 9 });
  path[0].x = 50;
  assert.equal(sealed.round, 2);
  assert.equal(sealed.frame, 0);
  assert.deepEqual(sealed.echoes[0], [{ x: 1, y: 2 }, { x: 3, y: 4 }]);
  assert.deepEqual(ghostPoint(sealed.echoes[0], 0), { x: 1, y: 2 });
  assert.deepEqual(ghostPoint(sealed.echoes[0], 3), { x: 3, y: 4 });
  assert.equal(ghostPoint([], 0), null);
});

test('shield and round-start grace block echo hits', () => {
  const player = { x: 0, y: 0 };
  const echoes = [[{ x: 0, y: 0 }]];
  assert.equal(hitsEcho(player, echoes, 0, 20, true), true);
  assert.equal(hitsEcho(player, echoes, 0, 20, false), false);
  assert.equal(hitsEcho(player, echoes, 0, 0, true), false);
});

test('shop equips owned colors, buys affordable ones, and refuses the rest', () => {
  const owned = resolvePurchase(
    { coins: 10, unlocked: ['#00f0ff', '#ff0055'], active: '#00f0ff' },
    { id: '#ff0055', price: 50 },
  );
  assert.equal(owned.status, 'equipped');
  assert.equal(owned.coins, 10);

  const bought = resolvePurchase(
    { coins: 50, unlocked: ['#00f0ff'], active: '#00f0ff' },
    { id: '#ff0055', price: 50 },
  );
  assert.equal(bought.status, 'bought');
  assert.equal(bought.coins, 0);
  assert.deepEqual(bought.unlocked, ['#00f0ff', '#ff0055']);
  assert.equal(bought.active, '#ff0055');

  const broke = resolvePurchase(
    { coins: 49, unlocked: ['#00f0ff'], active: '#00f0ff' },
    { id: '#ff0055', price: 50 },
  );
  assert.equal(broke.status, 'broke');
  assert.equal(broke.active, '#00f0ff');
  assert.equal(broke.coins, 49);
});

test('a color, a hat, and glasses equip together', () => {
  const withHat = applyCosmetic({
    coins: 400,
    unlocked: { color: ['#ff2a55'], hat: ['none'], glasses: ['none'] },
    active: { color: '#ff2a55', hat: 'none', glasses: 'none' },
  }, { slot: 'hat', id: 'cap', price: 40 });
  const withBoth = applyCosmetic({
    coins: withHat.coins,
    unlocked: withHat.unlocked,
    active: withHat.active,
  }, { slot: 'glasses', id: 'shades', price: 90 });
  const recolored = applyCosmetic({
    coins: withBoth.coins,
    unlocked: withBoth.unlocked,
    active: withBoth.active,
  }, { slot: 'color', id: '#b388ff', price: 80 });

  assert.equal(recolored.status, 'bought');
  assert.equal(recolored.coins, 400 - 40 - 90 - 80);
  assert.equal(recolored.active.color, '#b388ff');
  assert.equal(recolored.active.hat, 'cap');
  assert.equal(recolored.active.glasses, 'shades');
  assert.deepEqual(recolored.unlocked.hat, ['none', 'cap']);
  assert.deepEqual(recolored.unlocked.glasses, ['none', 'shades']);
});

test('a shop preview stacks try-ons and lets a hover replace one slot', () => {
  const equipped = { color: '#ff2a55', hat: 'none', glasses: 'none' };
  const pinned = previewLoadout(equipped, { color: '#b388ff', hat: 'crown', glasses: null }, null);
  assert.deepEqual(pinned, { color: '#b388ff', hat: 'crown', glasses: 'none' });
  const hovered = previewLoadout(equipped, { hat: 'crown' }, { slot: 'color', id: '#00f0ff' });
  assert.equal(hovered.color, '#00f0ff');
  assert.equal(hovered.hat, 'crown');
  assert.equal(hovered.glasses, 'none');
});

test('the joystick clamps to its radius and keeps direction', () => {
  assert.deepEqual(joystickVector(0, 0, 56), { x: 0, y: 0, amount: 0 });
  const inside = joystickVector(0, 28, 56);
  assert.equal(inside.amount, 0.5);
  assert.ok(Math.abs(inside.y - 0.5) < 1e-9);
  const outside = joystickVector(-112, 0, 56);
  assert.equal(outside.amount, 1);
  assert.ok(Math.abs(outside.x + 1) < 1e-9);
  assert.equal(outside.y, 0);
});

test('a missile removes only the oldest echo', () => {
  const first = [{ x: 1, y: 1 }];
  const second = [{ x: 2, y: 2 }];
  const third = [{ x: 3, y: 3 }];
  const hit = dropOldestEcho([first, second, third]);
  assert.equal(hit.removed, true);
  assert.deepEqual(hit.echoes, [second, third]);
  const miss = dropOldestEcho([]);
  assert.equal(miss.removed, false);
  assert.deepEqual(miss.echoes, []);
});

test('a homing step moves toward the target and reports the gap', () => {
  const next = stepHoming({ x: 0, y: 0, vx: 0, vy: 0 }, { x: 100, y: 0 }, 10, 1);
  assert.equal(next.distance, 100);
  assert.ok(Math.abs(next.x - 10) < 1e-9);
  assert.equal(next.y, 0);
  const arrived = stepHoming({ x: 4, y: 4, vx: 1, vy: 0 }, { x: 4, y: 4 }, 10, 1);
  assert.equal(arrived.distance, 0);
  assert.equal(arrived.x, 4);
});

test('a slide moves by the finger delta and does not jump to the finger', () => {
  const bounds = { minX: 14, maxX: 466, minY: 14, maxY: 786 };
  const still = slideBy(200, 300, 0, 0, bounds);
  assert.deepEqual(still, { x: 200, y: 300 });
  const right = slideBy(200, 300, 48, -12, bounds);
  assert.deepEqual(right, { x: 248, y: 288 });
  const edge = slideBy(450, 20, 40, -20, bounds);
  assert.deepEqual(edge, { x: 466, y: 14 });
});

test('later rounds speed the echoes up, shorten the grace, and pull coins into a cluster', () => {
  assert.deepEqual(roundPressure(1), { playback: 100, grace: 75, spacing: 78, reach: Infinity });
  assert.deepEqual(roundPressure(2), { playback: 110, grace: 69, spacing: 74, reach: 244 });
  assert.equal(roundPressure(8).playback, 170);
  assert.equal(roundPressure(8).grace, 36);
  assert.equal(roundPressure(8).spacing, 52);
  assert.equal(roundPressure(8).reach, 150);
  assert.equal(roundPressure(20).playback, 170);
  assert.equal(echoClock(0, 8), 0);
  assert.equal(echoClock(10, 1), 10);
  assert.equal(echoClock(10, 6), 15);
  assert.equal(echoClock(-4, 6), 0);

  let n = 0;
  const rand = () => {
    n += 1;
    return ((n * 3) % 10) / 10;
  };
  const point = pickSpawn(
    rand,
    { minX: 0, maxX: 400, minY: 0, maxY: 700 },
    [{ x: 200, y: 300, minDist: 40 }],
    { x: 200, y: 300, reach: 120 },
  );
  const dist = Math.hypot(point.x - 200, point.y - 300);
  assert.ok(dist >= 40, `coin landed on the anchor (${dist})`);
  assert.ok(dist <= 120.5, `coin left the cluster (${dist})`);
});

test('stored charges stack without a cap and a broke wallet buys nothing', () => {
  const first = buyCharge(200, 0, 160);
  assert.equal(first.status, 'bought');
  assert.equal(first.coins, 40);
  assert.equal(first.stock, 1);
  const second = buyCharge(400, first.stock, 160);
  assert.equal(second.stock, 2);
  assert.equal(second.coins, 240);
  const broke = buyCharge(159, 4, 160);
  assert.equal(broke.status, 'broke');
  assert.equal(broke.coins, 159);
  assert.equal(broke.stock, 4);
  const spent = spendCharge(second.stock);
  assert.equal(spent.status, 'spent');
  assert.equal(spent.stock, 1);
  const empty = spendCharge(0);
  assert.equal(empty.status, 'empty');
  assert.equal(empty.stock, 0);
});

test('spawns stay away from the player when the field has room', () => {
  let n = 0;
  const rand = () => {
    n += 1;
    return (n % 7) / 7;
  };
  const point = pickSpawn(
    rand,
    { minX: 0, maxX: 400, minY: 0, maxY: 700 },
    [{ x: 10, y: 10, minDist: 90 }],
  );
  assert.ok(Math.hypot(point.x - 10, point.y - 10) >= 90);
});
