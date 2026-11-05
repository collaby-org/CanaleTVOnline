'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useFakeViews, formatViews } from '@/lib/hooks';

interface ChannelItem { id: number; name: string; slug: string; logo?: string; category_slug?: string; category_name?: string; category_icon?: string; category_color?: string; epg_title?: string; views?: number; start_time?: string; end_time?: string; }

function ChannelCard({ c, fav, onFav }: { c: ChannelItem; fav: boolean; onFav: (slug: string) => void }) {
  const { formatted } = useFakeViews(c);
  return (
    <div style={{ border: '1px solid #1f2430', borderRadius: 10, padding: 12, background: '#0d1017' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ background: '#ff1e56', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>🔴 LIVE</span>
        <button onClick={() => onFav(c.slug)} aria-label="favorite" style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: fav ? '#ff1e56' : '#3a4152' }}>{fav ? '❤️' : '🤍'}</button>
      </div>
      <Link href={`/watch/${c.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>{c.name}</Link>
      <div style={{ color: '#8a93a6', fontSize: 13, marginTop: 4 }}>👁 {formatViews(c.views ?? 0)} · {formatted}</div>
      <div style={{ color: '#d7dce6', fontSize: 13, marginTop: 4 }}>{c.epg_title || 'Program live'}</div>
    </div>
  );
}

const FAQS = [
  { q: 'Cum pot urmări CanaleTV Live gratis?', a: 'Selectează un canal din listă și apasă pe pagina lui de vizionare — fluxul pornește imediat în browser, fără cont.' },
  { q: 'Funcționează pe mobil?', a: 'Da, site-ul este responsive și poate fi instalat ca aplicație (PWA) din bannerul de instalare.' },
  { q: 'Am nevoie de cont?', a: 'Nu. Nu este necesar cont pentru vizionare, chat sau favorite — acestea se salvează local în browser.' },
  { q: 'Cum salvez canale favorite?', a: 'Apasă pe inima 🤍 de pe cardul canalului; lista se păstrează în tv_favorites.' },
  { q: 'De ce nu pornește fluxul?', a: 'Golește cache-ul sau reîncarcă pagina — tokenul de sesiune se reînnoiește automat la eroare 403.' },
  { q: 'Cum caut un canal?', a: 'Tastează minim 2 caractere în câmpul de căutare sau folosește Ctrl+K pentru paleta de comenzi.' },
];

export default function Home() {
  const [cats, setCats] = useState<Array<{ slug: string; name: string; icon: string; color: string; channel_count: number }>>([]);
  const [activeCat, setActiveCat] = useState('all');
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<ChannelItem[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [hero, setHero] = useState<ChannelItem | null>(null);
  const [countdown, setCountdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(1);
  const [recent, setRecent] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showPwa, setShowPwa] = useState(false);
  const [deferred, setDeferred] = useState<any>(null);

  useEffect(() => {
    try {
      const now = new Date(); const today = now.toISOString().slice(0, 10);
      const y = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
      const s = JSON.parse(localStorage.getItem('tv_streak') || '{"count":1,"lastDate":""}');
      if (s.lastDate === today) setStreak(s.count || 1);
      else if (s.lastDate === y) { const ns = { count: (s.count || 1) + 1, lastDate: today }; localStorage.setItem('tv_streak', JSON.stringify(ns)); setStreak(ns.count); }
      else { localStorage.setItem('tv_streak', JSON.stringify({ count: 1, lastDate: today })); setStreak(1); }
      setRecent(JSON.parse(localStorage.getItem('tv_recently_watched') || '[]'));
      setRecentSearches(JSON.parse(localStorage.getItem('tv_recent_searches') || '[]'));
      setFavs(JSON.parse(localStorage.getItem('tv_favorites') || '[]'));
      if (localStorage.getItem('pwa_banner_dismissed') !== '1') setShowPwa(true);
    } catch {}
  }, []);

  useEffect(() => {
    const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); setShowPwa(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = searchInput.trim();
      if (q.length < 2) { setSearchResults([]); return; }
      try {
        const r = await fetch(`/api/channels?search=${encodeURIComponent(q)}`, { cache: 'no-store' });
        const d = await r.json();
        setSearchResults((Array.isArray(d) ? d : d.channels || []).slice(0, 6));
        const list = JSON.parse(localStorage.getItem('tv_recent_searches') || '[]');
        const next = [q, ...list.filter((x: string) => x !== q)].slice(0, 5);
        localStorage.setItem('tv_recent_searches', JSON.stringify(next));
        setRecentSearches(next);
      } catch {}
    }, 280);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 8000);
    try {
      const q = new URLSearchParams();
      if (activeCat !== 'all') q.set('category', activeCat);
      if (search) q.set('search', search);
      const [ch, catsR, top] = await Promise.all([
        fetch(`/api/channels${q.toString() ? '?' + q.toString() : ''}`, { cache: 'no-store', signal: ctrl.signal }).then((r) => r.json()),
        fetch('/api/categories', { cache: 'no-store', signal: ctrl.signal }).then((r) => r.json()),
        fetch('/api/top-live', { cache: 'no-store', signal: ctrl.signal }).then((r) => r.json()).catch(() => []),
      ]);
      setChannels(Array.isArray(ch) ? ch : ch.channels || []);
      setCats(Array.isArray(catsR) ? catsR : catsR.categories || []);
      const first = Array.isArray(top) && top[0];
      if (first) setHero(first);
    } catch {}
    setLoading(false);
    clearTimeout(to);
  }, [activeCat, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!hero) return;
    const tick = () => {
      if (hero.end_time) {
        const s = Math.max(0, Math.floor((new Date(hero.end_time).getTime() - Date.now()) / 1000));
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
        setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`);
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [hero]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('search-input')?.focus(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const toggleFav = (slug: string) => {
    const next = favs.includes(slug) ? favs.filter((s) => s !== slug) : [...favs, slug];
    setFavs(next);
    localStorage.setItem('tv_favorites', JSON.stringify(next));
  };

  const grouped = useMemo(() => {
    const m = new Map<string, ChannelItem[]>();
    for (const c of channels) { const k = c.category_slug || 'generale'; if (!m.has(k)) m.set(k, []); m.get(k)!.push(c); }
    return [...m.entries()];
  }, [channels]);

  const searchSubmit = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput.trim()); };

  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <section style={{ marginTop: 16, border: '1px solid #1f2430', borderRadius: 12, padding: 20, background: '#0d1017' }}>
          <h1 style={{ color: '#fff', margin: '0 0 8px' }}>CanaleTV Live — TV Online Gratuit</h1>
          <p style={{ color: '#8a93a6' }}>IN DIRECT ACUM {hero ? `— ${hero.name}` : ''} {countdown && <span>· se încheie în {countdown}</span>}</p>
          {hero && <Link href={`/watch/${hero.slug}`} style={{ display: 'inline-block', marginTop: 8, background: '#10b981', color: '#04130d', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>▶ Vizionează {hero.name} acum</Link>}
          <form onSubmit={searchSubmit} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <input id="search-input" value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setSearch(e.target.value.trim().length >= 2 ? e.target.value.trim() : ''); }} placeholder="Caută canal... (Ctrl+K)" style={{ flex: 1, background: '#151a24', color: '#fff', border: '1px solid #1f2430', borderRadius: 8, padding: 10 }} />
            <button type="submit" style={{ background: '#10b981', color: '#04130d', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>Caută</button>
          </form>
          {searchResults.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {searchResults.map((c) => <Link key={c.slug} href={`/watch/${c.slug}`} style={{ color: '#34d399', fontSize: 13 }}>{c.name}</Link>)}
            </div>
          )}
          {recentSearches.length > 0 && <p style={{ color: '#6b7486', fontSize: 12, marginTop: 8 }}>Căutări recente: {recentSearches.join(', ')}</p>}
          <p style={{ color: '#f59e0b', fontSize: 13, marginTop: 8 }}>🔥 Serie zilnică: {streak} {streak >= 100 ? '💎' : streak >= 30 ? '🥇' : streak >= 7 ? '🥈' : streak >= 3 ? '🥉' : ''}</p>
        </section>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <button onClick={() => setActiveCat('all')} style={{ background: activeCat === 'all' ? '#10b981' : '#151a24', color: activeCat === 'all' ? '#04130d' : '#fff', border: '1px solid #1f2430', borderRadius: 999, padding: '6px 12px', cursor: 'pointer' }}>Toate ({channels.length})</button>
          {cats.map((c) => <button key={c.slug} onClick={() => setActiveCat(c.slug)} style={{ background: activeCat === c.slug ? '#10b981' : '#151a24', color: activeCat === c.slug ? '#04130d' : '#fff', border: '1px solid #1f2430', borderRadius: 999, padding: '6px 12px', cursor: 'pointer' }}>{c.icon} {c.name} ({c.channel_count})</button>)}
        </div>

        {favs.length > 0 && <section style={{ marginTop: 20 }}><h2 style={{ color: '#fff' }}>❤️ Favoritele tale</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
            {channels.filter((c) => favs.includes(c.slug)).map((c) => <ChannelCard key={c.slug} c={c} fav onFav={toggleFav} />)}
          </div></section>}

        {recent.length > 0 && <section style={{ marginTop: 20 }}><h2 style={{ color: '#fff' }}>Vizualizate recent</h2><p style={{ color: '#8a93a6', fontSize: 13 }}>{recent.join(' · ')}</p></section>}

        {loading ? <p style={{ color: '#8a93a6', marginTop: 24 }}>Se încarcă...</p> : grouped.map(([slug, list]) => {
          const cat = cats.find((c) => c.slug === slug);
          return (
            <section key={slug} style={{ marginTop: 24 }}>
              <h2 style={{ color: '#fff' }}>{cat ? `${cat.icon} ${cat.name}` : slug}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                {list.map((c) => <ChannelCard key={c.slug} c={c} fav={favs.includes(c.slug)} onFav={toggleFav} />)}
              </div>
            </section>
          );
        })}

        <section style={{ marginTop: 40 }}>
          <h2 style={{ color: '#fff' }}>Întrebări frecvente</h2>
          {FAQS.map((f) => (
            <details key={f.q} style={{ border: '1px solid #1f2430', borderRadius: 8, padding: 12, marginBottom: 8, background: '#0d1017' }}>
              <summary style={{ color: '#fff', cursor: 'pointer' }}>{f.q}</summary>
              <p style={{ color: '#8a93a6' }}>{f.a}</p>
            </details>
          ))}
        </section>

        <section style={{ marginTop: 32 }}>
          <h2 style={{ color: '#fff' }}>Secțiuni utile</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: '#34d399' }}>
            <Link href="/ghid-tv" style={{ color: '#34d399' }}>Ghid TV</Link>
            <Link href="/azi" style={{ color: '#34d399' }}>Azi</Link>
            <Link href="/maine" style={{ color: '#34d399' }}>Mâine</Link>
            <Link href="/meci-live" style={{ color: '#34d399' }}>Meci Live</Link>
            <Link href="/program-saptamana" style={{ color: '#34d399' }}>Program Săptămână</Link>
            <Link href="/harta-tv" style={{ color: '#34d399' }}>Harta TV</Link>
            <Link href="/blog" style={{ color: '#34d399' }}>Blog</Link>
          </div>
        </section>

        {showPwa && (
          <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#0d1017', border: '1px solid #10b981', borderRadius: 10, padding: 14, display: 'flex', gap: 10, zIndex: 60 }}>
            <span style={{ color: '#fff', fontSize: 13 }}>📲 Instalează aplicația CanaleTV</span>
            {deferred && <button onClick={() => { deferred.prompt(); }} style={{ background: '#10b981', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Instalează</button>}
            <button onClick={() => { setShowPwa(false); localStorage.setItem('pwa_banner_dismissed', '1'); }} style={{ background: '#151a24', color: '#fff', border: '1px solid #1f2430', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Închide</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
