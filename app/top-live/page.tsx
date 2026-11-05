import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { channels, getCurrentEpg } from '@/lib/store';

export const metadata = {
  title: 'Top Live — Cele mai urmărite canale TV | CanaleTV Live',
  description: 'Top Live CanaleTV: clasamentul celor mai urmărite canale TV românești live, actualizat zilnic.',
};

const fmtViews = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('ro-RO');
};

export default function TopLivePage() {
  const top = [...channels].sort((a, b) => b.views - a.views).slice(0, 20);

  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>🔥 Top Live — Cele mai urmărite canale</h1>
        <p style={{ color: '#9aa5b1', marginTop: 6 }}>
          Clasament actualizat din vizualizări, cu programul aflat acum în difuzare.
        </p>
        <ol style={{ listStyle: 'none', padding: 0, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {top.map((ch, i) => {
            const cur = getCurrentEpg(ch.id);
            return (
              <li
                key={ch.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: i === 0 ? 'rgba(245,158,11,.12)' : '#0d1017',
                  border: i === 0 ? '1px solid #f59e0b' : '1px solid #1f2430',
                  borderRadius: 10, padding: '10px 14px',
                }}
              >
                <span style={{ color: i < 3 ? '#f59e0b' : '#8a93a6', fontWeight: 800, fontSize: 18, minWidth: 28, textAlign: 'center' }}>
                  {i + 1}
                </span>
                {ch.logo ? (
                  <img src={ch.logo} alt="" style={{ width: 44, height: 30, objectFit: 'contain', borderRadius: 4 }} />
                ) : (
                  <span style={{ fontSize: 22 }} aria-hidden>{ch.category_icon || '📺'}</span>
                )}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link href={`/watch/${ch.slug}`} style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                      {ch.name}
                    </Link>
                    <span style={{ background: '#ff1e56', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>LIVE</span>
                  </span>
                  <span style={{ display: 'block', color: '#9aa5b1', fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cur ? cur.title : ch.epg_title || 'Program live'}
                  </span>
                </span>
                <span style={{ color: '#8a93a6', fontSize: 12, whiteSpace: 'nowrap' }}>👁 {fmtViews(ch.views)}</span>
              </li>
            );
          })}
        </ol>
      </main>
      <Footer />
    </>
  );
}
