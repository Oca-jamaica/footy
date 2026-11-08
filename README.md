# Sunday Kickabout

A football game in a single HTML file, with two modes:

- **Volta (5v5):** fast football in the cage. 1.0× coins.
- **Classical (9v9):** a bigger pitch, 9-a-side formations, more passing and shape. 1.5× coins. Two pitch sizes:
  Standard and Expanded (about 1.37× bigger each way, for long balls and build-up play).

Online works in all three (Volta, Classical Standard, Classical Expanded). Both laptops need the same version of the
game file. The host picks the match; the match only starts once the joining laptop has loaded it, its controls are
reaching the host and it is receiving the match, then a 3-2-1 countdown. Each player controls their own team: the
joining player's footballer runs on their own laptop, and whenever their team wins the ball the host hands that
footballer to them (the host's AI never plays the ball for them). Messages go over every working route at once (direct
WebRTC link, Claude room, public relays); the freshest route carries the match and a stalled one is dropped within a
fraction of a second. If the connection really drops, both screens pause with a clear message and restart together
after a short countdown.

Each mode has its own five-division league (Amateur, Division 3, 2, 1, Legendary: 10 clubs, 9 rounds (everyone plays everyone once), top 3 up, bottom 3 down)
and its own World Club Championship (64-club knockout, earned with a top-3 finish). Coins, players, upgrades and cosmetics are shared.

Difficulty: **Chill** (green), **Medium** (yellow), **Hard** (red), **Extreme** (fire). On the Classical pitches the computer plays
as a team: one defender gets goal-side and times his tackle, a second covers, others block the obvious pass and track
runners, the back line holds its shape, beaten players race back, and sliding tackles come when someone is through on
goal, lining up a shot or getting away. Clubs have styles (possession, counter-attack, high pressing, direct, wide play). Higher levels make the computer
read the game better as well as play better: they cut out passes, mark the most dangerous runner, block passing lanes,
track runs, make runs into space, counter-attack, time through balls and pick the open corner. Keepers come off their
line to sweep up through balls and loose balls behind the defence (better keepers judge it better).

**Rewards:** every match pays Training Tokens for goal difference (`max(0, goals scored − goals conceded)`), with no
multipliers or caps. Every Club Legacy level pays exactly 1 Club Token. Club Tokens build the six Club Development
departments (Fanbase, Coaching Staff, Training Facilities, Stadium, Scouting, Commercial), levels 1–5, for
5,000 / 10,000 / 20,000 / 35,000 coins plus 1 Club Token per level.

**To play:** open `sunday-kickabout.html` in Chrome, Safari or Edge.

## Editing

The game is split up so it's easier to work on:

- `src/index.html` – page layout and styles
- `src/js/1-data-menu.js` – original players, packs, cups, menus
- `src/js/1b-career.js` – the generated player database, upgrades, evolutions, leagues, World Club Championship, challenges, achievements, Club Legacy, exchanges, cosmetics and their screens
- `src/js/2-engine.js` – pitch sizes, camera, stadium, players, physics, AI
- `src/js/2b-penalties.js` – the penalty shoot-out
- `src/js/3-draw-net.js` – HUD, screens, online play, main loop
- `vendor/` – PeerJS 1.5.4 and MQTT.js 5.10.1 (unchanged npm builds, used for online play)

After editing, rebuild the single file:

```bash
node build.mjs
```

`tools/smoke.cjs` is a quick headless check (needs Playwright): `node tools/smoke.cjs <screenshot-folder>`.
