import { NextResponse } from 'next/server';
import { blogPosts } from '../../../lib/store';

// List view: no `content` field (single-post route includes it).
function stripContent(post: (typeof blogPosts)[string]) {
  const { content: _c, status: _s, updated_at: _u, ...rest } = post;
  return rest;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const limitParam = Number(params.get('limit'));
  const pageParam = Number(params.get('page'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 10;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const all = Object.values(blogPosts)
    .map(stripContent)
    .sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));

  const total = all.length; // 19
  const pages = Math.max(1, Math.ceil(total / limit));
  const posts = all.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ posts, page, pages, total });
}
