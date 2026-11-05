import { NextResponse } from 'next/server';
import { pushSubscriptions } from '../../../lib/store';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  pushSubscriptions.push(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const endpoint = body.endpoint;
  for (let i = pushSubscriptions.length - 1; i >= 0; i--) {
    const s = pushSubscriptions[i] as { endpoint?: string };
    if (endpoint && s && s.endpoint === endpoint) pushSubscriptions.splice(i, 1);
  }
  return NextResponse.json({ ok: true });
}
