import { NextResponse } from 'next/server';
import { getChannel } from '../../../../lib/store';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ch = getChannel(params.id);
  if (!ch) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ch);
}
