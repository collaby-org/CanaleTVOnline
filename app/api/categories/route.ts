import { NextResponse } from 'next/server';
import { categories } from '../../../lib/store';

export async function GET() {
  return NextResponse.json(categories);
}
