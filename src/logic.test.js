import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCosmetic,
  buyCharge,
  dropOldestEcho,
  meteorVelocity,
  pickMeteorEnds,
  pickPowerType,
  shouldSpawnMeteor,
  spendCharge,
  echoClock,
  GHOST_SPEED,
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
  itemOffer,
} from './logic.js';
import { FLAGS, flagById, flagTrail, countryName } from './flags.js';

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
  assert.equal(sealed.echoes.length, 1);
  assert.deepEqual(ghostPoint(sealed.echoes[0], 0), { x: 1, y: 2 });
  assert.equal(ghostPoint([], 0), null);

  // Carrying the prior clock keeps doubles mid-route after a round seal.
  const kept = sealPath([], path, 1, 40);
  const playback = roundPressure(2).playback;
  assert.ok(Math.abs(kept.frame - (40 * 100) / playback) < 1e-9);
  assert.ok(Math.abs(echoClock(kept.frame, 2) - 40) < 1e-9);
});

test('a ghost keeps one pace along the route and skips the time spent standing still', () => {
  const direct = [{ x: 0, y: 0 }, { x: 30, y: 0 }];
  const paused = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 30, y: 0 },
  ];
  assert.deepEqual(ghostPoint(paused, 10, 1), { x: 10, y: 0 });
  assert.deepEqual(ghostPoint(direct, 10, 1), ghostPoint(paused, 10, 1));
  assert.deepEqual(ghostPoint(direct, 40, 1), { x: 10, y: 0 });
  assert.deepEqual(ghostPoint([{ x: 4, y: 7 }], 12), { x: 4, y: 7 });

  const route = [{ x: 0, y: 0 }, { x: 500, y: 0 }];
  const traveled = (round) => ghostPoint(route, echoClock(20, round)).x;
  assert.ok(Math.abs(traveled(1) - 20 * GHOST_SPEED) < 1e-6);
  assert.ok(traveled(4) > traveled(3));
  assert.ok(traveled(3) > traveled(2));
  assert.ok(traveled(5) > traveled(4));
});

test('ghosts arrive every other round and the newest one grows to two paths', () => {
  const first = [{ x: 1, y: 1 }];
  const second = [{ x: 2, y: 2 }, { x: 2, y: 3 }];
  const third = [{ x: 3, y: 3 }];
  const fourth = [{ x: 4, y: 4 }];
  const afterOne = sealPath([], first, 1);
  const afterTwo = sealPath(afterOne.echoes, second, 2);
  assert.equal(afterTwo.echoes.length, 1);
  assert.deepEqual(ghostPoint(afterOne.echoes[0], 5, 1), { x: 1, y: 1 });
  assert.deepEqual(afterTwo.echoes[0], [...first, ...second]);
  assert.deepEqual(ghostPoint(afterTwo.echoes[0], 0, 1), { x: 1, y: 1 });
  const leg = Math.hypot(1, 1);
  const joined = ghostPoint(afterTwo.echoes[0], leg, 1);
  assert.ok(Math.abs(joined.x - 2) < 1e-9 && Math.abs(joined.y - 2) < 1e-9);
  const secondPath = ghostPoint(afterTwo.echoes[0], leg + 0.5, 1);
  assert.ok(Math.abs(secondPath.x - 2) < 1e-9 && Math.abs(secondPath.y - 2.5) < 1e-9);
  assert.deepEqual(ghostPoint(afterTwo.echoes[0], leg + 1, 1), { x: 1, y: 1 });
  const loop = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }];
  const loopLength = 10 + Math.hypot(10, 10) + 10;
  const backOnTheLine = ghostPoint(loop, loopLength + 7, 1);
  assert.ok(Math.abs(backOnTheLine.x - 7) < 1e-9 && Math.abs(backOnTheLine.y) < 1e-9);
  const afterThree = sealPath(afterTwo.echoes, third, 3);
  assert.equal(afterThree.echoes.length, 2);
  assert.deepEqual(afterThree.echoes[0], [...first, ...second]);
  assert.deepEqual(afterThree.echoes[1], third);
  const afterFour = sealPath(afterThree.echoes, fourth, 4);
  assert.equal(afterFour.echoes.length, 2);
  assert.deepEqual(afterFour.echoes[1], [...third, ...fourth]);
  second[0].x = 90;
  assert.equal(afterFour.echoes[0][1].x, 2);
  assert.ok(Math.abs(roundPressure(3).playback - 100.7) < 1e-9);
  assert.ok(Math.abs(roundPressure(4).playback - 101.05) < 1e-9);
  assert.ok(roundPressure(5).playback > roundPressure(3).playback);
});

