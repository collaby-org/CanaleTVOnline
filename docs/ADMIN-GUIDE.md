# Admin Guide — CanaleTV Live (local reconstruction)

## 1. Running the app

| Mode | Commands | URL |
|---|---|---|
| **Dev** | `npm run dev` | http://localhost:3000 |
| **Prod** | `npm run build` then `npm start` | http://localhost:3000 |

The server listens on **port 3000** by default (Next.js default). No environment variables are required; the app is fully functional with zero config.

## 2. Stopping / starting

- **Dev (foreground):** press `Ctrl+C` in the terminal running `npm run dev`.
- **Dev (background, PowerShell):** start with `Start-Process npm -ArgumentList 'run','dev' -NoNewWindow -PassThru`; stop with `Stop-Process -Id <Pid>` (or `Get-Process node | Stop-Process` if you own all node processes).
- **Prod:** `npm run build` once, then `npm start` (foreground). Stop with `Ctrl+C`. Re-run `npm run build` after any code or data change before `npm start`.

## 3. Build troubleshooting

### `Error: Cannot find module './NNNN.js'`

A stale `.next` cache referencing deleted chunks (classic after dev-mode churn). Dev does not always invalidate it, so:

1. Stop the dev server (`Ctrl+C`).
2. Delete the build cache: `Remove-Item -Recurse -Force .next` (PowerShell) or `rm -rf .next`.
3. Restart with `npm run dev`.

If it recurs, also close any second dev/prod process bound to the same folder before restarting — two Next.js processes sharing `.next` corrupt each other.

Other quick checks:

- **Port in use:** another instance holds 3000. Stop it, or run `npm run dev -- -p 3001`.
- **Tailwind/CSS-looking classes missing:** the upstream CSS is served from `public/original.css` and mirrored by the local stylesheet. Verify the file exists and a hard-refresh (Ctrl+F5) after edits.
- **Streaming 403 on first load:** expected. The player reloads once with `?_nc=` to mint a fresh upstream token (see README “upstream-minted tokens”); a second 403 means the stream itself is down — switch servers or pick another channel.

## 4. How to add a channel

Catalog data lives in **`data/channels.json`** (a plain JSON array of 83 objects; the API joins category + current EPG at request time).

1. **Logo:** drop the logo file into **`public/logos/`** (e.g. `channel_1775000000000_my-channel.webp`). Reference it from the channel record the same way the existing 83 do:
   - New-style: `"logo": "/api/uploads/channel_1775000000000_my-channel.webp"`
   - Legacy (tvr1/tvr2 pattern): `"logo": "/uploads/channel_....webp"` — also resolves.
2. **Channel record fields** (copy an existing entry and edit):

   | Field | Meaning | Example |
   |---|---|---|
   | `id` | Unique integer id (`/api/channels/{id}` resolves) | `104` |
   | `name` | Display name | `"Digi 24 HD"` |
   | `slug` | URL-safe unique slug | `"digi-24-hd"` |
   | `logo` | `/api/uploads/<filename>` or legacy `/uploads/<filename>` | see above |
   | `stream_url` | Upstream HLS URL, pasted verbatim | `https://tv.playitforme.online/api/proxy/{uuid}?token=...` or naked `https://rd.playitforme.online/api/ch/{slug}?vlc=1` |
   | `category_id` | FK to `data/categories.json` (9=Generale, 1=Știri, 3=Sport, 4=Filme, 2=Divertisment, 5=Documentare, 6=Copii, 7=Muzică, 8=Internațional, 10=Religioase) | `1` |
   | `description` | Romanian SEO blurb (shown on canal/watch pages) | `…` |
   | `country` / `language` | Fixed `RO` / `ro` | — |
   | `is_active` | `1` to list | `1` |
   | `is_featured` | `1` to appear in `?featured=1` (6 channels) & hero rotation | `0` |
   | `sort_order`, `views`, `status`, `last_checked`, `created_at`, `epg_id` | Ordering, view counts, liveness, audit fields — copy & tweak | — |
   | `category_name`, `category_slug`, `category_icon`, `category_color` | Denormalized copy of the category (kept in sync manually) | `"Știri","stiri","📰","#ef4444"` |
   | `epg_title`, `start_time`, `end_time` | Current programme snapshot (drives `now-on-tv`) | `"Știrile Pro TV"` |

3. **Rebuild/restart:** `npm run build` + `npm start` (prod) or restart `npm run dev`. There is no live reload into the JSON for the prod build — a rebuild is required.

Tip: for a `playitforme` channel, the `?token=` in the seed goes stale constantly; the player’s `?_nc=` reload protocol (Section 9) re-fetches a fresh one from the bulk endpoint. You only need the naked `proxy/{uuid}` base.

## 5. How to refresh the EPG

