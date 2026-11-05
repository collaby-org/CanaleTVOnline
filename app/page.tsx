'use client';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFakeViews } from '@/lib/hooks';

interface ChannelItem {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  category_slug?: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  epg_title?: string;
  views?: number;
  start_time?: string;
  end_time?: string;
  is_featured?: number;
}

interface CategoryItem {
  slug: string;
  name: string;
  icon: string;
  color: string;
  channel_count: number;
}

function ChannelCard({ c, fav, onFav }: { c: ChannelItem; fav: boolean; onFav: (id: number) => void }) {
  const { formatted } = useFakeViews(c);
  const router = useRouter();
  const go = () => {
    router.push(`/watch/${c.slug}`);
  };
  const featured = Number((c as { is_featured?: unknown }).is_featured) === 1;
  return (
    <div
      className="channel-card"
      onClick={go}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') go();
      }}
      aria-label={`Urmărește ${c.name} live`}
    >
      <div className="channel-media">
        {c.logo ? (
          <img src={c.logo} alt={c.name} loading="lazy" />
        ) : (
          <span style={{ color: '#8a93a6', fontWeight: 800, fontSize: 28 }}>{c.name?.slice(0, 2)}</span>
        )}
        <span className="badge-live" style={{ position: 'absolute', top: 8, left: 8 }}>
          ● LIVE
        </span>
        <span style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          {featured && (
            <span aria-label="Canal recomandat" title="Recomandat" style={{ fontSize: 15, lineHeight: 1 }}>
              👑
            </span>
          )}
          <button
            className="fav-btn"
            onClick={(e) => {
              e.stopPropagation();
              onFav(c.id);
            }}
            aria-label={fav ? 'Elimină de la favorite' : 'Adaugă la favorite'}
            title={fav ? 'Elimină de la favorite' : 'Adaugă la favorite'}
          >
            {fav ? '❤️' : '🤍'}
          </button>
        </span>
      </div>
      <div className="channel-bar" style={{ background: `linear-gradient(90deg, ${c.category_color || '#10b981'}, #f59e0b)` }} />
      <div className="channel-body">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div className="channel-name">{c.name}</div>
          <span className="channel-views" title={`${formatted} telespectatori`}>
            ◆ {formatted}
          </span>
        </div>
        <div className="channel-epg">{c.epg_title || 'Program live'}</div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="channel-grid" style={{ marginTop: 24 }} aria-busy="true" aria-label="Se încarcă canalele">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton shimmer" style={{ height: 96, borderRadius: 8 }} />
          <div className="skeleton shimmer" style={{ height: 16, width: '70%', marginTop: 10 }} />
          <div className="skeleton shimmer" style={{ height: 12, width: '50%', marginTop: 8 }} />
        </div>
      ))}
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

const HERO_SLUGS = ['protv', 'antena-1', 'kanal-d', 'tvr1', 'prima-tv'];

function minsLeftNum(end?: string): number | null {
  if (!end) return null;
  const ms = new Date(end).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / 60000));
}

function progressPct(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const n = Date.now();
  if ([s, e].some(Number.isNaN) || e <= s) return 0;
  return Math.min(100, Math.max(0, ((n - s) / (e - s)) * 100));
}