test('cosmetics are free, coins, ads, or a store rating', () => {
  assert.deepEqual(itemOffer({ price: 0 }), { kind: 'free', ads: 0, price: 0 });
  assert.deepEqual(itemOffer({ price: 780 }), { kind: 'coin', ads: 0, price: 780 });
  assert.deepEqual(itemOffer({ price: 0, offer: 'ad', ads: 1 }), { kind: 'ad', ads: 1, price: 0 });
  assert.deepEqual(itemOffer({ price: 4000, ads: 10, offer: 'either' }), { kind: 'either', ads: 10, price: 4000 });
  assert.deepEqual(itemOffer({ price: 2200, ads: 5 }), { kind: 'either', ads: 5, price: 2200 });
  assert.deepEqual(itemOffer({ price: 0, offer: 'rate' }), { kind: 'rate', ads: 0, price: 0 });
  assert.equal(FLAGS.length >= 190, true);
  assert.equal(new Set(FLAGS.map((flag) => flag.id)).size, FLAGS.length);
  assert.deepEqual(flagTrail(flagById('il')), ['#ffffff', '#0038b8']);
  assert.equal(countryName('il', 'he'), 'ישראל');
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
  assert.deepEqual(roundPressure(2), { playback: 100.35, grace: 73, spacing: 77, reach: 312 });
  assert.ok(Math.abs(roundPressure(8).playback - 102.45) < 1e-9);
  assert.equal(roundPressure(8).grace, 61);
  assert.equal(roundPressure(8).spacing, 71);
  assert.equal(roundPressure(8).reach, 264);
  const twelve = roundPressure(12);
  assert.ok(Math.abs(twelve.playback - 103.85) < 1e-9);
  assert.equal(twelve.grace, 53);
  assert.equal(twelve.spacing, 67);
  assert.equal(twelve.reach, 232);
  assert.ok(Math.abs(roundPressure(16).playback - 105.25) < 1e-9);
  assert.equal(roundPressure(22).grace, 40);
  assert.equal(roundPressure(22).reach, 170);
  assert.equal(roundPressure(24).spacing, 56);
  assert.equal(echoClock(0, 8), 0);
  assert.equal(echoClock(10, 1), 10);
  assert.ok(Math.abs(echoClock(10, 6) - 10.175) < 1e-9);
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

test('missiles are the rare field power and meteors stay near one in fifty', () => {
  let missiles = 0;
  let shields = 0;
  for (let i = 0; i < 1100; i += 1) {
    const type = pickPowerType(() => (i % 11) / 11);
    if (type === 'MISSILE') missiles += 1;
    if (type === 'SHIELD') shields += 1;
  }
  assert.ok(missiles > 100);
  assert.ok(missiles < shields);
  for (let i = 0; i < 20; i += 1) {
    assert.notEqual(pickPowerType(() => i / 20, false), 'MISSILE');
  }
  assert.equal(shouldSpawnMeteor(() => 0.01), true);
  assert.equal(shouldSpawnMeteor(() => 0.03), false);
  const ends = pickMeteorEnds(() => 0.1, 400);
  assert.ok(Math.abs(ends.endX - ends.startX) >= 400 * 0.38);
  const velocity = meteorVelocity(ends.startX, ends.endX, 800, 24);
  assert.ok(Math.abs(velocity.vx) > 1);
  assert.ok(velocity.vy > 20);
});
