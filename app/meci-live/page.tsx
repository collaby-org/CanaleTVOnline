'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Ch { id: number; name: string; slug: string; epg_title?: string; category_slug?: string; }
interface Epg { id: number; channel_id: number; title: string; start_time: string; end_time: string; channel_name?: string; }

const fmt = (iso: string) => new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

export default function MeciLivePage() {
  const [channels, setChannels] = useState<Ch[]>([]);
  const [epg, setEpg] = useState<Epg[]>([]);
  const [slots, setSlots] = useState<Array<Ch | null>>([null, null, null, null]);
  const [count, setCount] = useState(2);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const c = await fetch('/api/channels?category=sport', { cache: 'no-store' }).then((r) => r.json());
        if (Array.isArray(c)) setChannels(c);
        const e = await fetch('/api/epg', { cache: 'no-store' }).then((r) => r.json());
        if (Array.isArray(e)) setEpg(e);
      } catch {}
    })();
  }, []);

  const visible = channels.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));
  const toggle = (ch: Ch) => {
    setSlots((prev) => {
      if (prev.some((s) => s?.slug === ch.slug)) return prev.map((s) => (s?.slug === ch.slug ? null : s));
      const free = prev.findIndex((s) => !s);
      if (free === -1) return prev;
      const next = [...prev]; next[free] = ch; return next;
    });
  };

  const cols = count <= 2 ? 2 : count === 3 ? 2 : 4;
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>⚽ Meciuri Live — Sport Live Online</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrează canale sport..." style={{ background: '#151a24', color: '#fff', border: '1px solid #1f2430', borderRadius: 8, padding: 8 }} />
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ background: '#151a24', color: '#fff', border: '1px solid #1f2430', borderRadius: 8, padding: 8 }}><option value={1}>1 slot</option><option value={2}>2 sloturi</option><option value={4}>4 sloturi</option></select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, marginTop: 16 }}>
          {slots.slice(0, count).map((s, i) => (
            <div key={i} style={{ border: '1px dashed #3a4152', borderRadius: 10, minHeight: 220, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d1017' }}>
              <span style={{ color: s ? '#fff' : '#6b7486' }}>{s ? `🔴 ${s.name}` : `📺 Slot ${i + 1}\nAlege un canal`}</span>
              {s && <><Link href={`/watch/${s.slug}`} style={{ color: '#34d399', marginTop: 8 }}>Deschide</Link><button onClick={() => toggle(s)} style={{ marginTop: 8, background: '#151a24', color: '#fff', border: '1px solid #1f2430', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>✕ Elimină</button></>}
            </div>
          ))}
        </div>
        <section style={{ marginTop: 32 }}>
          <h2 style={{ color: '#fff' }}>Canale Sport ({visible.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
            {visible.map((c) => (
              <div key={c.slug} style={{ border: '1px solid #1f2430', borderRadius: 8, padding: 10, background: '#0d1017' }}>
                <span style={{ background: '#ff1e56', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>🔴 LIVE</span>
                <Link href={`/watch/${c.slug}`} style={{ color: '#fff', display: 'block', marginTop: 6, textDecoration: 'none' }}>{c.name}</Link>
                <div style={{ color: '#8a93a6', fontSize: 12 }}>{c.epg_title}</div>
                <button onClick={() => toggle(c)} style={{ marginTop: 6, background: '#10b981', color: '#04130d', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>+ Adaugă</button>
              </div>
            ))}
          </div>
        </section>
        <section style={{ marginTop: 32 }}>
          <h2 style={{ color: '#fff' }}>EPG Sport Astăzi</h2>
          {epg.filter((e) => channels.some((c) => c.id === e.channel_id)).map((e) => (
            <div key={e.id} style={{ color: '#d7dce6', border: '1px solid #1f2430', borderRadius: 6, padding: 8, marginBottom: 6, background: '#0d1017' }}><b>{fmt(e.start_time)} - {fmt(e.end_time)}</b> {e.channel_name} — {e.title}</div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
