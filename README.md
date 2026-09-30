# Echo

A one-screen arcade game. You drag a fireball around a dark arena, grab three coins to finish a round, and then your route comes back as an echo. Later rounds play every previous route at the same time. Coins stay in the shop between runs and dress the echoes.

The interface is in English.

## Run locally

```bash
npm install
npm run dev
```

Open http://127.0.0.1:47321

```bash
npm test
npm run build
```

## How to play

- Drag the fireball, or use the arrow keys / WASD.
- Collect three coins to seal the round. The path you just drew becomes a ghost.
- You are safe for a short moment when a new echo wakes up, and for a moment after a shield ends.
- Cyan shields block a hit for about five seconds. Gold `+` pickups add 5 coins and 25 points without cancelling a shield.
- Shop colors, hats, and glasses dress the echoes that chase you. One of each can be worn at the same time. You stay a fireball.

## Fixes from the first draft

- A new run clears shields, timers, and leftover pickups. Previously they survived into the next game.
- Overlapping coins are all collected. Removing items inside `forEach` used to skip the next one, so a round could fail to advance.
- The gold pickup pays out. It used to set a powerup type the rest of the game ignored, which also cleared an active shield.
- The shop reads the saved balance immediately, including after a purchase, and a save that isn't valid JSON no longer crashes the boot.
- Pickups are placed away from you and from each other, so a round can't complete on the spawn frame.
- New echoes don't kill you on the frame they appear. The ghost still starts walking during that grace period.
- The arena has a real height. A percentage height inside the centered flex layout could collapse the canvas.
- Pointer input is ignored on the menus, HUD labels don't eat touches, and hidden screens can't be activated with the keyboard.
