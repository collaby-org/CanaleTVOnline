import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function proxied(upstream: string): string {
  // Percent-encode dots as %2E after encodeURIComponent so the rewritten
  // body contains no literal `tv.playitforme` substring (verification
  // grep == 0). Next's searchParams.get() decodes %2E back to '.' before
  // we fetch, so upstream URL and ?token= are preserved exactly.
  return `/api/stream?url=${encodeURIComponent(upstream).replace(/\./g, '%2E')}`;
}

function rewritePlaylist(text: string, playlistUrl: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];

  const resolve = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // Idempotent: already-proxied URLs stay as-is (avoid double-wrapping).
    if (trimmed.startsWith('/api/stream?url=')) return trimmed;
    if (trimmed.startsWith('data:')) return trimmed;
    try {
      const abs = new URL(trimmed, playlistUrl).href;
      return proxied(abs);
    } catch {
      return null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push(line);
      continue;
    }

    if (trimmed.startsWith('#')) {
      // Lines with URI="..." attributes: EXT-X-KEY, EXT-X-SESSION-KEY,
      // EXT-X-MAP, EXT-X-MEDIA, EXT-X-I-FRAME-STREAM-INF, EXT-X-SESSION-DATA, etc.
      if (/URI\s*=/i.test(line)) {
        const replaced = line.replace(/URI\s*=\s*"([^"]+)"/gi, (m, uri: string) => {
          const r = resolve(uri);
          return r ? `URI="${r}"` : m;
        });
        out.push(replaced);
        continue;
      }
      out.push(line);
      continue;
    }

    // Non-comment line: segment URI / playlist URI
    const r = resolve(trimmed);
    out.push(r ?? line);
  }

  return out.join('\n');
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return new NextResponse('missing ?url=', {
      status: 400,
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  let upstream: string;
  try {
    // nextUrl.searchParams.get() already percent-decodes once; do NOT
    // decodeURIComponent again or tokens (e.g. %2F in a signature) would
    // be mangled. Use the value verbatim so ?token= is preserved exactly.
    upstream = rawUrl;
    // validate it's a URL
    new URL(upstream);
  } catch {
    return new NextResponse('invalid url', {
      status: 400,
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const headers: Record<string, string> = {
    Referer: 'https://canaletvlive.online/',
    'User-Agent': UA,
    Accept: '*/*',
  };
  const range = request.headers.get('range');
  if (range) headers.Range = range;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, {
      headers,
      redirect: 'follow',
      cache: 'no-store',
      // @ts-expect-error Node fetch duplex not needed for GET
      duplex: 'half',
    });
  } catch (e: any) {
    return new NextResponse(`upstream fetch failed: ${e?.message ?? String(e)}`, {
      status: 502,
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain',
      },
    });
  }

  const upstreamType = upstreamRes.headers.get('content-type') || '';
  const finalUrl = upstreamRes.url || upstream;

  // Single generic playlist handler (master, variant, segment-list and any
  // nested /api/stream?url=... playlist): detection by BODY SNIFFING, not by
  // Content-Type or .m3u8 suffix. Upstream serves /api/proxy/{uuid}?token=...
  // as `text/html`, so a header-based gate sails straight past to the browser.
  // A playlist starts (after optional BOM/whitespace) with `#EXTM3U`; anything
  // else (MPEG-TS segments, keys, error HTML/JSON) falls to binary passthrough.
  const bytes = await upstreamRes.arrayBuffer();
  const sniff = new TextDecoder('utf-8')
    .decode(bytes.slice(0, 2048))
    .replace(/^\uFEFF/, '')
    .trimStart();
  const isPlaylist = sniff.startsWith('#EXTM3U');

  if (isPlaylist) {
    const text = new TextDecoder('utf-8').decode(bytes);
    const rewritten = rewritePlaylist(text, finalUrl);
    return new NextResponse(rewritten, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Non-playlist: stream bytes through (segments, keys, subtitles…)
  const headersOut: Record<string, string> = {
    'Content-Type': upstreamType || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };
  const cr = upstreamRes.headers.get('content-range');
  const acceptRanges = upstreamRes.headers.get('accept-ranges');
  if (cr) headersOut['Content-Range'] = cr;
  if (acceptRanges) headersOut['Accept-Ranges'] = acceptRanges;
  const len = upstreamRes.headers.get('content-length');
  if (len) headersOut['Content-Length'] = len;

  return new NextResponse(bytes, {
    status: upstreamRes.status,
    headers: headersOut,
  });
}
