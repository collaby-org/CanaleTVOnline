import { NextResponse } from 'next/server';
import { getRatings, addRating } from '../../../lib/store';

export async function GET(req: Request) {
  const channelId = Number(new URL(req.url).searchParams.get('channel_id'));
  return NextResponse.json(getRatings(Number.isFinite(channelId) ? channelId : 0));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const channelId = Number(body.channel_id);
  const rating = Number(body.rating);
  return NextResponse.json(
    addRating(Number.isFinite(channelId) ? channelId : 0, rating)
  );
}
