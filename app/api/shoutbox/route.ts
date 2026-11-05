import { NextResponse } from 'next/server';
import {
  getShoutboxMessages,
  postShoutboxMessage,
  isShoutboxRateLimited,
  recordShoutboxPost,
} from '../../../lib/store';

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const slug = params.get('slug') || '';
  const limit = Number(params.get('limit')) || 100;
  const type = params.get('type') || undefined;
  const since = params.get('since') || undefined;
  return NextResponse.json(getShoutboxMessages(slug, { limit, type, since }));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || '').replace(/[<>]/g, '').slice(0, 20).trim();
  const message = String(body.message || '').slice(0, 300);
  if (!username || !message) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }
  if (isShoutboxRateLimited(username)) {
    return NextResponse.json(
      { error: 'Prea multe mesaje! Așteaptă un minut.' },
      { status: 429 }
    );
  }
  recordShoutboxPost(username);
  const msg = postShoutboxMessage({
    slug: String(body.slug || ''),
    username,
    message,
    color: body.color,
    type: body.type,
  });
  return NextResponse.json(msg);
}
