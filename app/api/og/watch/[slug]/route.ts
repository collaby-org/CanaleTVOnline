import { NextResponse } from 'next/server';
import { deflateSync } from 'zlib';
import { channels } from '../../../../../lib/store';

const W = 1200;
const H = 630;

/** Minimal but valid 1200x630 PNG: dark bg (#08090c) + red (#ff1e56) accent band. */
function buildPng(): Buffer {
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (y < 10 || x < 10) {
        rgba[i] = 0xff; rgba[i + 1] = 0x1e; rgba[i + 2] = 0x56; // red accent
      } else {
        rgba[i] = 0x08; rgba[i + 1] = 0x09; rgba[i + 2] = 0x0c;
      }
      rgba[i + 3] = 0xff;
    }
  }
  // Filter byte 0 per scanline.
  const raw = Buffer.alloc(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  }

  const chunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// CRC32 table (PNG).
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const ch = channels.find((c) => c.slug === params.slug);
  if (!ch) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new Response(buildPng(), {
    headers: { 'Content-Type': 'image/png' },
  });
}
