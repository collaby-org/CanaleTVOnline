'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import { useLang } from './Providers';
import { T } from '@/lib/i18n';

export default function Header() {
  const { lang, toggle } = useLang();
  const t = T[lang];
  const [q, setQ] = useState('');

  useEffect(() => {
    try {
      const v = localStorage.getItem('tv_lang');
      if (v === 'en' || v === 'ro') {
        /* lang state sync handled by LangProvider */
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) window.location.href = '/?search=' + encodeURIComponent(term);
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

      <form onSubmit={onSearch} style={{ flex: 1, maxWidth: 420, display: 'flex' }} role="search">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
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

      <nav style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto', flexShrink: 0 }}>
        <Link href="/ghid-tv" style={{ fontSize: 14 }}>
          {t.tvGuide}
        </Link>
        <Link href="/azi" style={{ fontSize: 14 }}>
          {t.nowOnTv}
        </Link>
        <Link href="/?favorites=1" style={{ fontSize: 14 }} aria-label={t.favorites}>
          🤍 {t.favorites}
        </Link>
        <button
          type="button"
          onClick={toggle}
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
