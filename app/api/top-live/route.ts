import { NextResponse } from 'next/server';
import { getTopLive } from '../../../lib/store';

export async function GET() {
  return NextResponse.json(getTopLive());
}
