import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCosmetic,
  ghostPoint,
  hitsEcho,
  joystickVector,
  pickSpawn,
  previewLoadout,
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
