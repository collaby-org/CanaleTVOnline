'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from './Providers';
import { T } from '@/lib/i18n';

interface ChannelHit {
  id?: number;
  name: string;
  slug: string;
  category_name?: string;
  category_slug?: string;
  epg_title?: string;
  [key: string]: unknown;
}

/**
 * Ctrl/Cmd+K command palette. Fetches /api/channels and filters by
 * name/category/epg includes query, slice 12. Esc closes.
 */
export default function CommandPalette() {
  const { lang } = useLang();
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [channels, setChannels] = useState<ChannelHit[]>([]);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Load channels once when opened
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (channels.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/channels', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as ChannelHit[];
        if (!cancelled && Array.isArray(data)) {
          setChannels(data);
          setTotal(data.length);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const results = useCallback(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channels.slice(0, 12);
    return channels
      .filter(
        (c) =>
          String(c.name || '').toLowerCase().includes(q) ||
          String(c.category_name || '').toLowerCase().includes(q) ||
          String(c.category_slug || '').toLowerCase().includes(q) ||
          String(c.epg_title || '').toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [channels, query]);

  if (!open) return null;

  const hits = results();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 92vw)',
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter' && hits[0]) {
              window.location.href = '/watch/' + encodeURIComponent(hits[0].slug);
            }
          }}
          placeholder={t.search}
          aria-label={t.search}
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: 16,
            background: 'transparent',
            color: 'var(--c-text)',
            border: 'none',
            borderBottom: '1px solid var(--c-border)',
            outline: 'none',
          }}
        />
        <ul style={{ listStyle: 'none', margin: 0, padding: 8, maxHeight: 360, overflowY: 'auto' }}>
          {hits.map((c) => (
            <li key={c.slug}>
              <Link
                href={'/watch/' + encodeURIComponent(c.slug)}
                onClick={() => setOpen(false)}
                style={{ display: 'flex', gap: 10, padding: '9px 10px', borderRadius: 10, fontSize: 14 }}
              >
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <span style={{ color: 'var(--c-text-dim)', marginLeft: 'auto' }}>
                  {String(c.category_name || '')}
                </span>
              </Link>
            </li>
          ))}
          {hits.length === 0 && (
            <li style={{ padding: '16px 10px', color: 'var(--c-text-dim)', fontSize: 14 }}>
              {total === 0 ? '…' : lang === 'ro' ? 'Niciun canal găsit.' : 'No channels found.'}
            </li>
          )}
        </ul>
        <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--c-text-dim)', borderTop: '1px solid var(--c-border)' }}>
          Ctrl/⌘ K — {lang === 'ro' ? 'deschide/închide' : 'toggle'} · Esc — {lang === 'ro' ? 'închide' : 'close'}
        </div>
      </div>
    </div>
  );
}