- **Seed titles come from `data/epg-channel3.json`** (ProTV day schedule, 9 items, captured 2026-11-04). The `/api/epg?channel_id=` handler serves these titles.
- **Rolling synthesis limits:** the clone does **not** re-synthesize the upstream EPG. `epg_title`/`start_time`/`end_time` in `data/channels.json` are what `now-on-tv` and the bulk list expose, and `/api/epg` (bare, 40 items) is the grid subset used by `/ghid-tv`. Rolling forward beyond the captured day requires re-capturing `data/epg-channel3.json` (and patching `epg_title`/`start_time`/`end_time` in `data/channels.json`) — there is no automatic updater.
- Refresh procedure: fetch `GET https://canaletvlive.online/api/epg?channel_id=3`, save as `data/epg-channel3.json`, update the 83 `epg_*` snapshots, rebuild.

## 6. Rate-limit / push / watchlist — in-memory (reset on restart)

These three subsystems have **no database**; state lives in per-process memory and **resets on every restart**:

- **Shoutbox rate limit:** POST spam → `429 Prea multe mesaje! Așteaptă un minut. / Too many messages!`. Restarting clears the per-IP/user counters.
- **Web Push (`/api/push`):** subscriptions are stored in an in-memory `Map` (endpoint → subscription JSON). Restarting drops all subscriptions.
- **Watchlist (`/api/watchlist`):** `{added: bool}` reflects an in-memory set of pinned program ids (mirrored client-side in `wl_pinned`). Restarting clears server-side state.

Consequence: run a single instance in production. Behind multiple replicas, rate limits, push, and watchlist will not be shared. Persist them if you ever scale out.

## 7. localStorage keys catalog

All client state is per-browser (no accounts). Write/read with `localStorage.getItem/setItem`:

| Key | Purpose |
|---|---|
| `tv_favorites` | Array of favorited channel ids/slugs (❤️ on watch/home) |
| `tv_streak` | `{count, lastDate}` — daily streak (💎≥100 🥇≥30 🥈≥7 🥉≥3) |
| `tv_recently_watched` | Recently watched channel list (drives “For You”) |
| `tv_recent_searches` | Recent search terms (debounced 280ms, min 2 chars) |
| `rating_{id}` | User’s stars for channel `{id}` (0–5) |
| `wl_pinned` | Set of pinned watchlist program ids |
| `shoutbox_username` / `shoutbox_color` | Chat identity (username max 20 chars, `<`/`>` stripped; color from 10-palette) |
| `poll_vote_{slug}` | User’s poll vote (`good\|meh\|bad`) per channel slug |
| `cmp_consent_v2` | Cookie-consent prefs `{analytics, ads, personalization, functionality}` |
| `pwa_banner_dismissed` | PWA install banner dismissed (`1`) |
| `push_subscribed` | Push opt-in flag (mirrors the in-memory `/api/push` state) |
| `dismissed_announcements` | Dismissed announcement ids (banner) |
| `theme` / `theme_manual` | Forced dark (`data-theme="dark"` + `theme='dark'`); `theme_manual` is removed by the forced-dark script |
| `tv_lang` | UI language (`ro`/`en`, default `ro`) via LangProvider |

`sessionStorage` (per-tab, not localStorage): `ptv_reload_{id}` — one-shot `?_nc=` reload guard (see Section 9).

## 8. Deploy notes

- **Single instance only** (see Section 6). A plain `npm run build && npm start` on one host is the supported topology.
- **Static assets:** `public/` (icons, `favicon.svg`, `manifest.json`, `sw.js`, `original.css`, `logos/`) is served verbatim. The service worker is intentionally “zero-cache” (install `skipWaiting`, activate deletes all caches + `clients.claim`, no fetch handler; push → `showNotification`).
- **Headers** (from `next.config.mjs`): `cache-control: no-store, no-cache, must-revalidate`, `x-frame-options: SAMEORIGIN`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`. Keep them unless you explicitly want caching.
- **Upstream dependency:** playback and fresh tokens come from `tv.playitforme.online` / `rd.playitforme.online` / `arwen1.panaka1.cfd`. If those hosts are unreachable, pages render but streams fail. There is no self-hosted fallback.
- **PWA:** `manifest.json` name “CanaleTV PRO - TV Online Gratis”, `start_url: "/"`, `display: standalone`, icons `/icons/icon-192.png` + `/icons/icon-512.png` (maskable), theme `#10b981`, bg `#08090c`.

## 9. Stream recovery protocol (reference)

Player logic, for support context:

1. Playback uses the tokenized bulk URL from SSR flight data (fresh upstream token).
2. Fatal HLS `403 NETFORN_ERROR` → full page reload with `?_nc={Date.now()}` **once per session** (`sessionStorage ptv_reload_{id}`), re-fetching a fresh token.
3. Other fatal `NETWORK_ERROR` → `hls.startLoad()` retry (no reload).
4. Media errors → `hls.recoverMediaError()`.
5. Safari/non-HLS browsers → native `video.src` fallback; failure shows the error overlay (“Browserul nu suportă HLS.”).
