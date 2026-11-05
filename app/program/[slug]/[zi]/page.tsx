import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getChannel, getDayEpg } from '@/lib/store';

export async function generateMetadata({ params }: { params: { slug: string; zi: string } }) {
  const ch = getChannel(params.slug);
  if (!ch) return { title: 'Canal negăsit | CanaleTV Live' };
  return {
    title: `${ch.name} Program TV Astăzi | CanaleTV Live`,
    description: `Program TV pentru azi pe ${ch.name}: toate emisiunile și orele de difuzare, CanaleTV Live.`,
    alternates: { canonical: `/program/${ch.slug}/${params.zi}` },
  };
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function ProgramPage({ params }: { params: { slug: string; zi: string } }) {
  const ch = getChannel(params.slug);
  if (!ch) notFound();
  const epg = getDayEpg(ch.id);
  const now = Date.now();
  const dateStr = epg.length > 0 ? fmtDate(epg[0].start_time) : '';

  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>{ch.name} — Program TV {dateStr || 'Astăzi'}</h1>
        <p style={{ color: '#9aa5b1', marginTop: 6 }}>{ch.category_name} · ora României</p>
        <Link
          href={`/watch/${ch.slug}`}
          style={{ display: 'inline-block', background: '#10b981', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, marginTop: 14 }}
        >
          ▶ Urmărește {ch.name} Live
        </Link>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {epg.length === 0 && (
            <p style={{ color: '#9aa5b1' }}>Programul pentru această zi nu este disponibil încă.</p>
          )}
          {epg.map((e) => {
            const start = new Date(e.start_time).getTime();
            const end = new Date(e.end_time).getTime();
            const isLive = start <= now && now < end;
            const isPast = end <= now;
            const pct = isLive ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : 0;
            return (
              <div
                key={e.id}
                style={{
                  background: isLive ? 'rgba(16,185,129,.12)' : '#0d1017',
                  border: isLive ? '1px solid #10b981' : '1px solid #1f2430',
                  borderRadius: 10, padding: '12px 16px', opacity: isPast ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ color: '#34d399', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(e.start_time)} – {fmt(e.end_time)}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{e.title}</span>
                  {isLive && (
                    <span style={{ background: '#ff1e56', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>LIVE</span>
                  )}
                </div>
                {e.description && (
                  <p style={{ color: '#9aa5b1', fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>{e.description}</p>
                )}
                {isLive && (
                  <div style={{ background: '#1f2430', height: 5, borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#10b981,#f59e0b)' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
