import { NextResponse } from 'next/server';
import { getChannelsWithFreshUrls } from '../../../lib/store';

/**
 * Bulk channel list. stream_url + epg fields are merged from the upstream
 * bulk response (https://canaletvlive.online/api/channels, cached 15s), so
 * tv.playitforme.online entries carry the upstream-minted
 * ?token={13digit-ms}-{64hex-sha256} HMAC. Never mint tokens locally — a
 * locally fabricated token fails upstream HMAC validation and the proxy
 * answers 403 forever. Fallback (see sanitizeStreamUrl in lib/store.ts):
 * tv-family → naked seed, rd/arwen → seed as-is (stripped naked). The stale
 * seed token (`1793831492238-…`) is never served.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const category = params.get('category');
  const search = params.get('search');
  const featured = params.get('featured');

  let items = await getChannelsWithFreshUrls();
  if (category) items = items.filter((c) => c.category_slug === category);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter((c) => c.name.toLowerCase().includes(q));
  }
  if (featured === '1') items = items.filter((c) => c.is_featured === 1);

  return NextResponse.json({ items });
}
