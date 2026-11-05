import { NextResponse } from 'next/server';
import { getNowOnTv } from '../../../lib/store';

export async function GET() {
  return NextResponse.json(getNowOnTv());
}
