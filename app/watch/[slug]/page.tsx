import { notFound } from 'next/navigation';
import Link from 'next/link';
import WatchPlayer from '@/components/WatchPlayer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getChannelWithEpg, getCurrentEpg, getNextEpg, getDayEpg, getRatings, getFreshStreamUrl, getChannelsWithFreshUrls, sanitizeStreamUrl, blogPosts } from '@/lib/store';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const ch = getChannelWithEpg(params.slug);
  if (!ch) return { title: 'Canal negăsit | CanaleTV Live' };
  const cur = getCurrentEpg(ch.id);
  const nxt = getNextEpg(ch.id);
  const epgTitle = cur?.title || ch.epg_title || 'Live';
  const nextTitle = nxt?.title || '';
  const nextTime = nxt ? new Date(nxt.start_time).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '';
  return {
    title: `${ch.name}: ${epgTitle} — Live Online Gratuit | CanaleTV Live`,
    description: `Acum: ${epgTitle} · Urmează: ${nextTitle} la ${nextTime}.`,
    alternates: { canonical: `/watch/${ch.slug}` },
    openGraph: { type: 'video.other', title: `${ch.name}: ${epgTitle}`, description: `Acum: ${epgTitle}`, url: `/watch/${ch.slug}` },
    twitter: { card: 'summary_large_image', title: `🔴 ${ch.name}: ${epgTitle}`, description: `Acum: ${epgTitle}`, images: [`/api/og/watch/${ch.slug}`] },
  };
}

const FAQS = [
  { q: 'Cum urmăresc canalul live?', a: 'Fluxul pornește automat în playerul de mai sus, fără cont.' },
  { q: 'Ce fac dacă fluxul nu pornește?', a: 'Reîncarcă pagina pentru token nou sau schimbă serverul din butoanele Server 1/2.' },
  { q: 'Cum văd programul TV complet?', a: 'Consultă secțiunea Program TV de mai jos pentru programul zilei.' },
  { q: 'Pot folosi subtitrări sau calitatea HD?', a: 'Da — calitatea se selectează automat în funcție de conexiune (HD când este disponibilă).' },
];

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '');

export default async function WatchPage({ params }: { params: { slug: string } }) {
  const channel = getChannelWithEpg(params.slug);
  if (!channel) notFound();
  // Fresh upstream-minted (tokenized) stream URL for playback; the seed URL
  // carries a stale HMAC token and dies with 403. See lib/store.ts
  // getFreshStreamUrl. On upstream failure sanitizeStreamUrl falls back to
  // the naked URL (tv-family) / seed as-is (rd/arwen) — never the stale
  // seed token.
  const fresh = await getFreshStreamUrl(params.slug);
  const playerChannel = { ...channel, stream_url: sanitizeStreamUrl(channel, fresh) };
  const epg = getDayEpg(channel.id);
  const currentEpg = getCurrentEpg(channel.id);
  const nextEpg = getNextEpg(channel.id);
  // Related/sidebar entries come from the fresh-URL merged list (same 15s
  // upstream cache), so no stale seed token leaks into the HTML via `related`.
  const freshList = await getChannelsWithFreshUrls();
  const sameCat = freshList.filter((c) => c.category_slug === channel.category_slug && c.slug !== channel.slug);
  const idx = sameCat.findIndex((c) => c.slug === channel.slug);
  const sorted = freshList.filter((c) => c.category_slug === channel.category_slug);
  const si = sorted.findIndex((c) => c.slug === channel.slug);
  const prevSlug = sorted[si - 1]?.slug;
  const nextSlug = sorted[si + 1]?.slug;
  const related = sameCat.slice(0, 8);
  const relatedBlogs = Object.values(blogPosts).slice(0, 3);
  const streams = [{ id: 0, name: 'Server 1', url: playerChannel.stream_url, sort_order: 0 }];

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>{channel.name} Live Online Gratis</h1>
        <p style={{ color: '#8a93a6' }}>Acum: {currentEpg?.title || channel.epg_title} · Urmează: {nextEpg?.title || '—'} la {fmt(nextEpg?.start_time)}</p>
        <WatchPlayer channel={playerChannel} epg={epg} related={related} currentEpg={currentEpg} nextEpg={nextEpg} streams={streams} initialRating={getRatings(channel.id)} blogPosts={relatedBlogs} prevSlug={prevSlug} nextSlug={nextSlug} />
        <aside style={{ marginTop: 32 }}>
          <h2 style={{ color: '#fff' }}>EPG — Programul zilei</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {epg.slice(0, 30).map((e) => (
              <li key={e.id} style={{ color: '#d7dce6', background: '#0d1017', border: '1px solid #1f2430', padding: 8, borderRadius: 6 }}>
                <b>{fmt(e.start_time)} - {fmt(e.end_time)}</b> {e.title}
              </li>
            ))}
          </ul>
        </aside>
        <section style={{ marginTop: 32 }}>
          <h2 style={{ color: '#fff' }}>Întrebări frecvente</h2>
          {FAQS.map((f) => <details key={f.q} style={{ border: '1px solid #1f2430', borderRadius: 8, padding: 12, marginBottom: 8, background: '#0d1017' }}><summary style={{ color: '#fff' }}>{f.q}</summary><p style={{ color: '#8a93a6' }}>{f.a}</p></details>)}
        </section>
        <section style={{ marginTop: 24 }}><Link href={`/blog/${relatedBlogs[0]?.slug || ''}`} style={{ color: '#34d399' }}>Citește articolele despre TV</Link></section>
      </main>
      <Footer />
    </>
  );
}
