import { NextResponse } from 'next/server';
import { channels } from '../../../lib/store';

/** Fake upstream-style token, refreshed per request. */
function fakeToken(): string {
  const rand = (n: number) =>
    Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  return `${Date.now()}-${rand(64)}`;
}

/** Attach (or refresh) ?token= the way the bulk upstream list does. */
function withToken(url: string): string {
  const token = fakeToken();
  const u = url.replace(/([?&])token=[^&]*/g, '$1TOKEN_PLACEHOLDER');
  if (u.includes('TOKEN_PLACEHOLDER')) return u.replace('TOKEN_PLACEHOLDER', token);
  return url.includes('?') ? `${url}&token=${token}` : `${url}?token=${token}`;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const category = params.get('category');
  const search = params.get('search');
  const featured = params.get('featured');

  let items = channels;
  if (category) items = items.filter((c) => c.category_slug === category);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter((c) => c.name.toLowerCase().includes(q));
  }
  if (featured === '1') items = items.filter((c) => c.is_featured === 1);

  return NextResponse.json({
    items: items.map((c) => ({ ...c, stream_url: withToken(c.stream_url) })),
  });
}
