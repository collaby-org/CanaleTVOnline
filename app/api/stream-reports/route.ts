import { NextResponse } from 'next/server';
import { streamReports } from '../../../lib/store';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  streamReports.push(body);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
