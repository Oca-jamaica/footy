# Sunday Kickabout developer dashboard

A private web page for the game's developer. You run it yourself; it is never part of the game file and players never
see it.

## What it does

**See what's happening (all from real data):**

- **Players online now.** Every open copy of the game sends an encrypted heartbeat every 20 seconds. A player counts as
  online if one has arrived in the last minute. The dashboard shows their nickname, club, what they're doing (menus, a
  match against the computer, searching, a private lobby, an online match), mode, difficulty and game version.
- **Online matches in progress.** Both clubs, Ranked, Friendly or private, pitch, live score, clock, the joining
  player's ping and whether the connection is direct or through a relay.
- **Matchmaking queues.** Read straight from the public matchmaking channels: how many people are searching in each
  queue right now.
- **Private lobbies**, the **club directory** (the same data as the in-game leaderboard), and **recent online results**,
  which both laptops report so you can see when they agree.

**Act (each action needs a reason and a tick-box confirmation, and is written to the audit log):**

| Action | Who can do it | Password needed again |
|---|---|---|
| Post or remove an announcement (shown in every player's menu) | moderator, admin | no |
| Mark player reports and problem reports as reviewed, resolved and so on | moderator, admin | no |
| Suspend a club from online play (1–365 days), lift it, accept or reject an appeal | moderator, admin | yes, to suspend |
| Maintenance mode on or off (blocks new online matches; single-player is never affected) | admin | yes |
| Progression correction: add or remove a player's coins or Training Tokens | admin | yes |
| Look at everything (including the audit log) | viewer, moderator, admin | |

What players see:

- **Suspensions.** A suspended club can't search, host or join online. It sees the reason category and the end date,
  and can appeal from its Online tab. Other players' games hide it from matchmaking and the leaderboard.
- **Corrections.** These are applied once, by that player's own game, the next time it's online within 14 days. The
  player gets a message, and a removal never takes a balance below zero.

## How it's secured

- **The game file holds no secrets.** It carries only this server's two public keys (`public-keys.json`).
  - **Signed control.** Maintenance, announcements, suspensions and corrections go out as one control message, signed
    with the server's private ECDSA P-256 key. Every copy of the game checks the signature and ignores anything else.
  - **Replays and expiry.** Each message has an increasing number and an expiry, so an old genuine message can't be
    replayed over a newer one.
  - **Encrypted reports.** Heartbeats, results, reports and appeals are encrypted (ECDH P-256, HKDF-SHA256, AES-256-GCM)
    to the server's public key. Nobody else on the relays can read them.
- **Accounts.**
  - **Passwords.** These live only on the server, as scrypt hashes in `data/admins.json`.
  - **Authenticator codes.** These are optional (RFC 6238, works with any authenticator app), and each code works once.
  - **Lockouts.** 5 failed sign-ins from one address, or 10 for one account, lock sign-in for 15 minutes.
- **Sessions.**
  - **Cookies.** The session cookie is random, `HttpOnly` and `SameSite=Strict` (plus `Secure` over HTTPS). Sessions
    expire after 30 minutes idle or 8 hours.
  - **Every change is checked.** It must come from the dashboard's own page (origin check plus an anti-forgery token),
    and it must be JSON.
  - **Role changes apply at once.** Removing an account, changing its role or changing its password takes effect
    immediately.
- **Network.**
  - **Local by default.** The dashboard listens only on this computer (`127.0.0.1`) unless you give it HTTPS
    certificates, or tell it it's behind an HTTPS reverse proxy. It refuses to listen on a network address over plain
    HTTP.
  - **Strict page rules.** It sends strict security headers (a content security policy, no framing, no caching).
- **Audit log.** `data/audit.jsonl` only grows. Each line includes a hash of the previous line, and the dashboard shows
  whether the chain is intact.
- **Privacy.** Players' games never send an email, password, room code, IP address or location. The dashboard never
  shows the internal save link. Players can turn live status off in their profile.

## Setting it up

You need [Node.js](https://nodejs.org) 18 or newer, on any computer with internet access. The dashboard only makes
outgoing connections, to the same public relays the game uses, so it works from home behind a normal router.

1. Install the dependency:

   ```bash
   cd server
   npm install
   ```

2. Put the private keys in place. If you were given a `keys.json` alongside the game file, put it at
   `server/secrets/keys.json`. It must match `public-keys.json`, which is the pair already built into the game. To make
   your own instead, run this, then rebuild and re-share the game (step 5):

   ```bash
   node setup.js --force
   ```

   Keep `secrets/keys.json` private and backed up. Anyone with it could sign messages every copy of the game would obey.
   If it ever leaks, make new keys with the command above and share a newly built game.

3. Add yourself as an admin. It asks for a password of 12 or more characters:

   ```bash
   node admin-user.js add yourname admin
   ```

   Optionally, require an authenticator app:

   ```bash
   node admin-user.js totp yourname
   ```

   Other commands: `passwd`, `role`, `remove`, `list`, `totp-off`.

4. Start it, then open <http://127.0.0.1:8787> in your browser:

   ```bash
   npm start
   ```

5. If you made new keys, rebuild the game from the repository's root folder. This writes `sunday-kickabout.html` and
   `Sunday-Kickabout-Final.html` with the new public keys:

   ```bash
   node build.mjs
   ```

### Settings (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `PORT`, `HOST` | `8787`, `127.0.0.1` | Where the dashboard listens. Any other host needs HTTPS (below). |
| `TLS_CERT`, `TLS_KEY` | | Certificate and key files: serve the dashboard over HTTPS. |
| `TRUST_PROXY=1` | | Behind a reverse proxy that handles HTTPS (Caddy, nginx and so on). |
| `SECRETS_FILE` | `secrets/keys.json` | The private keys. |
| `DATA_DIR` | `data/` | Accounts, stored state and the audit log. |
| `RELAYS` | the game's five public relays | Comma-separated `wss://` URLs. |
| `MM_VERSION` | `6` | The game's online version (the matchmaking queues it watches). |

To use it from your phone or another computer, put it behind HTTPS. Either give it a certificate with `TLS_CERT` and
`TLS_KEY`, or run it behind a reverse proxy such as Caddy with `TRUST_PROXY=1`. Keep the authenticator code switched on.

## Limits to know about

- **No central game server.** The game has no central server, so everything travels over free public MQTT relays. If
  every relay is unreachable, the dashboard shows that on its Overview, and players' games keep working on their own.
- **Public club ids.** A modified copy of the game could send misleading heartbeats or reports. Encryption stops anyone
  reading or altering other people's messages, but not someone writing their own. Treat reports as leads, not proof.
  Corrections refuse to target a club that more than one save has claimed.
- **Client-side enforcement.** Suspensions and maintenance are enforced by every official copy of the game, and other
  players' games ignore a suspended club. Someone determined enough to edit their own copy of the game could get round
  it. A fully cheat-proof system needs an authoritative game server.
- **Delivery timing.** Corrections and suspensions reach a player the next time their game is online. While the dashboard
  is switched off, players keep the last signed message for up to 2 hours. After that, maintenance and announcements
  lapse, and a suspension stays on the suspended player's own device until it ends.
