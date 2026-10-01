# CryptoVerse

A one-screen arcade game. You slide a fireball through a dark starfield, grab three crypto coins to finish a round, and then your route comes back as an echo. Later rounds play every previous route at the same time, a little faster each round, with the coins pulled closer together and a shorter moment of safety when the next echo wakes. Dollars stay in the shop between runs and dress the echoes.

The interface is in English by default. A gear on the home screen opens music, volume, effect, and language settings. French, Spanish, German, Hebrew, and Arabic are included, each with its flag.

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

- Slide a finger or the pointer anywhere. The fireball moves by that same distance and direction, and a tap does not send it to the pointer. Arrow keys / WASD still work.
- In the shop, tap an item to see it on an echo before you buy it. Color, hat, and glasses can be previewed together.
- Collect three crypto coins to seal the round. The path you just drew becomes a ghost. The wallet is in dollars.
- You are safe for a short moment when a new echo wakes up, and for a moment after a shield ends. That opening moment gets shorter as the rounds climb, and the echoes replay your route faster.
- Cyan shields block a hit for about seven seconds. Picking up another shield while one is already up adds a layer and another ring. A glowing gold sack adds $5 and 25 points without cancelling a shield, and it sounds different from a coin. An orange missile flies into the oldest echo and removes it. Collecting a coin makes a very small spark.
- The shop also sells stored missiles ($130) and stored shields ($220). Buy them before a run. There is no stock cap. During play, the missile and shield sit at the top left, the score is in the top center, and the round sits beside the dollars at the top right. Tap a power, or press M or F. A stored shield has no countdown: it blocks the next hit, then drops. Using another one adds a ring.
- The gear at the top left of the home screen opens settings. The dollar count stays at the top right on every screen. The shop's back button is at the top left.
- Shop colors, hats, and glasses dress the echoes that chase you. One of each can be worn at the same time. The catalog includes classic looks (crown, Santa, pirate, cowboy) and louder ones (astronaut helmet, animal ears, colored shades, a very expensive shifting color). You stay a fireball.

## Fixes from the first draft

- A new run clears shields, timers, and leftover pickups. Previously they survived into the next game.
- Overlapping coins are all collected. Removing items inside `forEach` used to skip the next one, so a round could fail to advance.
- The gold pickup pays out. It used to set a powerup type the rest of the game ignored, which also cleared an active shield.
- The shop reads the saved balance immediately, including after a purchase, and a save that isn't valid JSON no longer crashes the boot.
- Pickups are placed away from you and from each other, so a round can't complete on the spawn frame.
- New echoes don't kill you on the frame they appear. The ghost still starts walking during that grace period.
- The arena has a real height. A percentage height inside the centered flex layout could collapse the canvas.
- Pointer input is ignored on the menus, HUD labels don't eat touches, and hidden screens can't be activated with the keyboard.
