import { NextResponse } from 'next/server';
import { toggleWatchlist } from '../../../lib/store';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const added = toggleWatchlist(body.program_id);
  return NextResponse.json({ added });
}
