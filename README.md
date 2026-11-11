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
**The joining player's controls feel immediate:** their own passes and shots are shown on their screen the instant they
press (the host still does the real kick and the ball blends into it), the host sends the match every frame on a direct
link (about 1 KB a frame), and the joining laptop keeps only a small smoothing buffer when updates arrive steadily.
Measured in two browsers with 40 ms of delay added each way: the joining player's pass shows on their screen in ~9 ms
(was ~150 ms), and the host's moves arrive after the network delay plus ~25-40 ms. Press N in a match to see whether
you're on a direct link or a relay; a relay is slower, so the game always tries the direct link first.
**Skill moves and lunges for the joining player:** skill moves and the R burst start on the joining player's own screen
the instant they're pressed, with exactly the host's footwork (the host still decides who they beat); a skill pressed
just before a pass arrives is held for up to 0.3 s and done when the ball is at your feet (for both players). The
joining player sees the host's match a little in the past, so their lunges and slides are judged on the host against
what their screen showed at that moment (the host keeps a short history of the ball and the carrier and rewinds up to
0.45 s); the carrier's body is rewound too, so going through the back of a man who's already past still fails, just as
it does for the host. Measured in two browsers with 60 ms added each way (a 166 ms round trip): the joining player's
skill now shows on their own screen in ~17 ms (was ~168 ms); lunges on a sprinting carrier win 10/10 for both players
(the joining player's used to win 0 of 8); late lunges fail 0/10 for both; with 100 ms each way, sprinting-carrier
lunges are 10/10 for both and late ones 0/10 for both.
Online matches add their own punch on both laptops (camera punches, speed lines, slam-in calls like WHAT A SAVE! and
EQUALISER!, stadium strobes and confetti) and a VS card with both clubs and managers before kick-off. These only change
what's drawn; online, ON FIRE is for show for both players and gives no boost. A match only starts once
the joining laptop has loaded the same match, its presses are reaching the host and it is receiving the host's updates.
Connections: a direct WebRTC link (PeerJS's public signalling, with Google STUN and PeerJS's public TURN relay for strict
routers) and public MQTT relays over secure websockets, all tried at once; the freshest route carries the match. If the
connection really drops, both screens pause and restart together. After the final whistle both stay in the room for a
rematch. Press N during an online match for connection details.

Each mode has its own six-division league (Amateur, Division 3, 2, 1, Legendary, Icon: 10 clubs, 9 rounds (everyone plays everyone once), top 3 up, bottom 3 down)
and its own World Club Championship (64-club knockout, earned with a top-3 finish). Coins, players, upgrades and cosmetics are shared.
The **Icon Division** is reached with a top-3 finish in the Legendary Division.

**Prizes by division** (fixed coins, each paid once when reached, the same on every pitch: no pitch or difficulty
multiplier). The World Club Championship pays for reaching each round and for winning it, using the same proportions of
the winning prize in every division (4% / 10% / 16% / 24% / 45%); the Sunday Cup pays its winning prize on top of its
small round bonuses. The division is your league division in that mode while the competition is played.

| Division | WCC: Round of 32 | Round of 16 | Quarter-finals | Semi-finals | Final | **Winning** | Sunday Cup winning |
|---|---:|---:|---:|---:|---:|---:|---:|
| Amateur | 1,000 | 2,500 | 4,000 | 6,000 | 11,250 | **25,000** | 1,500 |
| Division 3 | 1,000 | 2,500 | 4,000 | 6,000 | 11,250 | **25,000** | 3,000 |
| Division 2 | 2,000 | 5,000 | 8,000 | 12,000 | 22,500 | **50,000** | 7,000 |
| Division 1 | 3,400 | 8,500 | 13,600 | 20,400 | 38,250 | **85,000** | 12,000 |
| Legendary | 5,000 | 12,500 | 20,000 | 30,000 | 56,250 | **125,000** | 20,000 |
| Icon | 8,000 | 20,000 | 32,000 | 48,000 | 90,000 | **200,000** | 30,000 |

**League wins** pay 100% more (double) in each division up: the win pay (base plus goals, with the usual pitch and
difficulty multipliers) is ×1 in the Amateur Division, ×2 in Division 3, ×4, ×8, ×16 in the Legendary Division and ×32
in the Icon Division. Draws and defeats pay the same everywhere. A **ranked online win**'s base pay is 1,000 coins (friendly
and private online wins 60).

