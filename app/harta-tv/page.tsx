import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { channels, categories } from '@/lib/store';

export const metadata = { title: 'Harta TV — Canale Live din România | CanaleTV Live', description: 'Harta TV — canale live din România, aranjate pe categorii.' };

const colorOf = (slug: string) => categories.find((c) => c.slug === slug)?.color || '#10b981';

export default function HartaTvPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>🗺️ Harta TV — Canale Live din România</h1>
        <div style={{ border: '1px solid #1f2430', borderRadius: 10, background: '#0d1017', padding: 16, marginTop: 16 }}>
          <svg viewBox="0 0 640 480" style={{ width: '100%', height: 420, background: '#08090c', borderRadius: 8 }}>
            <path d="M200 60 L320 40 L430 60 L520 110 L560 190 L540 300 L470 400 L360 430 L250 410 L130 360 L80 280 L90 170 L150 100 Z" fill="none" stroke="#3a4152" strokeWidth="2" />
            <text x="320" y="240" fill="#3a4152" textAnchor="middle" fontSize="14">România</text>
            {channels.map((c, i) => {
              const x = 100 + ((i * 37) % 440);
              const y = 60 + ((i * 53) % 340);
              return <g key={c.slug}><circle cx={x} cy={y} r="6" fill={colorOf(c.category_slug)} opacity="0.85"><title>{c.name}</title></circle></g>;
            })}
          </svg>
          <p style={{ color: '#6b7486', fontSize: 12 }}>Hartă ilustrativă — punctele reprezintă canalele, colorate după categorie.</p>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map((c) => <span key={c.slug} style={{ color: '#fff', fontSize: 12 }}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c.color }} /> {c.icon} {c.name}</span>)}
        </div>
        <section style={{ marginTop: 24 }}>
          <h2 style={{ color: '#fff' }}>Toate canalele</h2>
          {categories.map((cat) => (
            <div key={cat.slug} style={{ marginTop: 12 }}>
              <h3 style={{ color: cat.color }}>{cat.icon} {cat.name}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {channels.filter((c) => c.category_slug === cat.slug).map((c) => <Link key={c.slug} href={`/watch/${c.slug}`} style={{ color: '#d7dce6', border: '1px solid #1f2430', borderRadius: 999, padding: '4px 10px', textDecoration: 'none', fontSize: 13 }}>{c.name}</Link>)}
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
