import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getChannelWithEpg, getDayEpg } from '@/lib/store';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const ch = getChannelWithEpg(params.slug);
  if (!ch) return { title: 'Canal negăsit | CanaleTV Live' };
  return {
    title: `${ch.name} — Despre Canal, Program, Live Online | CanaleTV Live`,
    description: ch.description || `${ch.name} live online — program TV și detalii despre canal.`,
    alternates: { canonical: `/canal/${ch.slug}` },
  };
}

const fmt = (iso: string) => new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

export default async function CanalPage({ params }: { params: { slug: string } }) {
  const channel = getChannelWithEpg(params.slug);
  if (!channel) notFound();
  const epg = getDayEpg(channel.id);
  const now = Date.now();
  const today = epg.filter((e) => new Date(e.end_time).getTime() > now - 3600000).slice(0, 30);
  return (
    <>
      <Header />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>{channel.name} — Despre Canal</h1>
        <p style={{ color: '#d7dce6' }}>{channel.description}</p>
        <p style={{ color: '#8a93a6' }}>Categorie: {channel.category_name} · Țară: {channel.country} · Limbă: {channel.language}</p>
        <p><Link href={`/watch/${channel.slug}`} style={{ display: 'inline-block', marginTop: 8, background: '#10b981', color: '#04130d', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>▶ Vizionează live {channel.name}</Link></p>
        <h2 style={{ color: '#fff', marginTop: 32 }}>Program TV Astăzi</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {today.map((e) => <li key={e.id} style={{ color: '#d7dce6', background: '#0d1017', border: '1px solid #1f2430', padding: 8, borderRadius: 6, marginBottom: 6 }}><b>{fmt(e.start_time)} - {fmt(e.end_time)}</b> {e.title}</li>)}
        </ul>
        <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24 }}>
          <Link href={`/program/${channel.slug}/maine`} style={{ color: '#34d399' }}>Program Mâine</Link>
          <Link href="/ghid-tv" style={{ color: '#34d399' }}>Ghid TV Complet</Link>
          <Link href={`/categorie/${channel.category_slug}`} style={{ color: '#34d399' }}>Toate canalele {channel.category_name}</Link>
          <Link href="/ghid-tv#detalii" style={{ color: '#34d399' }}>Frecvențe & Detalii</Link>
        </nav>
      </main>
      <Footer />
    </>
  );
}