**Icon Cup**, the endgame tournament: its tab sits next to the Sunday Cup and the World Club Championship from the start,
locked (a quiet tab with a padlock; clicking it shows "Icon Cup Locked — Unlock after winning Icon Division", the
500,000-coin prize, the format and how far you are along the path). It unlocks only when you **win the Icon Division
title** (finish 1st; 2nd or 3rd doesn't count), separately for Volta and Classical, and stays unlocked for good: the unlock
(`club.iconCup[mode]`) is written once and nothing clears it (relegation, a new season, losing or winning the cup).
Unlocked, the tab turns platinum and gold with a soft glow and an UNLOCKED badge until you first open it. You play
short-handed against 99-rated Icon sides at the hardest AI level, whatever difficulty you've chosen: **Volta 3 v 5** and
**Classical 4 v 9** (your keeper plus your two or three highest-rated players from the line-up). Sixteen clubs, knockout
(Round of 16, quarter-finals, semi-finals, final; level games go to penalties). Winning the final pays **500,000 coins**,
once per tournament, every time you win the whole thing; then a new draw starts.

**Transfer market** (Club → Transfer Market): **Browse Market** shows players other managers are selling (name, rarity,
rating, position, level, all seven stats with their development, price, seller, time left) with filters for price,
rarity and rating; **My Listings** lets you change a price or cancel; **Sell Players** lists a player at your own price
(100 to 10,000,000 coins, for three days) or sells him **instantly to the game for 50% of his original purchase price**.
Every action asks for confirmation. A listed player is locked: out of your line-ups, can't play, be developed or be
sold again until he's sold, cancelled or the listing ends. Buying takes the coins into escrow at once; they come back if
the purchase is refused.

*Original purchase price* is the price of the pack the player was signed from, recorded when you sign him: an Icon
from the 50,000-coin Icon Pack sells instantly for 25,000; a player from the 5,000-coin Premium Gold Pack for 2,500;
from the 2,000-coin Gold Pack for 1,000. Players who didn't come from a pack (your starters, rewards, anyone signed
before this version) count at their rarity's own pack price (Bronze 250, Silver 750, Gold 2,000, Special 12,500, Icon
50,000). The original price travels with the player when he's sold on the market, so a player bought for 200,000 coins
still sells to the game for half his *pack* price, never half the 200,000: buying on the market and selling back to the
game can't create coins. Your created player and Wes can't be sold.

How each transaction is validated: the developer's dashboard server (`server/lib/market.js`) is the market's referee,
and the game only acts on its results, which are signed with the server's private key (the game ignores anything
unsigned or forged; tested). Requests travel encrypted to the server. Each save has a random market secret (only its
hash is used as an id), so only that save can list, re-price, cancel or buy as itself. The server applies requests one at
a time and checks: the request is new (each has a random id and happens once, however many relays deliver it, and
replays are refused); no more than 30 requests a minute; the club isn't suspended; a sensible price (whole coins, 100 to
10,000,000); at most 10 listings per save and the same player can't be listed twice; only the seller can re-price or
cancel, and only while the listing is active; a buy must match the current price exactly (a price changed meanwhile is
refused, not charged), can't be your own listing (same save or same club), and only the first valid buy wins: every
other buyer is refused and refunded, so a player is never sold twice or duplicated. Requests a save is still waiting on
are checked after a few seconds: any the server never received are voided for good (so they can't apply late) and the
coins come back. Listings expire after three days. Sales, cancellations and moderator removals go in the dashboard's
audit log; moderators can take a listing down from the dashboard's Transfer market tab (the player goes back). On each
device, a player bought arrives with his development checked against the game's own limits. Because the game has no
central account server, coins and squads live on each device: the game itself refuses to list a player you don't own
or to buy without the coins, but a deliberately modified copy of the game could still cheat its own balance. The
market only opens while the developer's dashboard server is running (the game shows *Market open* / *closed*);
instant sales always work.

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
5,000 / 10,000 / 20,000 / 35,000 coins plus 1 Club Token per level. Scouting has nine levels: 5,000 / 10,000 / 15,000 /
20,000 / 25,000 / 30,000 / 35,000 / 40,000 coins plus 1 Club Token each (180,000 coins and 8 tokens in all); a club
already at Scouting level 5 keeps it and carries on to 9.


**Through Ball (special):** the very first version's Through Ball (commit `7d282e9`) with two changes. It's lofted over
everyone, lands after one second (60 frames, peak height 110) and goes to the team-mate nearest where it lands. Change
1: it lands just outside the opponent's penalty area, 10 px beyond the box line in line with the goal, instead of on the
penalty spot (Volta 185 px from goal instead of 135; Classical Standard 250 instead of 150; Classical Expanded 310
instead of 165), whichever way you're attacking. Change 2: the runner gets no speed boost. The first version gave him a
turbo burst, 1.5× top speed and faster acceleration (about 2.1× his normal speed); now he runs at his own pace like any
other player. Defending stays fair: nobody can take it while it's above their reach, a slide only works once it's at
the grass, a defender who gets there first can win it, and keepers behave as before. The offside check added later
isn't part of the first version, so it's off (`THROUGH_OFFSIDE` in `src/js/2-engine.js` turns it back on). Cooldowns
are unchanged: 25 s at level 1 down to 7 s at level 10, 10 levels, same coin prices, 2 Training Tokens per level.

**Computer's attack (Classical pitches):** the ball carrier weighs shooting, passing (to feet, into a runner's stride,
across goal, switches, long balls, crosses), dribbling into the most open lane, taking a man on, or keeping it, by how
likely each is to lead to a goal, with a little randomness. Shots are judged by a scoring-chance estimate (distance,
angle, keeper position, bodies in the way, pressure, the shooter's finishing and power), so long shots only happen when
they're a genuine chance, mostly by good finishers. Off the ball, forwards stay onside on the shoulder of the last
defender, attack the near post, penalty spot and edge of the box rather than the keeper's area, and time runs in
behind. Volta keeps its previous attacking play. Keepers on both sides react 10% later to shots than before. On
**Extreme** only, the computer's keeper is about 5–10% weaker (slightly slower to react, slightly less sure at full
stretch and in one-on-ones, and a little more likely to spill a hard shot); measured on a fixed set of shots, about 3
more goals in every 100 than before, and still clearly harder than Hard.

