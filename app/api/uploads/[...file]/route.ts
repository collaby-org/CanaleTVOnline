import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const EXT_CT: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

export async function GET(
  _req: Request,
  { params }: { params: { file: string[] } }
) {
  const file = (params.file || []).join('/');
  const base = path.posix.basename(file);

  // Primary: serve locally from public/logos/{basename} if it exists.
  if (base && base !== '.' && base !== '..') {
    const localPath = path.join(process.cwd(), 'public', 'logos', base);
    try {
      if (fs.existsSync(localPath)) {
        const data = fs.readFileSync(localPath);
        const ct =
          EXT_CT[path.extname(base).toLowerCase()] || 'application/octet-stream';
        return new Response(data, {
          headers: {
            'Content-Type': ct,
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch {
      // fall through to upstream proxy fallback
    }
  }

  // Fallback: proxy upstream (legacy; only when file is not present locally).
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
