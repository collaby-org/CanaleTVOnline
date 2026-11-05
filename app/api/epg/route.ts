import { NextResponse } from 'next/server';
import { channels, getDayEpg } from '../../../lib/store';

export async function GET(req: Request) {
  const channelId = new URL(req.url).searchParams.get('channel_id');
  if (channelId !== null) {
    // ?channel_id=N → that channel's day schedule ([] for unknown channels)
    return NextResponse.json(getDayEpg(channelId));
  }
  // Bare /api/epg → today's grid subset: flatten day schedules, cap at 40.
  const all = channels
    .flatMap((c) => getDayEpg(c.id))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 40);
  return NextResponse.json(all);
}
