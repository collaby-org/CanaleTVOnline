import { NextResponse } from 'next/server';
import { getBranding } from '../../../../lib/store';

export async function GET() {
  return NextResponse.json(getBranding());
}
