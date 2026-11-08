# Sunday Kickabout

A football game in a single HTML file, with two modes:

- **Volta (5v5):** fast football in the cage. 1.0× coins.
- **Classical (9v9):** a bigger pitch, 9-a-side formations, more passing and shape. 1.5× coins. Two pitch sizes:
  Standard and Expanded (about 1.37× bigger each way, for long balls and build-up play).

Online works in all three (Volta, Classical Standard, Classical Expanded): the host picks the match, both laptops load
and confirm they're ready, then a 3-2-1 countdown.

Each mode has its own five-division league (Amateur, Division 3, 2, 1, Legendary: 10 clubs, 9 rounds (everyone plays everyone once), top 3 up, bottom 3 down)
and its own World Club Championship (64-club knockout, earned with a top-3 finish). Coins, players, upgrades and cosmetics are shared.

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
