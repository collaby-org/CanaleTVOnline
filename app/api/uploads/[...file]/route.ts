import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: { file: string[] } }
) {
  const file = (params.file || []).join('/');
  let upstream: Response;
  try {
    upstream = await fetch(`https://canaletvlive.online/api/uploads/${file}`);
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Not found' }, { status: upstream.status });
  }
  const buf = Buffer.from(await upstream.arrayBuffer());
  return new Response(buf, {
    headers: {
      'Content-Type':
        upstream.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
