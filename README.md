# Sunday Kickabout

A football game in a single HTML file, with two modes:

- **Volta (5v5):** fast football in the cage. 1.0× coins.
- **Classical (9v9):** a bigger pitch, 9-a-side formations, more passing and shape. 1.5× coins. Two pitch sizes:
  Standard and Expanded (about 1.37× bigger each way, for long balls and build-up play).

Online works in all three (Volta, Classical Standard, Classical Expanded). Both laptops need the same version of the
game file. There is one match, run on the host's laptop: it decides possession, passes, shots, tackles, goals, the clock
and the result. The joining laptop sends every press numbered and re-sent until the host confirms it, and the host runs
it through exactly the same code as its own player's presses (a pass or shot pressed as the ball is arriving is held
for up to 0.3 s and done the moment it arrives). The joining laptop moves its own footballer straight away while he's
simply running (and starts its own lunges and slides the instant they're pressed), and the host follows that; whether a
tackle wins the ball, knocks, skills and the ball are the host's. Everything else on the joining laptop is drawn from the
host's time-stamped updates a few tens of milliseconds behind, gliding between two real updates rather than guessing
ahead, so late or bunched-up packets don't make anything twitch; a loose ball near your footballer is eased into the
present so passes reach your feet on time, and goals and the full-time whistle land when the ball does on that screen.
Online matches add their own punch on both laptops (camera punches, speed lines, slam-in calls like WHAT A SAVE! and
EQUALISER!, stadium strobes and confetti) and a VS card with both clubs and managers before kick-off. These only change
what's drawn; online, ON FIRE is for show for both players and gives no boost. A match only starts once
the joining laptop has loaded the same match, its presses are reaching the host and it is receiving the host's updates.
Connections: a direct WebRTC link (PeerJS's public signalling, with Google STUN and PeerJS's public TURN relay for strict
routers) and public MQTT relays over secure websockets, all tried at once; the freshest route carries the match. If the
connection really drops, both screens pause and restart together. After the final whistle both stay in the room for a
rematch. Press N during an online match for connection details.

Each mode has its own five-division league (Amateur, Division 3, 2, 1, Legendary: 10 clubs, 9 rounds (everyone plays everyone once), top 3 up, bottom 3 down)
and its own World Club Championship (64-club knockout, earned with a top-3 finish). Coins, players, upgrades and cosmetics are shared.

Difficulty: **Chill** (green), **Medium** (yellow), **Hard** (red), **Extreme** (fire). On the Classical pitches the computer plays
as a team: one defender gets goal-side and times his tackle, a second covers, others block the obvious pass and track
runners, the back line holds its shape, beaten players race back, and sliding tackles come when someone is through on
goal, lining up a shot or getting away. Clubs have styles (possession, counter-attack, high pressing, direct, wide play). Higher levels make the computer
read the game better as well as play better: they cut out passes, mark the most dangerous runner, block passing lanes,
track runs, make runs into space, counter-attack, time through balls and pick the open corner. Keepers come off their
line to sweep up through balls and loose balls behind the defence (better keepers judge it better).

**Rewards:** every completed match pays Training Tokens for half the winning margin, rounded down
(`floor(max(0, goals scored − goals conceded) ÷ 2)`: 2–0 or 3–1 pays 1, 4–0 pays 2, 1–0 or a draw pays nothing), once per
match, online too, with no multipliers; the full-time screen shows the sum. Other token rewards are unchanged. Every Club Legacy level pays exactly 1 Club Token. Club Tokens build the six Club Development
departments (Fanbase, Coaching Staff, Training Facilities, Stadium, Scouting, Commercial), levels 1–5, for
5,000 / 10,000 / 20,000 / 35,000 coins plus 1 Club Token per level.


**Through Ball (special):** aimed into the space ahead of the team-mate furthest up the pitch (towards the goal his side
attacks), never an opponent, the keeper, anyone on the floor, or anyone offside; if nobody's eligible it isn't played and
the cooldown isn't spent. It travels at 0.20× its previous speed as an ordinary loose ball that defenders and keepers can
cut out. Measured: it now travels about 50–80 px (it used to cover 570–630 px and reach the runner every time), so the
passer's side usually just collects it again. That's the requested multiplier, kept as asked; `THROUGH_SPEED` in
`src/js/2-engine.js` is the one number to change. Cooldowns are unchanged (25 s at level 1 to 7 s at level 10).

**Computer's attack (Classical pitches):** the ball carrier weighs shooting, passing (to feet, into a runner's stride,
across goal, switches, long balls, crosses), dribbling into the most open lane, taking a man on, or keeping it, by how
likely each is to lead to a goal, with a little randomness. Shots are judged by a scoring-chance estimate (distance,
angle, keeper position, bodies in the way, pressure, the shooter's finishing and power), so long shots only happen when
they're a genuine chance, mostly by good finishers. Off the ball, forwards stay onside on the shoulder of the last
defender, attack the near post, penalty spot and edge of the box rather than the keeper's area, and time runs in
behind. Volta keeps its previous attacking play. Keepers on both sides react 10% later to shots than before.

**Online modes:** Ranked, Friendly and Host / Join. Ranked and Friendly find a real opponent automatically (same match type
and pitch; Ranked by similar rating, widening the longer you wait; never an AI). Ten placement matches set your first rank
(Bronze → Silver → Gold → Platinum → Diamond → Champion → Legendary); after that wins earn Ranked Points and losses cost
them, by Elo, so beating a stronger player is worth more. Volta and Classical are ranked separately. Seasons are calendar
months: rewards for your best rank, then points move part of the way back to the middle. Leaving a Ranked match counts
as a loss. Friendly pays normal online coins (a quarter after 8 a day). Leaderboard tab (next to Online): every club is on it automatically and kept up to date; Global clubs and Ranked
(ordered by results only), with a read-only View Squad.

**Nickname and saving:** the first time the game opens it asks for a nickname (2–16 letters, numbers, spaces or
. _ - '), which is all you need to play; it's shown next to your club on the leaderboard, in View Squad, in matchmaking
and on the VS card online. Nicknames aren't identities: each install has a random internal id and each public club
profile a separate random id. Progress is always saved on the device (browser storage), which is lost if the browser's
data is cleared. SAVE YOUR ACCOUNT is optional: with an email and password, progress also saves automatically to a
locked copy and loads on any other device with the same email and password (it asks first if that device has progress
of its own, and won't overwrite a newer copy from another device without asking). There's no server of our own, so the
save is locked on the device (PBKDF2-SHA256 with 600,000 rounds, then AES-GCM) and the locked copy is kept as a retained
message on the public relays; the email and password never leave the device and never appear in anything public. Each
save is read back from the relays and opened before the game calls it saved. No email is sent, so there's no address
check and no password reset, and a public relay could clear a copy (anyone can also overwrite or delete retained
messages on a public relay, though not read them; the device puts its copy back), so the device's own save and the
save code under Club stay as backups. A proper account system (verified email, password reset, protected storage)
needs a backend such as Supabase or Firebase Auth.

**What needs a server:** matchmaking and the leaderboards run over the same free public relays as online play, with no
server of our own. Each club's rating lives in its own save, and leaderboard profiles are retained messages on public
relays: the game checks every profile it reads and nobody can change someone else's club, but a determined player could
publish a fake profile or edit their own save, and a relay may forget retained profiles. A proper, cheat-proof ladder
needs a small backend (a database plus an authoritative match-result service: e.g. a managed database like Supabase or
Firebase with server-side functions, or a small Node server) and a paid TURN relay for the strictest networks.

**To play:** open `sunday-kickabout.html` in Chrome, Safari or Edge.

## Editing

The game is split up so it's easier to work on:

- `src/index.html` – page layout and styles
- `src/js/1-data-menu.js` – original players, packs, cups, menus
- `src/js/1b-career.js` – the generated player database, upgrades, evolutions, leagues, World Club Championship, challenges, achievements, Club Legacy, exchanges, cosmetics and their screens
- `src/js/2-engine.js` – pitch sizes, camera, stadium, players, physics, AI
- `src/js/2b-penalties.js` – the penalty shoot-out
- `src/js/2c-online-plus.js` – Ranked/Friendly matchmaking, ranks, leaderboards, help and tutorial
- `src/js/2d-online-juice.js` – online-only impact effects (both laptops)
- `src/js/2e-account.js` – your name and the optional email login
- `src/js/3-draw-net.js` – HUD, screens, online play, main loop
- `vendor/` – PeerJS 1.5.4 and MQTT.js 5.10.1 (unchanged npm builds, used for online play)

After editing, rebuild the single file:

```bash
node build.mjs
```

`tools/smoke.cjs` is a quick headless check (needs Playwright): `node tools/smoke.cjs <screenshot-folder>`.
