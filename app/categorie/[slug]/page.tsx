import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { channels, categories } from '@/lib/store';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const cat = categories.find((c) => c.slug === params.slug);
  if (!cat) return { title: 'Categorie negăsită | CanaleTV Live' };
  return {
    title: `Canale ${cat.name} Live Online Gratis`,
    description: `Urmărește canale ${cat.name} live online gratuit — ${cat.channel_count} canale disponibile.`,
    alternates: { canonical: `/categorie/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = categories.find((c) => c.slug === params.slug);
  if (!cat) notFound();
  const list = channels.filter((c) => c.category_slug === cat.slug);
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>{cat.icon} Canale {cat.name} Live Online Gratis ({list.length})</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginTop: 16 }}>
          {list.map((c) => (
            <div key={c.slug} style={{ border: '1px solid #1f2430', borderRadius: 10, padding: 12, background: '#0d1017' }}>
              <span style={{ background: '#ff1e56', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>🔴 LIVE</span>
              <Link href={`/watch/${c.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, display: 'block', marginTop: 8 }}>{c.name}</Link>
              <div style={{ color: '#d7dce6', fontSize: 13, marginTop: 4 }}>{c.epg_title}</div>
            </div>
          ))}
        </div>
        {list.length === 0 && <p style={{ color: '#8a93a6' }}>Momentan nu există canale în această categorie.</p>}
        <p style={{ marginTop: 24 }}><Link href="/" style={{ color: '#34d399' }}>← Toate categoriile</Link></p>
      </main>
      <Footer />
    </>
  );
}
