# CanaleTV Online

Functional clone of `canaletvlive.online` (Romanian live-TV portal) built from
passive reverse-engineering captures under `reversed-engineered/`. Data seeds
live in `data/*.json`; the app serves them through `lib/store.ts`.

## Stream URL / token notes

Three upstream stream families:

| Family | URL shape | Token |
|---|---|---|
| `tv.playitforme.online` (74) | `https://tv.playitforme.online/api/proxy/{uuid}?token={13digit-ms}-{64hex-sha256}` | **Minted by upstream only** |
| `rd.playitforme.online` (8) | `https://rd.playitforme.online/api/ch/{slug}?vlc=1` | none (naked) |
| `arwen1.panaka1.cfd` (1) | origin `.htm` URL | none (naked) |

- The `tv.playitforme.online` token is a **server-side HMAC** over the proxy
  uuid. It **cannot be minted locally**: any locally fabricated `?token=` fails
  upstream validation and the proxy answers **403 forever**. The token baked
  into the `data/channels.json` seed is likewise stale and dies with 403.
- **Token minting is delegated to upstream for playback.**
  `lib/store.ts#getFreshStreamUrl(slug)` fetches the upstream bulk list
  `GET https://canaletvlive.online/api/channels` (3s timeout, cached 15s) and
  returns the tokenized `stream_url` for that slug. The watch page
  (`app/watch/[slug]/page.tsx`) and the bulk API (`app/api/channels/route.ts`)
  serve these fresh URLs; multistream does the same via
  `getChannelsWithFreshUrls()`.
- `GET /api/channels/{id|slug}` (single-channel endpoint) returns a **naked**
  `stream_url` (no `?token=`) by upstream API convention — playback never uses
  it. The real upstream watch page likewise plays the tokenized bulk URL from
  its SSR `streams` payload and full-page-reloads on a fatal HLS 403 to pick
  up a fresh token.
- `rd.playitforme.online` and `arwen1.panaka1.cfd` URLs are naked both upstream
  and locally, so they are served straight from the seed with no upstream call.

## Dev

```sh
npm run dev    # http://127.0.0.1:3000
```

Requires network access to `https://canaletvlive.online` for fresh stream
URLs; without it, playback URLs fall back to the (stale-token) seeds and
`tv.playitforme.online` streams will 403 until upstream is reachable again.
