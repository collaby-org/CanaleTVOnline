'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import { useLang } from './Providers';

interface SearchHit { id: number; name: string; slug: string; logo?: string; category_name?: string; }

export default function Header() {
  const { lang, toggle } = useLang();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () => {
      try {
        const v = JSON.parse(localStorage.getItem('tv_favorites') || '[]');
        setFavCount(Array.isArray(v) ? v.length : 0);
      } catch { setFavCount(0); }
    };
    read();
    window.addEventListener('focus', read);
    window.addEventListener('storage', read);
    const t = setInterval(read, 3000);
    return () => { window.removeEventListener('focus', read); window.removeEventListener('storage', read); clearInterval(t); };
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (term.length < 2) { setResults([]); setOpen(false); return; }
      try {
        const r = await fetch(`/api/channels?search=${encodeURIComponent(term)}`, { cache: 'no-store' });
        const d = await r.json();
        setResults(((Array.isArray(d) ? d : d.channels || []) as SearchHit[]).slice(0, 6));
        setOpen(true);
      } catch { setResults([]); }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('header-search')?.focus(); }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) window.location.href = '/?search=' + encodeURIComponent(term);
  };

  const onToggleLang = () => {
    const next = lang === 'ro' ? 'en' : 'ro';
    try { localStorage.setItem('tv_lang', next); } catch {}
    toggle();
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 16px',
        background: 'rgba(8,9,12,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--c-border)',
      }}
    >
      <Link href="/" aria-label="CanaleTV Live — Acasă" style={{ flexShrink: 0 }}>
        <Logo size="md" />
      </Link>

      <div ref={boxRef} style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
        <form onSubmit={onSearch} role="search">
          <input
            id="header-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => { if (results.length) setOpen(true); }}
            placeholder="Caută canal... (Ctrl+K)"
            aria-label="Caută canal..."
            autoComplete="off"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid var(--c-border)',
              background: 'var(--c-surface)',
              color: 'var(--c-text)',
              outline: 'none',
            }}
          />
        </form>
        {open && q.trim().length >= 2 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 10, overflow: 'hidden', zIndex: 60 }}>
            {results.length === 0 ? (
              <p style={{ margin: 0, padding: '10px 12px', color: 'var(--c-text-dim)', fontSize: 13 }}>Niciun rezultat</p>
            ) : results.map((c) => (
              <Link key={c.slug} href={`/watch/${c.slug}`} onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 14 }}>
                {c.logo && <img src={c.logo} alt="" width={32} height={32} style={{ objectFit: 'contain', borderRadius: 4 }} />}
                <span style={{ flex: 1 }}>{c.name}</span>
                {c.category_name && <span style={{ color: 'var(--c-text-dim)', fontSize: 12 }}>{c.category_name}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto', flexShrink: 0 }}>
        <Link href="/ghid-tv" className="nav-link" style={{ fontSize: 14 }}>Ghid TV</Link>
        <Link href="/azi" className="nav-link" style={{ fontSize: 14 }}>Acum la TV</Link>
        <Link href="/?favorites=1" style={{ fontSize: 14 }} aria-label="Favorite">🤍{favCount > 0 ? ` ${favCount}` : ''}</Link>
        <button
          type="button"
          onClick={onToggleLang}
          aria-label="Switch language / Schimbă limba"
          title={lang === 'ro' ? 'Switch to English' : 'Schimbă pe română'}
          style={{
            background: 'var(--c-surface)',
            color: 'var(--c-text)',
            border: '1px solid var(--c-border)',
            borderRadius: 10,
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          🇬🇧
        </button>
      </nav>
    </header>
  );
}
