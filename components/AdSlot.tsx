'use client';

import { useEffect, useRef, useState } from 'react';

interface AdItem {
  type?: string;
  html?: string;
  image?: string;
  link?: string;
  alt?: string;
  [key: string]: unknown;
}

interface AdSlotProps {
  slot: string;
}

/**
 * Fetches /api/ads?slot= and renders the first item.
 * - type 'html' → innerHTML + re-created <script> tags
 * - otherwise <img> (maxHeight 90), wrapped in <a target _blank
 *   rel="noopener sponsored"> when a link is present.
 */
export default function AdSlot({ slot }: AdSlotProps) {
  const [ad, setAd] = useState<AdItem | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/ads?slot=' + encodeURIComponent(slot), { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as AdItem[];
        if (!cancelled && Array.isArray(data) && data[0]) setAd(data[0]);
      } catch {
        /* no ad */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slot]);

  // Re-create scripts for html ads.
  useEffect(() => {
    if (!ad || ad.type !== 'html' || !hostRef.current) return;
    const scripts = Array.from(hostRef.current.querySelectorAll('script'));
    scripts.forEach((old) => {
      const s = document.createElement('script');
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      if (old.textContent) s.textContent = old.textContent;
      old.parentNode?.replaceChild(s, old);
    });
  }, [ad]);

  if (!ad) return null;

  if (ad.type === 'html' && ad.html) {
    return <div ref={hostRef} style={{ textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: ad.html }} />;
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={String(ad.image || '')}
      alt={String(ad.alt || 'Advertisement')}
      style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto' }}
      loading="lazy"
    />
  );

  if (ad.link) {
    return (
      <div style={{ textAlign: 'center' }}>
        <a href={String(ad.link)} target="_blank" rel="noopener sponsored">
          {img}
        </a>
      </div>
    );
  }
  return <div style={{ textAlign: 'center' }}>{img}</div>;
}
