import { NextResponse } from 'next/server';
import { blogPosts } from '../../../../lib/store';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const post = blogPosts[params.slug];
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(post);
}
