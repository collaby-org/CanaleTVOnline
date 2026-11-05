'use client';

import { useEffect, useState } from 'react';

interface Announcement {
  id?: string | number;
  icon?: string;
  title?: string;
  body?: string;
  link?: string;
  link_label?: string;
  bg_color?: string;
  text_color?: string;
  [key: string]: unknown;
}

const DISMISSED_KEY = 'dismissed_announcements';

export default function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/announcements', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as Announcement[];
        if (cancelled || !Array.isArray(data)) return;
        let dismissed: string[] = [];
        try {
          dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as string[];
        } catch {
          dismissed = [];
        }
        setItems(data.filter((a) => !dismissed.includes(String(a.id ?? ''))));
      } catch {
        /* no banner */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = (id: string | number) => {
    setItems((prev) => prev.filter((a) => String(a.id) !== String(id)));
    try {
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as string[];
      dismissed.push(String(id));
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    } catch {
      /* ignore */
    }
  };

  if (!items.length) return null;

  return (
    <div role="region" aria-label="Announcements">
      {items.map((a) => (
        <div
          key={String(a.id ?? a.title ?? Math.random())}
          style={{
            background: a.bg_color || 'var(--c-surface)',
            color: a.text_color || 'var(--c-text)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            borderBottom: '1px solid var(--c-border)',
          }}
        >
          <span aria-hidden>{a.icon || '📣'}</span>
          <span style={{ flex: 1 }}>
            {a.title ? <strong>{a.title}</strong> : null}
            {a.title && a.body ? ' — ' : null}
            {a.body || ''}
            {a.link ? (
              <>
                {' '}
                <a href={a.link} target="_blank" rel="noopener noreferrer">
                  {a.link_label || a.link}
                </a>
              </>
            ) : null}
          </span>
          <button
            type="button"
            aria-label="Închide anunțul"
            onClick={() => dismiss(a.id ?? '')}
            style={{
              background: 'transparent',
              border: '1px solid currentColor',
              borderRadius: 8,
              color: 'inherit',
              cursor: 'pointer',
              padding: '4px 10px',
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
