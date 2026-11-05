import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { channels, getDayEpg } from '@/lib/store';

export const metadata = { title: 'Program TV Mâine — Ce e la TV | CanaleTV Live', description: 'Program TV pentru mâine — programele care urmează pe toate canalele.' };

const HOUR_PX = 120;
const DAY_MS = 86400000;
const fmt = (iso: string) => new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
const shift = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();

export default function MainePage() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  const totalW = 24 * HOUR_PX;
  const dateStr = new Date(startMs + DAY_MS).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>🗓️ Program TV Mâine — {dateStr}</h1>
        <div style={{ overflowX: 'auto', border: '1px solid #1f2430', borderRadius: 10, background: '#0d1017', marginTop: 16 }}>
          <div style={{ position: 'sticky', top: 0, background: '#0d1017', display: 'flex', borderBottom: '1px solid #1f2430' }}>
            <div style={{ width: 140, flexShrink: 0, padding: 8, color: '#fff', fontWeight: 700 }}>Canal</div>
            {Array.from({ length: 24 }, (_, i) => <div key={i} style={{ width: HOUR_PX, flexShrink: 0, padding: 8, color: '#8a93a6', fontSize: 12 }}>{String(i).padStart(2, '0')}:00</div>)}
          </div>
          {channels.map((ch) => {
            const day = getDayEpg(ch.id).map((e) => ({ ...e, start_time: shift(e.start_time, 1), end_time: shift(e.end_time, 1) })).slice(0, 30);
            return (
              <div key={ch.id} style={{ display: 'flex', borderBottom: '1px solid #151a24', minHeight: 56 }}>
                <div style={{ width: 140, flexShrink: 0, padding: 8 }}><Link href={`/watch/${ch.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>{ch.name}</Link></div>
                <div style={{ position: 'relative', width: totalW, flexShrink: 0 }}>
                  {day.map((e) => {
                    const s = new Date(e.start_time).getTime(), t = new Date(e.end_time).getTime();
                    const left = (s - startMs) / 3600000 * HOUR_PX, width = Math.max(40, (t - s) / 3600000 * HOUR_PX - 4);
                    return <div key={e.id} style={{ position: 'absolute', left, width, top: 4, bottom: 4, background: 'rgba(59,130,246,.18)', border: '1px solid #1f2430', borderRadius: 6, padding: 4, overflow: 'hidden' }}><span style={{ color: '#fff', fontSize: 11 }}>{fmt(e.start_time)} {e.title}</span></div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
