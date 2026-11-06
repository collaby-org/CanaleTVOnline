'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Channel } from '@/lib/store';

const SLOT_ICONS = ['▣', '◫', '⊞', '⊟'];
const HLS_CDN = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';

function loadHlsJs(): Promise<any> {
  const w = window as any;
  if (w.Hls) return Promise.resolve(w.Hls);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = HLS_CDN;
    s.onload = () => resolve(w.Hls);
    s.onerror = () => reject(new Error('hls.js load failed'));
    document.head.appendChild(s);
  });
}

interface SlotPlayerProps {
  channel: Channel;
  muted: boolean;
  onToggleMute: () => void;
  onRemove: () => void;
}

function SlotPlayer({ channel, muted, onToggleMute, onRemove }: SlotPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    setStatus('loading');
    const rawUrl = channel.stream_url;
    const url = rawUrl ? `/api/stream?url=${encodeURIComponent(rawUrl)}` : rawUrl;

    const playSafe = () => {
      video.play().catch(() => {});
    };

    const attachNative = () => {
      video.src = url;
      video.addEventListener('canplay', playSafe, { once: true });
      setStatus('ready');
      playSafe();
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      attachNative();
      return () => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }

    loadHlsJs()
      .then((Hls: any) => {
        if (cancelled) return;
        if (!Hls || !Hls.isSupported()) {
          attachNative();
          return;
        }
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 30 });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (cancelled) return;
          setStatus('ready');
          playSafe();
        });
        hls.on(Hls.Events.ERROR, (_ev: any, data: any) => {
          if (!data || cancelled) return;
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else {
              setStatus('error');
            }
          }
        });
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, nonce]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted, status, nonce]);

  const onVideoError = () => setStatus('error');

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: '#05070a', borderRadius: 10, overflow: 'hidden', border: '1px solid #1f2430', minHeight: 0 }}>
      <style>{`@keyframes ctv-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#0d1017', fontSize: 13 }}>
        {channel.logo ? (
          <img src={channel.logo} alt={channel.name} style={{ width: 26, height: 18, objectFit: 'contain', borderRadius: 2 }} />
        ) : (
          <span style={{ color: '#fff', fontWeight: 700 }} aria-hidden>📺</span>
        )}
        <span style={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{channel.name}</span>
        <span style={{ background: '#ff1e56', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>LIVE</span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Activează sunetul' : 'Oprește sunetul'}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15 }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Elimină ${channel.name}`}
          style={{ background: 'transparent', border: 'none', color: '#9aa5b1', cursor: 'pointer', fontSize: 15 }}
        >
          ✕
        </button>
      </div>

      {/* video area */}
      <div style={{ position: 'relative', flex: 1, background: '#000', minHeight: 0 }}>
        <video
          ref={videoRef}
          muted={muted}
          playsInline
          preload="metadata"
          onError={onVideoError}
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
        />
        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)' }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: '50%',
                border: '4px solid #1f2430', borderTopColor: '#10b981',
                animation: 'ctv-spin 0.9s linear infinite',
              }}
            />
          </div>
        )}
        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', background: 'rgba(5,7,10,.88)', padding: 16, textAlign: 'center' }}>
            <span style={{ color: '#fff', fontSize: 16 }}>⚠️ Stream indisponibil</span>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontWeight: 700 }}
            >
              Reîncearcă
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Multistream({ channels }: { channels: Channel[] }) {
  const [count, setCount] = useState(2);
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [audible, setAudible] = useState<number | null>(null);

  // prefill via ?a={slug}&b={slug}
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get('a');
    const b = params.get('b');
    if (a || b) {
      const valid = (s: string | null) =>
        s && channels.some((c) => c.slug === s) ? s : null;
      setSlots([valid(a), valid(b), null, null]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, { slug: string; name: string }>();
    for (const c of channels) {
      if (c.category_slug && !map.has(c.category_slug)) {
        map.set(c.category_slug, { slug: c.category_slug, name: c.category_name || c.category_slug });
      }
    }
    return Array.from(map.values());
  }, [channels]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return channels
      .filter((c) => (cat ? c.category_slug === cat : true))
      .filter((c) => (!q || c.name.toLowerCase().includes(q)))
      .slice(0, 48);
  }, [channels, search, cat]);

  const toggleChannel = (slug: string) => {
    const existing = slots.indexOf(slug);
    if (existing !== -1) {
      setSlots(slots.map((s, i) => (i === existing ? null : s)));
      if (audible === existing) setAudible(null);
      return;
    }
    const free = slots.findIndex((s, i) => i < count && s === null);
    if (free !== -1) {
      setSlots(slots.map((s, i) => (i === free ? slug : s)));
      return;
    }
    if (count < 4) {
      setCount(count + 1);
      setSlots(slots.map((s, i) => (i === count ? slug : s)));
    }
  };

  const removeSlot = (idx: number) => {
    setSlots(slots.map((s, i) => (i === idx ? null : s)));
    if (audible === idx) setAudible(null);
  };

  const toggleMute = (idx: number) => {
    setAudible((prev) => (prev === idx ? null : idx));
  };

  const cols = count === 1 ? '1fr' : '1fr 1fr';
  const rows = count <= 2 ? '1fr' : '1fr 1fr';

  return (
    <section>
      {/* slot count switcher */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCount(n)}
            aria-pressed={count === n}
            style={{
              background: count === n ? '#10b981' : '#141922',
              color: '#fff', border: '1px solid #1f2430', borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer', fontSize: 15,
            }}
          >
            {SLOT_ICONS[n - 1]} {n}
          </button>
        ))}
        <span style={{ color: '#8a93a6', fontSize: 13 }}>până la 4 canale simultan</span>
      </div>

      {/* slots grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cols,
          gridTemplateRows: rows,
          gap: 12,
          height: count <= 2 ? 380 : 500,
          marginTop: 12,
        }}
      >
        {slots.slice(0, count).map((slug, i) => {
          const ch = slug ? channels.find((c) => c.slug === slug) ?? null : null;
          const style: React.CSSProperties =
            count === 3 && i === 2 ? { gridColumn: '1 / span 2' } : {};
          if (!ch) {
            return (
              <div
                key={i}
                style={{
                  ...style,
                  border: '2px dashed #2a3347', borderRadius: 10,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, background: '#0b0e14', minHeight: 0,
                }}
              >
                <span style={{ fontSize: 30 }} aria-hidden>📺</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>Slot {i + 1}</span>
                <span style={{ color: '#8a93a6', fontSize: 13, padding: '0 12px', textAlign: 'center' }}>
                  Alege un canal din lista de jos
                </span>
              </div>
            );
          }
          return (
            <div key={i} style={{ ...style, minHeight: 0, display: 'flex' }}>
              <SlotPlayer
                channel={ch}
                muted={audible !== i}
                onToggleMute={() => toggleMute(i)}
                onRemove={() => removeSlot(i)}
              />
            </div>
          );
        })}
      </div>

      <p style={{ color: '#8a93a6', fontSize: 13, marginTop: 10 }}>
        🔊 Un singur canal poate fi activ cu sunet — click 🔇 pentru activare/dezactivare
      </p>

      {/* filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Caută canal…"
          aria-label="Caută canal"
          style={{ flex: '1 1 220px', background: '#0d1017', border: '1px solid #1f2430', borderRadius: 8, color: '#fff', padding: '10px 14px' }}
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="Filtrează după categorie"
          style={{ background: '#0d1017', border: '1px solid #1f2430', borderRadius: 8, color: '#fff', padding: '10px 14px' }}
        >
          <option value="">Toate categoriile</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* channel list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginTop: 14 }}>
        {filtered.map((c) => {
          const active = slots.includes(c.slug);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleChannel(c.slug)}
              aria-pressed={active}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                background: active ? 'rgba(16,185,129,.18)' : '#0d1017',
                border: active ? '1px solid #10b981' : '1px solid #1f2430',
                borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: '#fff',
              }}
            >
              {c.logo ? (
                <img src={c.logo} alt="" style={{ width: 30, height: 20, objectFit: 'contain', borderRadius: 2 }} />
              ) : (
                <span aria-hidden>{c.category_icon || '📺'}</span>
              )}
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                <span style={{ color: '#8a93a6', fontSize: 11 }}>{c.category_name}</span>
              </span>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p style={{ color: '#8a93a6', marginTop: 12 }}>Niciun canal nu corespunde criteriilor.</p>
      )}
    </section>
  );
}
