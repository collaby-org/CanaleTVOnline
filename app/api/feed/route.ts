import { blogPosts } from '../../../lib/store';

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const origin = 'http://localhost:3000';
  const items = Object.values(blogPosts)
    .sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)))
    .map((p) => {
      const link = `${origin}/blog/${p.slug}`;
      const pub = new Date(String(p.published_at).replace(' ', 'T')).toUTCString();
      return [
        '    <item>',
        `      <title>${xmlEscape(p.title)}</title>`,
        `      <link>${xmlEscape(link)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(link)}</guid>`,
        `      <pubDate>${pub}</pubDate>`,
        `      <category>${xmlEscape(p.category)}</category>`,
        `      <description>${xmlEscape(p.excerpt)}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>CanaleTV Live</title>',
    `    <link>${origin}/</link>`,
    '    <description>Urmărește canale TV live online, gratuit.</description>',
    `    <atom:link href="${origin}/api/feed" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
