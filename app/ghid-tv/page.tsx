'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface EpgItem { id: number; channel_id: number; title: string; description?: string; start_time: string; end_time: string; channel_name?: string; channel_slug?: string; }
interface Ch { id: number; name: string; slug: string; }

const HOUR = 120;

export default function GhidTvPage() {
  const [epg, setEpg] = useState<EpgItem[]>([]);
  const [channels, setChannels] = useState<Ch[]>([]);
  const [loading, setLoading] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        if (channels.length === 0) {
          const c = await fetch('/api/channels', { cache: 'no-store' }).then((r) => r.json());
          if (Array.isArray(c)) setChannels(c.map((x: any) => ({ id: x.id, name: x.name, slug: x.slug })));
        }
        const e = await fetch('/api/epg', { cache: 'no-store' }).then((r) => r.json());
        if (Array.isArray(e)) setEpg(e);
      } catch {}
      setLoading(false);
      setTimeout(() => { if (scroller.current) scroller.current.scrollLeft = Math.max(0, (Date.now() % 3600000) / 3600000 * HOUR - 80); }, 50);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = Date.now();
  const start = now - 3600000;
  const totalW = 11 * HOUR;
  const grouped = new Map<number, EpgItem[]>();
  for (const e of epg) { if (!grouped.has(e.channel_id)) grouped.set(e.channel_id, []); grouped.get(e.channel_id)!.push(e); }
  const tints = ['rgba(16,185,129,.18)', 'rgba(245,158,11,.18)', 'rgba(255,23,68,.18)', 'rgba(59,130,246,.18)', 'rgba(139,92,246,.18)'];

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>🗓️ Ghid TV Interactiv <span style={{ background: '#ff1e56', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 4, verticalAlign: 'middle' }}>LIVE</span></h1>
        {loading ? <p style={{ color: '#8a93a6' }}>Se încarcă ghidul TV...</p> : (
          <div ref={scroller} style={{ overflowX: 'auto', border: '1px solid #1f2430', borderRadius: 10, background: '#0d1017', marginTop: 16 }}>
            <div style={{ position: 'sticky', top: 0, background: '#0d1017', display: 'flex', borderBottom: '1px solid #1f2430', zIndex: 2 }}>
              <div style={{ width: 140, flexShrink: 0, padding: 8, color: '#fff', fontWeight: 700 }}>Canal</div>
              {Array.from({ length: 11 }, (_, i) => {
                const d = new Date(start + i * 3600000);
                return <div key={i} style={{ width: HOUR, flexShrink: 0, padding: 8, color: '#8a93a6', fontSize: 12 }}>{d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</div>;
              })}
            </div>
            {channels.map((ch, ri) => (
              <div key={ch.id} style={{ display: 'flex', borderBottom: '1px solid #151a24', minHeight: 56 }}>
                <div style={{ width: 140, flexShrink: 0, padding: 8 }}><Link href={`/watch/${ch.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>{ch.name}</Link></div>
                <div style={{ position: 'relative', width: totalW, flexShrink: 0 }}>
                  {(grouped.get(ch.id) || []).map((e) => {
                    const s = new Date(e.start_time).getTime(), t = new Date(e.end_time).getTime();
                    const left = (s - start) / 3600000 * HOUR;
                    const width = Math.max(40, (t - s) / 3600000 * HOUR - 4);
                    if (left + width < 0 || left > totalW) return null;
                    return <div key={e.id} style={{ position: 'absolute', left, width, top: 4, bottom: 4, background: tints[ri % tints.length], border: '1px solid #1f2430', borderRadius: 6, padding: 4, overflow: 'hidden' }}><span style={{ color: '#fff', fontSize: 11 }}>{e.title}</span></div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
