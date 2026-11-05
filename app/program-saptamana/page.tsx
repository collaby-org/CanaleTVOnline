import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { channels, getDayEpg } from '@/lib/store';

export const metadata = { title: 'Program TV Săptămână | CanaleTV Live', description: 'Program TV pentru 7 zile — planifică ce urmărești toată săptămâna.' };

const DAY_MS = 86400000;
const fmt = (iso: string) => new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
const shift = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();

export default function ProgramSaptamanaPage() {
  const todayMs = Date.now();
  const days = Array.from({ length: 7 }, (_, i) => new Date(todayMs + i * DAY_MS));
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>🗓️ Program TV — 7 Zile</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginTop: 16 }}>
          {days.map((d, i) => <div key={i} style={{ border: '1px solid #1f2430', borderRadius: 8, padding: 10, background: i === 0 ? '#0f2b1f' : '#0d1017' }}><b style={{ color: '#fff' }}>{d.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}</b>{i === 0 && <span style={{ color: '#34d399' }}> LIVE</span>}</div>)}
        </div>
        {days.map((d, di) => (
          <section key={di} style={{ marginTop: 32 }}>
            <h2 style={{ color: '#fff' }}>{d.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {channels.slice(0, 12).map((ch) => (
                <div key={ch.id} style={{ border: '1px solid #1f2430', borderRadius: 8, padding: 10, background: '#0d1017' }}>
                  <Link href={`/watch/${ch.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}>{ch.name}</Link>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {getDayEpg(ch.id).map((e) => ({ ...e, start_time: shift(e.start_time, di), end_time: shift(e.end_time, di) })).slice(0, 30).map((e) => (
                      <span key={e.id} style={{ color: '#d7dce6', fontSize: 12, border: '1px solid #1f2430', borderRadius: 6, padding: '2px 6px' }}>{fmt(e.start_time)} {e.title}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
