// Data layer — loads local JSON seeds copied from reversed-engineered captures.
// All EPG data is SYNTHESIZED (rolling): today's schedule is rebuilt around
// Date.now() on every read, so current/next programmes are always live.

import channelsData from '../data/channels.json';
import categoriesData from '../data/categories.json';
import blogPostsFull from '../data/blog-posts-full.json';
import epgChannel3 from '../data/epg-channel3.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Channel {
  id: number;
  name: string;
  slug: string;
  logo: string;
  stream_url: string;
  category_id: number;
  description: string;
  country: string;
  language: string;
  is_active: number;
  is_featured: number;
  sort_order: number;
  views: number;
  status: string;
  last_checked: string;
  created_at: string;
  epg_id: string;
  category_name: string;
  category_slug: string;
  category_icon: string;
  category_color: string;
  epg_title: string;
  start_time: string;
  end_time: string;
}

export type ChannelWithoutEpg = Omit<Channel, 'epg_title' | 'start_time' | 'end_time'>;

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  channel_count: number;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  cover_image: string;
  category: string;
  tags: string;
  author: string;
  status?: string;
  views: number;
  published_at: string;
  created_at: string;
  updated_at?: string;
}

export interface EpgEntry {
  id: number;
  channel_id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  category: string;
  created_at: string;
  channel_name: string;
  channel_slug: string;
}

// ---------------------------------------------------------------------------
// Raw seeds
// ---------------------------------------------------------------------------

/** Rewrite upstream logo paths (/api/uploads/… or /uploads/…) to local /logos/{basename}. */
function localLogo(logo: string): string {
  if (!logo) return logo;
  if (logo.startsWith('/logos/')) return logo;
  const base = logo.split('/').pop() || logo;
  return `/logos/${base}`;
}

export const channels: Channel[] = (channelsData as Channel[]).map((c) => ({
  ...c,
  logo: localLogo(c.logo),
}));

export const categories: Category[] = (categoriesData as Category[]).slice();

export const blogPosts: Record<string, BlogPost> =
  blogPostsFull as Record<string, BlogPost>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripToken(url: string): string {
  const i = url.indexOf('?token=');
  if (i !== -1) return url.slice(0, i);
  const j = url.indexOf('&token=');
  if (j !== -1) return url.slice(0, j);
  return url;
}

function findChannel(slugOrId: string | number): Channel | undefined {
  const s = String(slugOrId);
  const n = Number(slugOrId);
  return channels.find((c) => c.slug === s || c.id === n);
}

// ---------------------------------------------------------------------------
// Upstream stream-URL delegation (token minting)
// ---------------------------------------------------------------------------
//
// Root cause of permanent 403s: the old bulk route minted LOCAL fake
// `?token={13digit-ms}-{64hex}` values and appended them to the seed
// `tv.playitforme.online/api/proxy/{uuid}` URLs. Upstream validates that
// token as a server-side HMAC over the proxy uuid, so every fake token is
// rejected — and the stale token already baked into the seed URL is rejected
// too once it expires. Minting tokens locally can never work.
//
// Upstream exposes the minted credentials in two shapes:
// - Bulk    GET https://canaletvlive.online/api/channels
//           → bare JSON array of 83 channels; the tv.playitforme.online
//           stream_url entries are tokenized
//           `.../api/proxy/{uuid}?token={13digit-ms}-{64hex-sha256}`,
//           freshly minted on every call.
// - Single  GET https://canaletvlive.online/api/channels/{slug}
//           → stream_url WITHOUT ?token= (naked). The real watch page never
//           plays this: its SSR `streams` come from the tokenized bulk URL
//           (see reversed-engineered notes §4a). The single endpoint is
//           naked by API convention.
// So for playback we delegate minting to upstream and take the bulk URL.
// rd.playitforme.online + arwen1.panaka1.cfd URLs are naked in the bulk
// response too (identical to the seeds), so they are served straight from
// the local list with no upstream call.

const UPSTREAM_CHANNELS_URL = 'https://canaletvlive.online/api/channels';
const UPSTREAM_BULK_TTL_MS = 15000;

interface UpstreamChannel {
  id?: number;
  slug?: string;
  stream_url?: string;
  epg_title?: string;
  start_time?: string;
  end_time?: string;
}

let upstreamBulkCache: { at: number; items: UpstreamChannel[] } | null = null;

/**
 * Fetch the upstream bulk channel list (cached 15s, 3s timeout, catch).
 * On failure returns the stale cache if any, else null.
 */