**Extreme** is for veterans: whoever the opponent is, even a poor side, their outfield players play at (nearly) the top
level, every opponent rating is lifted to a high floor and then +12 (past 99 if need be), and Volta Extreme is as hard
as Classical Extreme (the difficulty test holds Volta to the same goal target). Their goalkeeper stays at the
opponent's own level, so the slightly weaker Extreme keeper from before is kept. Above Chill, weak teams are lifted a
little (level and ratings), so they're still a game. **Offside** is only called for clear goal-hanging: a Through Ball, or a long ball crossed from far away (over about
420 px), to a team-mate who is well beyond the last defender (110 px or more) with no defender within 200 px of him. The
flag goes up and the defending side gets the ball. Normal runs and crosses into the box are never offside.
**Crosses (F)** are no longer a free header: as a cross drops, a defender who has got near it can head it clear (more
often the closer he is than the striker, and the better he defends), long crosses are a little less exact, and
keepers claim a few more. Measured with one defender marking the striker: the striker won 27-30 of 30 crosses before,
13-18 of 30 now; unmarked strikers still get them.
**Tap-ins:** close in, in front of goal, the aim is kept inside
the posts and the strike is steadier (and a first-time finish there isn't treated as rushed), so a striker no longer
sidefoots a tap-in wide; the computer gets this on Hard and Extreme only.

**Chill and Medium** are much easier than before, by how the computer plays, never by slowing your footballers: on
Chill it presses less and later, keeps its distance, rarely tackles or slides, gets caught out by passes, passes and
shoots less accurately, makes slower and messier decisions and its keeper is less sharp; Medium does the same to a
lesser degree. Hard and Extreme are unchanged. `tools/difficulty.cjs` plays a casual test player against every mode and
level and checks the results against the targets in `tools/difficulty-targets.json` (for example: on Chill the computer
scores at most 1.4 goals a match and on average doesn't outscore you; each level is harder than the one below).

**Ratings past 99:** there's no 99 cap any more. Each footballer can be developed up to his own maximum potential
(for example Messi 106, Ronaldo 105, Pelé 104), shown on cards and screens as three digits, with **MAX POTENTIAL
REACHED** once there's nothing left to gain. Costs are unchanged, ratings over 99 really do play better (online too:
the other laptop gets your developed stats, checked against what's achievable), and existing saves carry on as they were.

**Scouting** (Club Development) now raises the chance of a top-rated footballer *within* the rarity a pack gives, never
the rarity itself: the chance of a card from the top quarter of that rarity's ratings goes up by 0 / 10 / 20 / 30 / 40 /
50 / 65 / 75 / 90% of itself at levels 1–9, a relative increase (a 10% chance becomes 19% at level 9, not 100%) (the rest of the rarity shares the remainder, so every pack's odds still add up to 100%). Pack
rarity odds, guaranteed rarities and Icon chances are exactly as printed, and every card is a real database player at
its real rating. `tools/scouting.cjs` checks all of this by simulation.

**Hard and Extreme goalkeepers** (the opposition's, offline) are a little more human: a slightly later reaction, a
slightly worse read of where a shot is going, a slower dive with a little less stretch at full extension. Measured with
`tools/keepers.cjs` (placed shots from three set spots, 1,800-3,000 shots per setting), Hard keepers save about 15-20%
fewer shots than before (Volta 55.7% -> 45.8% of placed shots, Classical 40.2% -> 33.4%, Expanded 30.8% -> 25.4%) and
Extreme keepers about 20-25% fewer (Volta 73.1% -> 56.2%, Classical 58.5% -> 45.0%, Expanded 47.6% -> 37.2%), and
Extreme keepers are still the tougher on every pitch. Chill and Medium keepers, your own keeper, online keepers, the
sweeper-keeper behaviour and the Icon Cup's keepers are unchanged.

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

**Release reset:** this release starts everyone from scratch. A save from the test versions (anything without the
release stamp) isn't loaded: the club starts fresh with a nickname prompt, starter squad and no ranks (the old save is
set aside in the browser under `kickabout-club-test-version`, not used). Old save codes and old cloud-account copies are
refused, the leaderboard is a fresh board, and online play uses a new version number (6), so a test-version copy can't
play the release (both screens say you need the same game file). `SAVE_EPOCH` in `src/js/1-data-menu.js` is the stamp:
raise it to reset everyone again in a future release.

**Keep-progress copy:** `KEEP_SAVES=1 OUT=Sunday-Kickabout-Keep-Progress.html node build.mjs` builds the same game with
the reset switched off. It loads test-version saves, save codes and cloud copies as they are. If the release copy already
set a test-version save aside in that browser, the keep-progress copy puts it back once (keeping the release club
aside under `kickabout-club-release-version`). It plays online with the release copy.

**AI dribbling:** the computer's ball carrier only tries skill moves and side-steps when he's facing forward (and seldom
in his own half), and when shielding he never runs back towards his own goal. Measured with you pressing: time spent
running backwards with the ball 21-23% -> 7-12%, forward progress roughly doubled on the Classical pitches.

**To play:** open `Sunday-Kickabout-Final.html` (or `sunday-kickabout.html`, the same file) in Chrome, Safari,
Edge or Firefox. It's the complete game in one file: send it to friends and they can play offline straight away and
online against each other over the internet. If the online services can't be reached (no internet, or a network that
blocks them) the game says so after about 12 seconds and keeps trying; single-player always works.

**Developer dashboard** (`server/`, see `server/README.md`): a private web page you run yourself that shows who is
playing right now (from real heartbeats), online matches with live scores, matchmaking queues, private lobbies, clubs and
recent results, and lets you post announcements, pause online play for maintenance, handle player reports, problem
reports and appeals, suspend clubs from online play and correct a player's coins or Training Tokens. Every action needs
a confirmation and a reason and goes in a tamper-evident audit log; accounts have roles (viewer, moderator, admin),
passwords are stored as scrypt hashes, and an authenticator app can be required. The game file contains only the
dashboard's two **public** keys: the game obeys only control messages signed with the dashboard's private key, and
encrypts what it sends so only the dashboard can read it. No password, secret or admin feature is in the game file.
Players can switch live status off in their profile.

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
- `src/js/2f-ops.js` – the game's side of the developer dashboard (signed control messages, encrypted live status, reports)
- `src/js/3-draw-net.js` – HUD, screens, online play, main loop
- `server/` – the private developer dashboard (not part of the game file)
- `vendor/` – PeerJS 1.5.4 and MQTT.js 5.10.1 (unchanged npm builds, used for online play)

After editing, rebuild the single file (it writes `sunday-kickabout.html` and `Sunday-Kickabout-Final.html`, with
the dashboard's public keys from `server/public-keys.json`):

```bash
node build.mjs
```

Checks (need Playwright): `node tools/smoke.cjs <screenshot-folder>` (quick headless run), `node tools/difficulty.cjs`
(difficulty targets), `node tools/scouting.cjs` (scouting odds), `node tools/keepers.cjs` (goalkeeper save rates).