export default function Home() {
  const [cats, setCats] = useState<CategoryItem[]>([]);
  const [activeCat, setActiveCat] = useState('all');
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<ChannelItem[]>([]);
  const [favs, setFavs] = useState<number[]>([]);
  const [hero, setHero] = useState<ChannelItem | null>(null);
  const [topLive, setTopLive] = useState<ChannelItem[]>([]);
  const [nowMap, setNowMap] = useState<Record<string, ChannelItem>>({});
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(1);
  const [recent, setRecent] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showPwa, setShowPwa] = useState(false);
  const [deferred, setDeferred] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'categorized' | 'grid'>('categorized');
  const router = useRouter();

  const surprise = () => {
    const pool = channels.length > 0 ? channels : topLive;
    if (pool.length === 0) return;
    const c = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/watch/${c.slug}`);
  };

  useEffect(() => {
    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const y = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
      const s = JSON.parse(localStorage.getItem('tv_streak') || '{"count":1,"lastDate":""}');
      if (s.lastDate === today) setStreak(s.count || 1);
      else if (s.lastDate === y) {
        const ns = { count: (s.count || 1) + 1, lastDate: today };
        localStorage.setItem('tv_streak', JSON.stringify(ns));
        setStreak(ns.count);
      } else {
        localStorage.setItem('tv_streak', JSON.stringify({ count: 1, lastDate: today }));
        setStreak(1);
      }
      const rw = JSON.parse(localStorage.getItem('tv_recently_watched') || '[]');
      setRecent(Array.isArray(rw) ? rw.map(String) : []);
      setRecentSearches(JSON.parse(localStorage.getItem('tv_recent_searches') || '[]'));
      const rawFavs = JSON.parse(localStorage.getItem('tv_favorites') || '[]');
      setFavs((Array.isArray(rawFavs) ? rawFavs : []).map(Number).filter((n: number) => Number.isFinite(n)));
      if (localStorage.getItem('pwa_banner_dismissed') !== '1') setShowPwa(true);
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      const q = params.get('search');
      if (cat) setActiveCat(cat);
      if (q) {
        setSearchInput(q);
        setSearch(q);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onPrompt = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      setShowPwa(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = searchInput.trim();
      if (q.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const r = await fetch(`/api/channels?search=${encodeURIComponent(q)}`, { cache: 'no-store' });
        const d = await r.json();
        const arr = Array.isArray(d) ? d : d.items || d.channels || [];
        setSearchResults((arr as ChannelItem[]).slice(0, 6));
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
      const [ch, catsR, top, now] = await Promise.all([
        fetch(`/api/channels${q.toString() ? '?' + q.toString() : ''}`, { cache: 'no-store', signal: ctrl.signal }).then((r) => r.json()),
        fetch('/api/categories', { cache: 'no-store', signal: ctrl.signal }).then((r) => r.json()).catch(() => []),
        fetch('/api/top-live', { cache: 'no-store', signal: ctrl.signal }).then((r) => r.json()).catch(() => []),
        fetch('/api/now-on-tv', { cache: 'no-store', signal: ctrl.signal }).then((r) => r.json()).catch(() => []),
      ]);
      const list = Array.isArray(ch) ? ch : ch.items || ch.channels || [];
      setChannels(list as ChannelItem[]);
      const catList = Array.isArray(catsR) ? catsR : catsR.categories || [];
      setCats(catList as CategoryItem[]);
      const topArr = (Array.isArray(top) ? top : []) as ChannelItem[];
      setTopLive(topArr);
      const map: Record<string, ChannelItem> = {};
      for (const item of ((Array.isArray(now) ? now : []) as ChannelItem[])) map[item.slug] = item;
      for (const item of topArr) map[item.slug] = item;
      for (const item of (list as ChannelItem[])) map[item.slug] = item;
      setNowMap(map);
      if (topArr.length > 0) setHero((prev) => prev || topArr.find((c) => c.slug === 'protv') || topArr[0]);
    } catch {}
    setLoading(false);
    clearTimeout(to);
  }, [activeCat, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!hero?.end_time) return;
    const tick = () => setHero((h) => (h ? { ...h } : h));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [hero]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const toggleFav = (id: number) => {
    const next = favs.includes(id) ? favs.filter((s) => s !== id) : [...favs, id];
    setFavs(next);
    localStorage.setItem('tv_favorites', JSON.stringify(next));
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem('tv_recently_watched');
    } catch {}
    setRecent([]);
  };

  const searchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const heroTabs = useMemo(() => {
    if (topLive.length === 0) return [];
    const bySlug = new Map(topLive.map((c) => [c.slug, c]));
    const ordered = HERO_SLUGS.map((s) => bySlug.get(s)).filter(Boolean) as ChannelItem[];
    return ordered.length > 0 ? ordered : topLive.slice(0, 5);
  }, [topLive]);

  const grouped = useMemo(() => {
    const m = new Map<string, ChannelItem[]>();
    for (const c of channels) {
      const k = c.category_slug || 'generale';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    }
    return [...m.entries()];
  }, [channels]);

  const totalAll = useMemo(() => {
    const sum = cats.reduce((a, c) => a + (c.channel_count || 0), 0);
    if (sum > 0) return sum;
    return channels.length > 0 ? channels.length : 83;
  }, [cats, channels.length]);

  const mins = hero ? minsLeftNum(hero.end_time) : null;
  const pct = hero ? progressPct(hero.start_time, hero.end_time) : 0;

  const showGrouped = viewMode === 'categorized' && activeCat === 'all' && !search;

  return (
    <main className="page-wrap" style={{ paddingBottom: 8 }}>
      {/* HERO */}
      <section className="hero-card" style={{ marginTop: 16, padding: 20, position: 'relative' }}>
        <div className="hero-card-inner" style={{ position: 'relative', padding: 4, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 88,
              height: 88,
              flexShrink: 0,
              background: '#151a24',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
            }}
          >
            {hero?.logo ? (
              <img src={hero.logo} alt={hero.name} width={88} height={88} style={{ width: 88, height: 88, objectFit: 'contain', padding: 8 }} />
            ) : (
              <span style={{ color: '#8a93a6', fontWeight: 800, fontSize: 22 }}>📺</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="hero-live-line">
              <span className="badge-live">● LIVE</span>
              <span>
                IN DIRECT ACUM <strong>{hero ? hero.name : '—'}</strong>
                {mins !== null && hero && (
                  <span>
                    {' '}
                    · <span className="mins">{mins}m rămase</span>
                  </span>
                )}
              </span>
              <span style={{ color: '#8a93a6', fontWeight: 400 }}>· {hero?.epg_title ? '' : ''}</span>
            </div>
            <h1 className="hero-epg-title" style={{ marginTop: 8 }}>
              {hero ? hero.epg_title || 'Program live' : 'Se încarcă programul live…'}
            </h1>
            <div className="hero-progress" style={{ marginTop: 10 }} aria-label="Progres program curent" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
              <div className="hero-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p style={{ color: '#8a93a6', fontSize: 13, margin: '6px 0 0' }}>
              {hero
                ? `Acum la ${hero.name} · ${hero.category_name || ''}${mins !== null ? ` · se încheie în ${mins}m` : ''}`
                : 'TV Online Gratuit — cele mai populare canale din România'}
            </p>

            {heroTabs.length > 0 && (
              <div className="hero-tabs" style={{ marginTop: 12 }}>
                {heroTabs.map((t) => (
                  <button key={t.slug} className={hero?.slug === t.slug ? 'hero-tab hero-tab-active' : 'hero-tab'} onClick={() => setHero(t)} type="button">
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              {hero && (
                <Link className="btn-primary" href={`/watch/${hero.slug}`}>
                  ▶ Urmărește Live
                </Link>
              )}
              {hero && (
                <Link className="btn-ghost" href={`/multistream?a=${hero.slug}`}>
                  ⚡ Mini-Player
                </Link>
              )}
              <button className="btn-gold" onClick={surprise} type="button">
                🏆 Surpriză
              </button>
            </div>
            <p style={{ color: '#f59e0b', fontSize: 13, margin: '10px 0 0', fontWeight: 700 }}>
              🔥 Serie zilnică: {streak} {streak >= 100 ? '💎' : streak >= 30 ? '🥇' : streak >= 7 ? '🥈' : streak >= 3 ? '🥉' : ''}
            </p>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section style={{ marginTop: 16 }}>
        <form onSubmit={searchSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            id="search-input"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              const v = e.target.value.trim();
              setSearch(v.length >= 2 ? v : '');
            }}
            placeholder="Caută canal... (Ctrl+K)"
            aria-label="Caută canal"
            style={{ flex: 1, background: '#0f1520', color: '#e8ecf4', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '11px 14px', outline: 'none', fontSize: 14 }}
          />
          <button type="submit" className="btn-primary">
            Caută
          </button>
        </form>
        {searchResults.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {searchResults.map((c) => (
              <Link key={c.slug} href={`/watch/${c.slug}`} style={{ color: '#34d399', fontSize: 13 }}>
                {c.name}
              </Link>
            ))}
          </div>
        )}
        {recentSearches.length > 0 && (
          <p style={{ color: '#6b7486', fontSize: 12, marginTop: 8 }}>
            Căutări recente:{' '}
            {recentSearches.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchInput(s);
                  setSearch(s);
                }}
                style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: 12, padding: 0, marginRight: 4 }}
              >
                {s}
              </button>
            ))}
          </p>
        )}
      </section>

      {/* VIZIONATE RECENT */}
      {recent.length > 0 && (
        <section style={{ marginTop: 16 }} aria-label="Vizualizate recent">
          <div className="recent-bar">
            <span className="recent-label">VIZIONATE RECENT</span>
            {recent.slice(0, 8).map((slug) => {
              const ch = nowMap[slug];
              return (
                <Link key={slug} className="recent-chip" href={`/watch/${slug}`}>
                  {ch?.logo && <img src={ch.logo} alt="" width={24} height={24} style={{ objectFit: 'contain', background: '#151a24', borderRadius: 6 }} />}
                  <span>{ch ? ch.name : slug}</span>
                </Link>
              );
            })}
            <button className="recent-clear" onClick={clearRecent} type="button">
              Șterge
            </button>
          </div>
        </section>
      )}

      {/* CATEGORY PILLS */}
      <section style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            <button className={activeCat === 'all' ? 'cat-chip cat-chip-active' : 'cat-chip'} onClick={() => setActiveCat('all')} type="button">
              🗂️ Toate <span className="count-bubble">{totalAll}</span>
            </button>
            {cats
              .filter((c) => c.channel_count > 0)
              .map((c) => (
                <button key={c.slug} className={activeCat === c.slug ? 'cat-chip cat-chip-active' : 'cat-chip'} onClick={() => setActiveCat(c.slug)} type="button">
                  {c.icon} {c.name} <span className="count-bubble">{c.channel_count}</span>
                </button>
              ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className={viewMode === 'categorized' ? 'view-toggle view-toggle-active' : 'view-toggle'} onClick={() => setViewMode('categorized')} type="button">
              Categorii
            </button>
            <button className={viewMode === 'grid' ? 'view-toggle view-toggle-active' : 'view-toggle'} onClick={() => setViewMode('grid')} type="button">
              Grilă
            </button>
          </div>
        </div>
      </section>

      {favs.length > 0 && channels.filter((c) => favs.includes(c.id)).length > 0 && (
        <section style={{ marginTop: 24 }}>
          <div className="section-head">
            <h2 className="section-title">
              ❤️ Favoritele tale <span className="section-count">{channels.filter((c) => favs.includes(c.id)).length}</span>
            </h2>
          </div>
          <div className="channel-grid" style={{ marginTop: 12 }}>
            {channels
              .filter((c) => favs.includes(c.id))
              .map((c) => (
                <ChannelCard key={c.slug} c={c} fav onFav={toggleFav} />
              ))}
          </div>
        </section>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : showGrouped ? (
        grouped.map(([slug, list]) => {
          const cat = cats.find((c) => c.slug === slug);
          return (
            <section key={slug} style={{ marginTop: 28 }}>
              <div className="section-head">
                <h2 className="section-title">
                  {cat ? `${cat.icon} ${cat.name}` : slug} <span className="section-count">{list.length}</span>
                </h2>
                <Link className="section-link" href={`/categorie/${cat ? cat.slug : slug}`}>
                  Vezi toate →
                </Link>
              </div>
              <div className="channel-grid" style={{ marginTop: 12 }}>
                {list.map((c) => (
                  <ChannelCard key={c.slug} c={c} fav={favs.includes(c.id)} onFav={toggleFav} />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <section style={{ marginTop: 28 }}>
          <div className="section-head">
            <h2 className="section-title">
              {activeCat === 'all' ? '🗂️ Toate' : cats.find((c) => c.slug === activeCat)?.name || activeCat} <span className="section-count">{channels.length}</span>
            </h2>
            {activeCat !== 'all' && (
              <Link className="section-link" href={`/categorie/${activeCat}`}>
                Vezi toate →
              </Link>
            )}
          </div>
          {channels.length === 0 ? (
            <p style={{ color: '#8a93a6', marginTop: 12 }}>Niciun canal găsit.</p>
          ) : (
            <div className="channel-grid" style={{ marginTop: 12 }}>
              {channels.map((c) => (
                <ChannelCard key={c.slug} c={c} fav={favs.includes(c.id)} onFav={toggleFav} />
              ))}
            </div>
          )}
        </section>
      )}

      <section style={{ marginTop: 40 }}>
        <h2 style={{ color: '#fff', margin: '0 0 12px' }}>Întrebări frecvente</h2>
        {FAQS.map((f) => (
          <details key={f.q} className="faq-item" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 8, background: '#0d1017' }}>
            <summary style={{ color: '#fff', cursor: 'pointer', listStyle: 'none' }}>
              <span className="faq-marker">▶</span> {f.q}
            </summary>
            <p style={{ color: '#8a93a6', margin: '8px 0 0' }}>{f.a}</p>
          </details>
        ))}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ color: '#fff', margin: '0 0 12px' }}>Secțiuni utile</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/ghid-tv" style={{ color: '#34d399' }}>
            Ghid TV
          </Link>
          <Link href="/azi" style={{ color: '#34d399' }}>
            Azi
          </Link>
          <Link href="/maine" style={{ color: '#34d399' }}>
            Mâine
          </Link>
          <Link href="/meci-live" style={{ color: '#34d399' }}>
            Meci Live
          </Link>
          <Link href="/program-saptamana" style={{ color: '#34d399' }}>
            Program Săptămână
          </Link>
          <Link href="/harta-tv" style={{ color: '#34d399' }}>
            Harta TV
          </Link>
          <Link href="/blog" style={{ color: '#34d399' }}>
            Blog
          </Link>
        </div>
      </section>

      {showPwa && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#0d1017', border: '1px solid #10b981', borderRadius: 12, padding: 14, display: 'flex', gap: 10, zIndex: 60, alignItems: 'center', maxWidth: 'calc(100vw - 24px)' }}>
          <span style={{ color: '#fff', fontSize: 13 }}>📲 Instalează aplicația CanaleTV</span>
          {deferred && (
            <button
              onClick={() => {
                deferred.prompt?.();
              }}
              style={{ background: '#10b981', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: '#04130d', fontWeight: 700 }}
            >
              Instalează
            </button>
          )}
          <button
            onClick={() => {
              setShowPwa(false);
              try {
                localStorage.setItem('pwa_banner_dismissed', '1');
              } catch {}
            }}
            style={{ background: '#151a24', color: '#fff', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
          >
            Închide
          </button>
        </div>
      )}
    </main>
  );
}