async function loadUpstreamChannels(): Promise<UpstreamChannel[] | null> {
  const now = Date.now();
  if (upstreamBulkCache && now - upstreamBulkCache.at < UPSTREAM_BULK_TTL_MS) {
    return upstreamBulkCache.items;
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    // cache:'no-store' bypasses the Next Data Cache (a cached body would
    // serve a minutes-old upstream token); `_nc=` mirrors upstream's own
    // 403-reload pattern and defeats edge caching of the bulk JSON.
    const res = await fetch(`${UPSTREAM_CHANNELS_URL}?_nc=${Date.now()}`, {
      cache: 'no-store',
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return upstreamBulkCache?.items ?? null;
    const data = (await res.json()) as UpstreamChannel[] | { items?: unknown };
    const items = (Array.isArray(data) ? data : data?.items) as
      | UpstreamChannel[]
      | undefined;
    if (!Array.isArray(items) || items.length === 0) {
      return upstreamBulkCache?.items ?? null;
    }
    upstreamBulkCache = { at: now, items };
    return items;
  } catch {
    return upstreamBulkCache?.items ?? null;
  }
}

function isTvProxyUrl(url: string): boolean {
  return url.includes('tv.playitforme.online');
}

/**
 * Fresh, upstream-minted stream URL for playback.
 * - tv.playitforme.online → upstream bulk stream_url (tokenized, HMAC-valid)
 * - rd.playitforme.online / arwen1.panaka1 → seed URL direct (naked upstream too)
 * - unknown slug / upstream failure → null (caller falls back to seed)
 */
export async function getFreshStreamUrl(
  slug: string | number
): Promise<string | null> {
  const ch = findChannel(slug);
  if (!ch) return null;
  if (!isTvProxyUrl(ch.stream_url)) return ch.stream_url;
  const items = await loadUpstreamChannels();
  if (!items) return null;
  const up = items.find((c) => c.slug === ch.slug || c.id === ch.id);
  return up?.stream_url || null;
}

/**
 * Seed channels with stream_url + epg fields merged from the upstream bulk
 * response (matched by slug, then id). Falls back to the seed list on
 * upstream failure.
 */
export async function getChannelsWithFreshUrls(): Promise<Channel[]> {
  const items = await loadUpstreamChannels();
  if (!items) return channels;
  const bySlug = new Map<string, UpstreamChannel>(
    items.filter((i) => i.slug).map((i) => [i.slug as string, i])
  );
  const byId = new Map<number, UpstreamChannel>(
    items.filter((i) => typeof i.id === 'number').map((i) => [i.id as number, i])
  );
  return channels.map((c) => {
    const up = bySlug.get(c.slug) ?? byId.get(c.id);
    if (!up) return c;
    return {
      ...c,
      stream_url: up.stream_url || c.stream_url,
      epg_title: up.epg_title || c.epg_title,
      start_time: up.start_time || c.start_time,
      end_time: up.end_time || c.end_time,
    };
  });
}

// ---------------------------------------------------------------------------
// Channel accessors
// ---------------------------------------------------------------------------

/**
 * Single channel WITHOUT epg fields and WITHOUT ?token= in stream_url.
 * Increments views (matches upstream "single endpoint increments views").
 */
export function getChannel(slugOrId: string | number): ChannelWithoutEpg | null {
  const ch = findChannel(slugOrId);
  if (!ch) return null;
  ch.views = ch.views + 1;
  const { epg_title: _t, start_time: _s, end_time: _e, ...rest } = ch;
  return { ...rest, logo: localLogo(rest.logo), stream_url: stripToken(ch.stream_url) };
}

/**
 * Single channel INCLUDING epg_title/start_time/end_time taken from the
 * rolling (synthesized) current programme.
 */
export function getChannelWithEpg(slugOrId: string | number): Channel | null {
  const ch = findChannel(slugOrId);
  if (!ch) return null;
  const cur = getCurrentEpg(ch.id);
  return {
    ...ch,
    logo: localLogo(ch.logo),
    epg_title: cur ? cur.title : ch.epg_title,
    start_time: cur ? cur.start_time : ch.start_time,
    end_time: cur ? cur.end_time : ch.end_time,
  };
}

// ---------------------------------------------------------------------------
// Rolling EPG synthesis
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** start of "today" (UTC midnight) as epoch ms */
function dayStartMs(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

function createdAt(now: number): string {
  return iso(now).replace('T', ' ').slice(0, 19);
}

/** Duration (ms) of an upstream epg-channel3 entry. */
function templateDuration(e: { start_time: string; end_time: string }): number {
  const d = new Date(e.end_time).getTime() - new Date(e.start_time).getTime();
  return d > 0 ? d : HOUR_MS;
}

/**
 * Build today's schedule for a channel.
 * - protv (id 3): loop the real epg-channel3 programmes (titles/durations)
 *   continuously from today 00:00 UTC until 24:00.
 * - every other channel: hourly blocks titled "Programul zilei — {name}".
 */
export function getDayEpg(channelId: string | number): EpgEntry[] {
  const ch = findChannel(channelId);
  if (!ch) return [];
  const now = Date.now();
  const start0 = dayStartMs(now);
  const end0 = start0 + DAY_MS;
  const entries: EpgEntry[] = [];
  let n = 0;

  if (ch.id === 3 && (epgChannel3 as EpgEntry[]).length > 0) {
    const tpl = epgChannel3 as EpgEntry[];
    let cursor = start0;
    let idx = 0;
    while (cursor < end0) {
      const t = tpl[idx % tpl.length];
      const dur = templateDuration(t);
      const s = cursor;
      const e = cursor + dur;
      entries.push({
        id: ch.id * 100000 + n++,
        channel_id: ch.id,
        title: t.title,
        description: t.description || '',
        start_time: iso(s),
        end_time: iso(e),
        category: t.category || '',
        created_at: createdAt(now),
        channel_name: ch.name,
        channel_slug: ch.slug,
      });
      cursor = e;
      idx++;
    }
  } else {
    for (let h = 0; h < 24; h++) {
      const s = start0 + h * HOUR_MS;
      entries.push({
        id: ch.id * 100000 + n++,
        channel_id: ch.id,
        title: `Programul zilei — ${ch.name}`,
        description: '',
        start_time: iso(s),
        end_time: iso(s + HOUR_MS),
        category: '',
        created_at: createdAt(now),
        channel_name: ch.name,
        channel_slug: ch.slug,
      });
    }
  }

  return entries;
}

/** Programme on air right now for a channel (rolling). */
export function getCurrentEpg(channelId: string | number): EpgEntry | null {
  const day = getDayEpg(channelId);
  if (day.length === 0) return null;
  const now = Date.now();
  const cur =
    day.find((e) => new Date(e.start_time).getTime() <= now && now < new Date(e.end_time).getTime()) ||
    day[day.length - 1];
  return cur;
}

/** Next programme after the one currently on air. */
export function getNextEpg(channelId: string | number): EpgEntry | null {
  const day = getDayEpg(channelId);
  if (day.length === 0) return null;
  const now = Date.now();
  return day.find((e) => new Date(e.start_time).getTime() > now) || null;
}

// ---------------------------------------------------------------------------
// Now / Top
// ---------------------------------------------------------------------------

export interface NowOnTvItem {
  id: number;
  name: string;
  slug: string;
  logo: string;
  views: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  epg_title: string;
  start_time: string;
  end_time: string;
}

export interface TopLiveItem extends NowOnTvItem {
  status: string;
}

function toNowItem(ch: Channel): NowOnTvItem {
  const cur = getCurrentEpg(ch.id);
  return {
    id: ch.id,
    name: ch.name,
    slug: ch.slug,
    logo: localLogo(ch.logo),
    views: ch.views,
    category_name: ch.category_name,
    category_color: ch.category_color,
    category_icon: ch.category_icon,
    epg_title: cur ? cur.title : ch.epg_title,
    start_time: cur ? cur.start_time : ch.start_time,
    end_time: cur ? cur.end_time : ch.end_time,
  };
}

export function getNowOnTv(): NowOnTvItem[] {
  return channels.map(toNowItem);
}

export function getTopLive(): TopLiveItem[] {
  return channels
    .map((ch) => ({ ...toNowItem(ch), status: ch.status }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 50);
}

// ---------------------------------------------------------------------------
// Settings / branding
// ---------------------------------------------------------------------------

export interface Settings {
  settings: {
    default_lang: string;
    homepage_slug: string;
    maintenance_mode: string;
    site_description: string;
    site_name: string;
  };
}

export function getSettings(): Settings {
  return {
    settings: {
      default_lang: 'ro',
      homepage_slug: '',
      maintenance_mode: '0',
      site_description:
        'Urmărește cele mai populare canale TV românești live online, gratuit, oricând și oriunde — știri, sport, filme, divertisment și muzică.',
      site_name: 'CanaleTV Live',
    },
  };
}

export interface Branding {
  site_name: string;
}

export function getBranding(): Branding {
  return { site_name: 'CanaleTV Live' };
}

// ---------------------------------------------------------------------------
// In-memory state: ratings, shoutbox, watchlist, push, stream reports
// ---------------------------------------------------------------------------

/** Ratings: channel_id -> submitted rating values (1-5, server-side only). */
export const ratingsStore = new Map<number, number[]>();

export function getRatings(channelId: number): {
  count: number;
  avg: number;
  myRating: number;
} {
  const arr = ratingsStore.get(channelId) ?? [];
  const avg = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  return { count: arr.length, avg, myRating: 0 };
}

export function addRating(channelId: number, rating: number): {
  count: number;
  avg: number;
  myRating: number;
} {
  const r = Math.min(5, Math.max(1, Math.round(Number(rating) || 0)));
  const arr = ratingsStore.get(channelId) ?? [];
  if (r > 0) arr.push(r);
  ratingsStore.set(channelId, arr);
  const sum = arr.reduce((a, b) => a + b, 0);
  return { count: arr.length, avg: arr.length > 0 ? sum / arr.length : 0, myRating: r };
}

// ---------------------------------------------------------------------------
// Shoutbox
// ---------------------------------------------------------------------------

export interface ShoutboxMessage {
  id: number;
  slug: string;
  username: string;
  message: string;
  color: string;
  type: 'message' | 'reaction' | 'poll';
  created_at: string; // ISO
}

let shoutboxSeq = 0;

function seedShoutbox(): ShoutboxMessage[] {
  const now = Date.now();
  const seeds = [
    { username: 'topi', message: 'Salut tuturor! Ce mai faceți?', color: '#10b981' },
    { username: 'maria_tv', message: 'ProTV merge super azi! 🔥', color: '#ff6d00' },
  ];
  const out: ShoutboxMessage[] = [];
  for (const ch of channels) {
    for (let i = 0; i < seeds.length; i++) {
      out.push({
        id: ++shoutboxSeq,
        slug: ch.slug,
        username: seeds[i].username,
        message: seeds[i].message,
        color: seeds[i].color,
        type: 'message',
        created_at: new Date(now - (seeds.length - i) * 60000).toISOString(),
      });
    }
  }
  return out;
}

export const shoutboxMessages: ShoutboxMessage[] = seedShoutbox();
export const shoutboxPostTimes = new Map<string, number[]>();

export function getShoutboxMessages(
  slug: string,
  opts: { limit?: number; type?: string; since?: string } = {}
): { messages: ShoutboxMessage[]; activeUsers: number } {
  const limit = opts.limit && opts.limit > 0 ? Math.floor(opts.limit) : 100;
  let list = shoutboxMessages.filter((m) => m.slug === slug);
  if (opts.type) list = list.filter((m) => m.type === opts.type);
  if (opts.since) {
    const sinceMs = new Date(opts.since).getTime();
    if (Number.isFinite(sinceMs)) list = list.filter((m) => new Date(m.created_at).getTime() > sinceMs);
  }
  list = list.slice(-limit);
  const activeUsers = new Set(list.map((m) => m.username)).size;
  return { messages: list, activeUsers };
}

export function postShoutboxMessage(input: {
  slug: string;
  username: string;
  message: string;
  color?: string;
  type?: string;
}): ShoutboxMessage {
  const type = (input.type === 'reaction' || input.type === 'poll' ? input.type : 'message') as
    | 'message'
    | 'reaction'
    | 'poll';
  const msg: ShoutboxMessage = {
    id: ++shoutboxSeq,
    slug: String(input.slug || ''),
    username: String(input.username || '').replace(/[<>]/g, '').slice(0, 20).trim(),
    message: String(input.message || '').slice(0, 300),
    color: String(input.color || '#10b981'),
    type,
    created_at: new Date().toISOString(),
  };
  shoutboxMessages.push(msg);
  return msg;
}

export function isShoutboxRateLimited(username: string): boolean {
  const now = Date.now();
  const times = (shoutboxPostTimes.get(username) ?? []).filter((t) => now - t < 60000);
  shoutboxPostTimes.set(username, times);
  return times.length >= 5;
}

export function recordShoutboxPost(username: string): void {
  const arr = shoutboxPostTimes.get(username) ?? [];
  arr.push(Date.now());
  shoutboxPostTimes.set(username, arr);
}

// ---------------------------------------------------------------------------
// Watchlist (toggle) / Push subscriptions / Stream reports
// ---------------------------------------------------------------------------

export const watchlistStore = new Set<string>();

export function toggleWatchlist(programId: string | number): boolean {
  const key = String(programId);
  if (watchlistStore.has(key)) {
    watchlistStore.delete(key);
    return false;
  }
  watchlistStore.add(key);
  return true;
}

export const pushSubscriptions: unknown[] = [];

export const streamReports: unknown[] = [];
