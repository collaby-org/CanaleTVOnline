'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import AdSlot from '@/components/AdSlot';
import { useLang } from '@/components/Providers';
import { T } from '@/lib/i18n';

// Only valid slug strings may reach /watch/ hrefs. This blocks polluted
// values like "[object Object]" (stringified channel objects) which made
// Next throw "Dynamic href /watch/[object Object]" for the /app router.
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
function isValidSlug(s: unknown): s is string {
  return typeof s === 'string' && SLUG_RE.test(s);
}
// Accepts a bare slug string or a legacy channel object { slug: string }.
function toSlug(v: unknown): string {
  if (typeof v === 'string') return SLUG_RE.test(v) ? v : '';
  if (v && typeof v === 'object') {
    const s = (v as { slug?: unknown }).slug;
    return typeof s === 'string' && SLUG_RE.test(s) ? s : '';
  }
  return '';
}

type Channel = {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  stream_url?: string;
  category_name?: string;
  category_slug?: string;
  category_icon?: string;
  category_color?: string;
  country?: string;
  views?: number;
};

type EpgEntry = {
  id: number | string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  category?: string;
};

type Stream = {
  id?: number;
  name: string;
  url: string;
  sort_order?: number;
};

type Rating = { count: number; avg: number; myRating: number };

type BlogPost = { id?: number | string; title: string; slug: string };

type RelatedChannel = {
  id: number | string;
  name: string;
  slug: string;
  logo?: string;
  epg_title?: string;
  category_name?: string;
  category_slug?: string;
  category_icon?: string;
};

interface WatchPlayerProps {
  channel: Channel;
  epg?: EpgEntry[];
  related?: RelatedChannel[];
  currentEpg?: EpgEntry | null;
  nextEpg?: EpgEntry | null;
  streams?: Stream[];
  initialRating?: Rating;
  blogPosts?: BlogPost[];
  prevSlug?: string;
  nextSlug?: string;
}

type PlayerStatus = 'loading' | 'buffering' | 'playing' | 'paused' | 'error';
type QualityLevel = { index: number; height: number; bitrate: number; label: string };

function fmtTime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function progressPct(startIso: string, endIso: string, now: number): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

const REPORT_ISSUES: Record<'ro' | 'en', string[]> = {
  ro: [
    'Stream nu pornește',
    'Imagine pixelată sau cu erori',
    'Fără sunet',
    'Buffering excesiv',
    'Canal greșit / alt conținut',
    'Altă problemă',
  ],
  en: [
    'Stream is not loading',
    'Pixelated or glitchy video',
    'No audio / sound issue',
    'Excessive buffering',
    'Wrong channel / content',
    'Other issue',
  ],
};

export default function WatchPlayer({
  channel,
  epg = [],
  related = [],
  currentEpg = null,
  nextEpg = null,
  streams = [],
  initialRating,
  blogPosts = [],
  prevSlug,
  nextSlug,
}: WatchPlayerProps) {
  // Normalize prev/next to plain slug strings (defends against a caller
  // passing a whole channel object which would stringify to [object Object]).
  const prev_slug = toSlug(prevSlug);
  const next_slug = toSlug(nextSlug);
  const { lang } = useLang();
  const t = T[lang] as Record<string, string>;
  const isRo = lang === 'ro';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<any>(null);
  const hlsLoadingRef = useRef(false);

  const servers: Stream[] =
    streams && streams.length > 0
      ? streams
      : [{ id: 0, name: 'Server 1', url: channel.stream_url || '' }];
  const [serverIdx, setServerIdx] = useState(0);
  const sourceUrl = servers[serverIdx]?.url || channel.stream_url || '';
  const proxiedSourceUrl = sourceUrl ? `/api/stream?url=${encodeURIComponent(sourceUrl)}` : '';

  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [theater, setTheater] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [liveLabel, setLiveLabel] = useState('HD');
  const [osd, setOsd] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [reportText, setReportText] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [castActive, setCastActive] = useState(false);
  const [toast, setToast] = useState('');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerQuery, setDrawerQuery] = useState('');
  const [drawerResults, setDrawerResults] = useState<RelatedChannel[]>([]);

  const [rating, setRating] = useState<Rating>(() => {
    const base = initialRating || { count: 0, avg: 0, myRating: 0 };
    try {
      const local = localStorage.getItem(`rating_${channel.id}`);
      if (local !== null) return { ...base, myRating: Number(local) || 0 };
    } catch {
      /* ignore */
    }
    return base;
  });
  const [hoverStar, setHoverStar] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [pushState, setPushState] = useState<'idle' | 'subscribed' | 'denied' | 'unsupported' | 'loading'>(
    'idle'
  );
  const [pinned, setPinned] = useState<Set<string | number>>(new Set());
  const [pinBusy, setPinBusy] = useState<number | string | null>(null);

  const osdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showOsd = useCallback((msg: string) => {
    setOsd(msg);
    if (osdTimer.current) clearTimeout(osdTimer.current);
    osdTimer.current = setTimeout(() => setOsd(''), 1800);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // -- lazy hls.js loader: script[src*=hls.js] check + 50ms poll --------------
  const loadHls = useCallback(() => {
    return new Promise<any>((resolve, reject) => {
      const w = window as any;
      if (w.Hls) {
        resolve(w.Hls);
        return;
      }
      if (hlsLoadingRef.current) {
        const poll = () => {
          if (w.Hls) resolve(w.Hls);
          else setTimeout(poll, 50);
        };
        poll();
        return;
      }
      hlsLoadingRef.current = true;
      const existing = document.querySelector('script[src*="hls.js"]');
      if (existing) {
        if (w.Hls) {
          resolve(w.Hls);
          return;
        }
        (existing as HTMLScriptElement).onload = () =>
          w.Hls ? resolve(w.Hls) : reject(new Error('HLS failed'));
        (existing as HTMLScriptElement).onerror = () => reject(new Error('HLS failed'));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
      script.async = true;
      script.onload = () => (w.Hls ? resolve(w.Hls) : reject(new Error('HLS load failed')));
      script.onerror = () => reject(new Error('HLS load failed'));
      document.head.appendChild(script);
    });
  }, []);

  // -- player lifecycle ------------------------------------------------------
  const startPlayer = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;
    setStatus('loading');
    setErrorMsg('');
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        /* ignore */
      }
      hlsRef.current = null;
    }
    setLevels([]);
    setCurrentLevel(-1);
    setLiveLabel('HD');

    try {
      const Hls = await loadHls();
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          enableWorker: true,
          xhrSetup: (xhr: XMLHttpRequest) => {
            xhr.withCredentials = true;
          },
        });
        hlsRef.current = hls;
        hls.loadSource(proxiedSourceUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_event: unknown, data: any) => {
          if (Array.isArray(data?.levels) && data.levels.length > 0) {
            const seen = new Set<number>();
            const list: QualityLevel[] = data.levels
              .map((level: any, index: number) => {
                const height = Number(level.height) || 0;
                return {
                  index,
                  height,
                  bitrate: Number(level.bitrate) || 0,
                  label: level.height
                    ? `${level.height}p${level.height >= 720 ? ' HD' : ''}`
                    : `Stream ${index + 1}`,
                };
              })
              .filter((level: QualityLevel) => {
                if (!level.height) return true;
                if (seen.has(level.height)) return false;
                seen.add(level.height);
                return true;
              })
              .sort((a: QualityLevel, b: QualityLevel) => b.height - a.height);
            setLevels(list);
            const top = list[0];
            if (top?.height) setLiveLabel(`${top.height}p`);
          } else {
            setLevels([]);
          }
          setCurrentLevel(-1);
          video.muted = true;
          setMuted(true);
          const pauseTimer = setTimeout(() => setStatus('paused'), 2000);
          video
            .play()
            .then(() => {
              clearTimeout(pauseTimer);
              setStatus('playing');
            })
            .catch(() => {
              clearTimeout(pauseTimer);
              setStatus('paused');
            });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event: unknown, data: any) => {
          const level = hls.levels?.[data?.level];
          if (level?.height) setLiveLabel(`${level.height}p`);
        });

        hls.on(Hls.Events.ERROR, (_event: unknown, data: any) => {
          if (data?.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              const code =
                data.response?.code ?? data.networkDetails?.status ?? data.code;
              const key = `ptv_reload_${channel.id}`;
              let already = false;
              try {
                already = sessionStorage.getItem(key) === '1';
              } catch {
                /* ignore */
              }
              if (Number(code) !== 403 || already) {
                try {
                  hls.startLoad();
                } catch {
                  /* ignore */
                }
              } else {
                try {
                  sessionStorage.setItem(key, '1');
                } catch {
                  /* ignore */
                }
                const sep = window.location.search ? '&' : '?';
                window.location.replace(
                  `${window.location.pathname}${window.location.search}${sep}_nc=${Date.now()}`
                );
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              try {
                hls.recoverMediaError();
              } catch {
                setStatus('error');
                setErrorMsg(isRo ? 'Stream-ul nu este disponibil momentan.' : 'The stream is temporarily unavailable.');
              }
            } else {
              setStatus('error');
              setErrorMsg(isRo ? 'Stream-ul nu este disponibil momentan.' : 'The stream is temporarily unavailable.');
            }
          } else if (data?.details === 'bufferStalledError') {
            setStatus('buffering');
          }
        });

        video.addEventListener('playing', () => setStatus('playing'));
        video.addEventListener('waiting', () => setStatus('buffering'));
        video.addEventListener('error', () => {
          setStatus('error');
          setErrorMsg(isRo ? 'Eroare la redare.' : 'Playback error.');
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = proxiedSourceUrl;
        const onCanPlay = () => {
          video.muted = true;
          setMuted(true);
          const pauseTimer = setTimeout(() => setStatus('paused'), 2000);
          video
            .play()
            .then(() => {
              clearTimeout(pauseTimer);
              setStatus('playing');
            })
            .catch(() => {
              clearTimeout(pauseTimer);
              setStatus('paused');
            });
        };
        video.addEventListener('canplay', onCanPlay, { once: true });
        video.addEventListener('error', () => {
          setStatus('error');
          setErrorMsg(isRo ? 'Stream indisponibil.' : 'Stream unavailable.');
        });
      } else {
        setStatus('error');
        setErrorMsg(isRo ? 'Browserul nu suportă HLS.' : 'Your browser does not support HLS.');
      }
    } catch {
      setStatus('error');
      setErrorMsg(isRo ? 'Nu s-a putut inițializa player-ul.' : 'Could not initialize the player.');
    }
  }, [channel.id, proxiedSourceUrl, loadHls, isRo]);

  useEffect(() => {
    startPlayer();
    return () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          /* ignore */
        }
        hlsRef.current = null;
      }
    };
  }, [startPlayer]);

  // Heartbeat for EPG progress %.
  useEffect(() => {
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  // -- favorites + recently watched -------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tv_favorites');
      if (raw) {
        const arr = JSON.parse(raw) as Array<number | string>;
        setIsFav(arr.includes(channel.id) || arr.includes(channel.slug));
      }
      const recentRaw: unknown = JSON.parse(localStorage.getItem('tv_recently_watched') || '[]');
      const next = [
        isValidSlug(channel.slug) ? channel.slug : String(channel.id ?? ''),
        ...(Array.isArray(recentRaw) ? recentRaw.map(toSlug) : []),
      ]
        .filter(isValidSlug)
        .filter((s, i, a) => a.indexOf(s) === i)
        .slice(0, 12);
      localStorage.setItem('tv_recently_watched', JSON.stringify(next));
    } catch {
      /* ignore */
    }
    try {
      const pinnedRaw = JSON.parse(localStorage.getItem('wl_pinned') || '[]') as Array<number | string>;
      setPinned(new Set(pinnedRaw));
    } catch {
      /* ignore */
    }
  }, [channel.id, channel.name, channel.slug, channel.logo, channel.category_name, channel.category_color, channel.views]);

  // -- ratings initial fetch -----------------------------------------------------
  useEffect(() => {
    fetch(`/api/ratings?channel_id=${channel.id}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setRating((prev) => {
          const next: Rating = {
            count: Number(d.count) || 0,
            avg: Number(d.avg) || 0,
            myRating: Number(d.myRating) || prev.myRating,
          };
          if (d.myRating) {
            try {
              localStorage.setItem(`rating_${channel.id}`, String(d.myRating));
            } catch {
              /* ignore */
            }
          }
          return next;
        });
      })
      .catch(() => {});
  }, [channel.id]);

  // -- push support detection -----------------------------------------------------
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushState('denied');
      return;
    }
    try {
      if (localStorage.getItem('push_subscribed') === '1') setPushState('subscribed');
    } catch {
      /* ignore */
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = true;
      setMuted(true);
      video.play().then(() => setStatus('playing')).catch(() => {});
      showOsd(isRo ? '▶ Redare' : '▶ Play');
    } else {
      video.pause();
      setStatus('paused');
      showOsd(isRo ? '⏸ Pauză' : '⏸ Pause');
    }
  }, [showOsd, isRo]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    setMuted((prev) => {
      const next = !prev;
      if (video) {
        video.muted = next;
        if (!next && video.volume === 0) video.volume = 1;
      }
      showOsd(next ? (isRo ? '🔇 Mut' : '🔇 Muted') : isRo ? '🔊 Sunet activ' : '🔊 Sound on');
      return next;
    });
  }, [showOsd, isRo]);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
      showOsd(isRo ? '⛶ Fullscreen' : '⛶ Fullscreen');
    } catch {
      /* ignore */
    }
  }, [showOsd, isRo]);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheater = useCallback(() => {
    setTheater((prev) => {
      showOsd(prev ? (isRo ? '🎬 Theater off' : '🎬 Theater off') : isRo ? '🎬 Theater' : '🎬 Theater');
      return !prev;
    });
  }, [showOsd, isRo]);

  const setVol = useCallback(
    (v: number) => {
      const video = videoRef.current;
      const clamped = Math.min(1, Math.max(0, v));
      if (video) {
        video.volume = clamped;
        video.muted = clamped === 0;
      }
      setVolume(clamped);
      setMuted(clamped === 0);
      const pct = Math.round(clamped * 100);
      const icon = pct > 60 ? '🔊' : pct > 20 ? '🔉' : '🔈';
      showOsd(`${icon} ${pct}%`);
    },
    [showOsd]
  );

  // -- keyboard shortcuts ------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
        case 'T':
          toggleTheater();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVol(volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVol(volume - 0.1);
          break;
        case '?':
          setHelpOpen((v) => !v);
          break;
        case 'Escape':
          setHelpOpen(false);
          setReportOpen(false);
          setQualityOpen(false);
          setDrawerOpen(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, toggleMute, toggleFullscreen, toggleTheater, setVol, volume]);

  // -- chromecast ---------------------------------------------------------------
  // Every load path goes through /api/stream — including Cast, which needs an
  // ABSOLUTE proxied URL (the Cast receiver cannot resolve a relative path).
  // Never hand it the raw upstream URL: the TV would fetch the upstream
  // host directly and 403.
  const castMedia = useCallback(async () => {
    try {
      const w = window as any;
      if (!w.chrome?.cast?.media && !w.cast?.framework) {
        showOsd(isRo ? '📺 Chromecast indisponibil pe acest browser' : '📺 Chromecast unavailable on this browser');
        return;
      }
      const castUrl = sourceUrl ? `${window.location.origin}/api/stream?url=${encodeURIComponent(sourceUrl)}` : '';
      if (!castUrl) return;
      // cast.framework path (Cast Context)
      const ctx = w.cast?.framework?.CastContext?.getInstance?.();
      if (ctx) {
        const session = ctx.getCurrentSession?.();
        if (session?.loadMedia) {
          const mediaInfo = new w.chrome.cast.media.MediaInfo(castUrl, 'application/x-mpegURL');
          mediaInfo.metadata = new w.chrome.cast.media.GenericMediaMetadata();
          mediaInfo.metadata.title = `${channel.name} Live`;
          const request = new w.chrome.cast.media.LoadRequest(mediaInfo);
          await session.loadMedia(request);
          setCastActive(true);
          showOsd(isRo ? '📺 Redare pe TV via Chromecast!' : '📺 Casting to TV!');
        } else {
          await ctx.requestSession();
        }
        return;
      }
      // fallback: chrome.cast.media direct
      if (w.chrome?.cast?.media) {
        const mediaInfo = new w.chrome.cast.media.MediaInfo(castUrl, 'application/x-mpegURL');
        mediaInfo.metadata = new w.chrome.cast.media.GenericMediaMetadata();
        mediaInfo.metadata.title = `${channel.name} Live`;
        const request = new w.chrome.cast.media.LoadRequest(mediaInfo);
        w.chrome.cast.requestSession(
          (session: any) => {
            session.loadMedia(request, () => setCastActive(true), () => {});
          },
          () => {}
        );
      }
    } catch (err: any) {
      if (err?.code !== 'CANCEL') {
        showOsd(isRo ? '📺 Chromecast: conectează un dispozitiv Cast' : '📺 Chromecast: connect a Cast device');
      }
    }
  }, [sourceUrl, channel.name, showOsd, isRo]);

  // -- report -------------------------------------------------------------------
  const submitReport = useCallback(async () => {
    const message = reportIssue || reportText.trim();
    if (!message || reportSending) return;
    setReportSending(true);
    try {
      await fetch('/api/stream-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channel.id,
          channel_name: channel.name,
          channel_slug: channel.slug,
          message,
          stream_url: sourceUrl,
          timestamp: new Date().toISOString(),
        }),
      });
      setReportSent(true);
      setReportIssue('');
      setReportText('');
      setTimeout(() => {
        setReportOpen(false);
        setReportSent(false);
      }, 2500);
    } catch {
      /* ignore */
    }
    setReportSending(false);
  }, [reportIssue, reportText, reportSending, channel.id, channel.name, channel.slug, sourceUrl]);

  // -- ratings ---------------------------------------------------------------------
  const voteRating = useCallback(
    async (value: number) => {
      if (ratingBusy) return;
      setRatingBusy(true);
      setRating((prev) => ({ ...prev, myRating: value }));
      try {
        const res = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel_id: channel.id, rating: value }),
        });
        const data = (await res.json().catch(() => null)) as Rating | null;
        if (data) setRating(data);
        try {
          localStorage.setItem(`rating_${channel.id}`, String(value));
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }
      setRatingBusy(false);
    },
    [channel.id, ratingBusy]
  );

  // -- share ------------------------------------------------------------------------
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(
    isRo ? `Urmărește ${channel.name} live online gratuit` : `Watch ${channel.name} live online free`
  );

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [pageUrl]);

  // -- push -------------------------------------------------------------------------
  const subscribePush = useCallback(async () => {
    setPushState('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushState('denied');
        return;
      }
      const sw = await navigator.serviceWorker.ready;
      let sub = await sw.pushManager.getSubscription();
      if (!sub) {
        try {
          sub = await sw.pushManager.subscribe({ userVisibleOnly: true } as PushSubscriptionOptionsInit);
        } catch {
          setPushState('subscribed');
          try {
            localStorage.setItem('push_subscribed', '1');
          } catch {
            /* ignore */
          }
          return;
        }
      }
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      setPushState('subscribed');
      try {
        localStorage.setItem('push_subscribed', '1');
      } catch {
        /* ignore */
      }
    } catch {
      setPushState('idle');
    }
  }, []);

  const unsubscribePush = useCallback(async () => {
    setPushState('loading');
    try {
      const sw = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem('push_subscribed');
    } catch {
      /* ignore */
    }
    setPushState('idle');
  }, []);

  // -- favorites ----------------------------------------------------------------------
  const toggleFav = useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('tv_favorites') || '[]') as Array<number | string>;
      const next = isFav
        ? raw.filter((v) => v !== channel.id && v !== channel.slug)
        : [...raw, channel.id];
      localStorage.setItem('tv_favorites', JSON.stringify(next));
      setIsFav(!isFav);
    } catch {
      /* ignore */
    }
  }, [isFav, channel.id, channel.slug]);

  // -- watchlist pin ---------------------------------------------------------------------
  const togglePin = useCallback(
    async (entry: EpgEntry) => {
      if (new Date(entry.start_time).getTime() <= Date.now()) return;
      setPinBusy(entry.id);
      try {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel_id: channel.id,
            program_id: entry.id,
            program_title: entry.title,
            channel_name: channel.name,
            channel_slug: channel.slug,
            start_time: entry.start_time,
          }),
        });
        const data = (await res.json().catch(() => ({ added: true }))) as { added?: boolean };
        setPinned((prev) => {
          const next = new Set(prev);
          if (data.added) {
            next.add(entry.id);
            showToast(
              isRo ? `⏰ Pornire programată la ${entry.title}` : `⏰ Scheduled start: ${entry.title}`
            );
          } else {
            next.delete(entry.id);
          }
          try {
            localStorage.setItem('wl_pinned', JSON.stringify(Array.from(next)));
          } catch {
            /* ignore */
          }
          return next;
        });
      } catch {
        /* ignore */
      }
      setPinBusy(null);
    },
    [channel.id, channel.name, channel.slug, showToast, isRo]
  );

  // -- channel drawer ---------------------------------------------------------------------
  useEffect(() => {
    if (!drawerOpen) return;
    const ctrl = new AbortController();
    const delay = setTimeout(async () => {
      try {
        const q = drawerQuery.trim();
        const url = q ? `/api/channels?search=${encodeURIComponent(q)}` : '/api/channels';
        const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
        if (!res.ok) return;
        const data = (await res.json()) as Array<RelatedChannel>;
        setDrawerResults(Array.isArray(data) ? data.slice(0, 6) : []);
      } catch {
        /* ignore */
      }
    }, 280);
    return () => {
      clearTimeout(delay);
      ctrl.abort();
    };
  }, [drawerOpen, drawerQuery]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const currentProgress = currentEpg ? progressPct(currentEpg.start_time, currentEpg.end_time, nowTick) : 0;

  const unmuteBanner = isRo ? 'Click pentru Sunet' : 'Click to Unmute';

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", color: '#e8ecf4' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} .wc-player{border-radius:20px}`}</style>

      {/* header row: prev/next + badges + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {isValidSlug(prev_slug) && (
          <Link
            href={`/watch/${prev_slug}`}
            title={isRo ? 'Canalul anterior' : 'Previous channel'}
            style={hdrBtn}
          >
            ⏮ <span>Prev</span>
          </Link>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', background: '#10b981', borderRadius: 8, fontSize: 11, fontWeight: 800, color: '#04130d' }}>
          <span className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#04130d', display: 'inline-block' }} />
          LIVE
        </span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {channel.name}
        </span>
        <span style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.45)', color: '#10b981', fontSize: 10, fontWeight: 800 }}>
          {liveLabel}
        </span>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => setDrawerOpen((v) => !v)} style={hdrBtn} title={isRo ? '⚡ Schimbă canalul' : '⚡ Switch channel'}>
          ⚡ {isRo ? 'SCHIMBĂ CANALUL' : 'SWITCH CHANNEL'}
        </button>
        <button type="button" onClick={toggleFav} style={{ ...hdrBtn, color: isFav ? '#ff5a8a' : undefined }} title={isRo ? 'Salvează' : 'Save'}>
          {isFav ? '❤️' : '🤍'} <span>{isFav ? (isRo ? 'Favorit' : 'Saved') : isRo ? 'Salvează' : 'Save'}</span>
        </button>
        <button type="button" onClick={() => setHelpOpen(true)} style={hdrBtn} title="Keyboard shortcuts">
          ⌨️
        </button>
        {pushState !== 'unsupported' && (
          <button
            type="button"
            onClick={pushState === 'subscribed' ? unsubscribePush : subscribePush}
            disabled={pushState === 'loading' || pushState === 'denied'}
            title={isRo ? 'Notificări push' : 'Push notifications'}
            style={{ ...hdrBtn, color: pushState === 'subscribed' ? '#10b981' : undefined }}
          >
            {pushState === 'loading' ? '⏳' : pushState === 'subscribed' ? '🔔' : pushState === 'denied' ? '🔕' : '🔔'}
          </button>
        )}
        <button type="button" onClick={() => setReportOpen(true)} style={hdrBtn} title={isRo ? 'Raportează o problemă' : 'Report a problem'}>
          🚩
        </button>
        <button type="button" onClick={toggleTheater} style={{ ...hdrBtn, color: theater ? '#10b981' : undefined }} title={isRo ? 'Theater (T)' : 'Theater (T)'}>
          🎬 <span>Theater</span>
        </button>
        {isValidSlug(next_slug) && (
          <Link
            href={`/watch/${next_slug}`}
            title={isRo ? 'Canalul următor' : 'Next channel'}
            style={hdrBtn}
          >
            <span>Next</span> ⏭
          </Link>
        )}
      </div>

      {/* player */}
      <div
        ref={wrapperRef}
        className={`wc-player${theater ? ' wc-theater' : ''}`}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: theater ? '21/9' : '16/9',
          background: '#050608',
          overflow: 'hidden',
          boxShadow: '0 28px 80px rgba(0,0,0,0.9)',
        }}
        onMouseEnter={resetHideTimer}
        onMouseMove={resetHideTimer}
        onMouseLeave={() => {
          if (hideTimer.current) clearTimeout(hideTimer.current);
          setShowControls(false);
          setQualityOpen(false);
        }}
        onDoubleClick={(e) => {
          if (!(e.target as HTMLElement).closest('button, a, input')) toggleFullscreen();
        }}
      >
        {/* ambient glow backdrop */}
        {channel.logo && (status === 'loading' || status === 'buffering' || status === 'paused') && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#040507' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={channel.logo}
              alt=""
              aria-hidden="true"
              style={{ position: 'absolute', inset: '-20%', width: '140%', height: '140%', objectFit: 'cover', filter: 'blur(44px) saturate(1.9) brightness(0.32)', transform: 'scale(1.1)', pointerEvents: 'none', userSelect: 'none' }}
            />
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted={muted}
          aria-label={`${channel.name} live stream`}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button, a, input')) return;
            togglePlay();
          }}
          style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'transparent', position: 'relative', zIndex: 1 }}
        />

        {/* unfocused bottom bar */}
        {status === 'playing' && !muted && (
          <div style={{ position: 'absolute', bottom: 58, left: 16, zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.55 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={18} height={18} style={{ width: 18, height: 18, borderRadius: 4 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
              canaletvlive.online
            </span>
          </div>
        )}

        {/* AdSlot in-player */}
        <div style={{ position: 'absolute', bottom: 68, left: 0, right: 0, zIndex: 25, padding: '0 14px', pointerEvents: 'all' }}>
          <AdSlot slot="in-player" />
        </div>

        {/* OSD */}
        {osd && (
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)', color: '#fff', fontWeight: 700, fontSize: 17, padding: '12px 24px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', zIndex: 9999, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            {osd}
          </div>
        )}

        {/* toast */}
        {toast && (
          <div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 40, background: 'rgba(6,9,20,0.95)', border: '1px solid rgba(16,185,129,0.35)', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {toast}
          </div>
        )}

        {/* state overlays */}
        {(status === 'loading' || status === 'buffering') && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(16,18,24,0.78) 0%, rgba(5,6,8,0.94) 100%)', backdropFilter: 'blur(8px)', gap: 18, padding: 20 }}>
            <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid rgba(16,185,129,0.15)' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid transparent', borderTopColor: '#10b981', borderRightColor: 'rgba(16,185,129,0.4)', animation: 'spin 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
              {channel.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={channel.logo} alt={channel.name} style={{ width: 66, height: 48, objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 24 }}>📺</span>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#f8fafc', fontSize: 16, fontWeight: 800, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
                {channel.name} <span style={{ color: '#10b981' }}>LIVE</span>
              </p>
              <p style={{ color: '#a1a1aa', fontSize: 12.5 }}>
                {status === 'buffering'
                  ? (t.buffering ?? 'Se sincronizează fluxul video HD...')
                  : (t.loading ?? 'Se conectează la serverul live...')}
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,9,12,0.95)', gap: 14, padding: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              📡
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#f8fafc', fontSize: 17, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, marginBottom: 5 }}>
                {isRo ? 'CONEXIUNE ÎNTRERUPTĂ' : 'CONNECTION INTERRUPTED'}
              </h3>
              <p style={{ color: '#a1a1aa', fontSize: 12.5, maxWidth: 320, lineHeight: 1.5 }}>
                {errorMsg || (isRo ? 'Stream-ul nu răspunde momentan. Încearcă reîncărcarea sau alt server.' : 'The stream is temporarily unresponsive. Please retry or switch servers.')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button type="button" onClick={startPlayer} style={{ padding: '9px 20px', background: '#10b981', border: 'none', borderRadius: 10, color: '#04130d', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                🔄 {isRo ? 'Reîncarcă' : 'Retry'}
              </button>
              {servers.length > 1 &&
                servers.map((s, i) =>
                  i !== serverIdx ? (
                    <button
                      key={`${s.id}-${i}`}
                      type="button"
                      onClick={() => setServerIdx(i)}
                      style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, color: '#f8fafc', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
                    >
                      📡 {isRo ? `Comută pe ${s.name}` : `Switch to ${s.name}`}
                    </button>
                  ) : null
                )}
            </div>
          </div>
        )}

        {status === 'paused' && (
          <div
            data-overlay="true"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              video.muted = false;
              setMuted(false);
              if (video.volume === 0) {
                video.volume = 1;
                setVolume(1);
              }
              video.play().then(() => setStatus('playing')).catch(() => {
                video.muted = true;
                setMuted(true);
                video.play().then(() => setStatus('playing')).catch(() => {});
              });
            }}
            style={{ position: 'absolute', inset: 0, zIndex: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, rgba(10,14,20,0.55) 0%, rgba(4,6,10,0.88) 100%)', backdropFilter: 'blur(4px)', gap: 16, cursor: 'pointer' }}
          >
            <div style={{ width: 78, height: 78, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 14px rgba(16,185,129,0.18), 0 12px 40px rgba(16,185,129,0.5)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#04130d" style={{ marginLeft: 3 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginBottom: 3, fontFamily: "'Space Grotesk', sans-serif" }}>
                {(t.clickToUnmute as string) || unmuteBanner}
              </p>
              <p style={{ color: '#cbd5e1', fontSize: 12 }}>
                {isRo ? 'Transmisiune Directă HD • Sunet Activ' : 'HD Live Broadcast • Audio Ready'}
              </p>
            </div>
          </div>
        )}

        {/* controls */}
        {(status === 'playing' || status === 'paused') && (
          <div
            className="wc-ctrl-bar"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
              padding: '28px 14px 12px',
              background: 'linear-gradient(to top, rgba(4,6,10,0.95) 0%, rgba(4,6,10,0.65) 60%, transparent 100%)',
              display: 'flex', flexDirection: 'column', gap: 8,
              opacity: showControls || status === 'paused' ? 1 : 0,
              transition: 'opacity 0.25s ease',
              pointerEvents: showControls || status === 'paused' ? 'auto' : 'none',
            }}
          >
            {currentEpg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.16)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${currentProgress}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b)', borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#cbd5e1', fontWeight: 700 }}>
                  {fmtTime(currentEpg.start_time)} – {fmtTime(currentEpg.end_time)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button
                  type="button"
                  onClick={togglePlay}
                  title={status === 'playing' ? (isRo ? 'Pauză (Space)' : 'Pause (Space)') : isRo ? 'Redă (Space)' : 'Play (Space)'}
                  style={ctrlBtn(36, '#10b981', '#04130d')}
                >
                  {status === 'playing' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#04130d"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#04130d"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
                <button type="button" onClick={() => startPlayer()} title={isRo ? 'Sincronizează / Reîncarcă fluxul' : 'Sync / Reload stream'} style={ctrlBtn(34)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                </button>
                <button type="button" onClick={toggleMute} title={muted ? (isRo ? 'Activează sunetul (M)' : 'Unmute (M)') : isRo ? 'Mut (M)' : 'Mute (M)'} style={{ ...ctrlBtn(34), color: muted ? '#fbbf24' : '#fff', background: muted ? 'rgba(245,158,11,0.2)' : undefined, border: muted ? '1px solid rgba(245,158,11,0.45)' : undefined }}>
                  {muted ? '🔇' : '🔊'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => setVol(parseFloat(e.target.value))}
                  className="wc-vol-slider"
                  style={{ width: 72, accentColor: '#ff1744', cursor: 'pointer' }}
                  aria-label={isRo ? 'Volum' : 'Volume'}
                />
                <button
                  type="button"
                  onClick={() => {
                    const video = videoRef.current;
                    const pos = (hlsRef.current as any)?.liveSyncPosition;
                    if (pos && video) {
                      video.currentTime = pos;
                      video.play().catch(() => {});
                    }
                    showOsd(isRo ? '● Ești în direct (LIVE)' : '● You are live');
                  }}
                  title={isRo ? 'Sari la transmisia în direct' : 'Jump to live'}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.45)', borderRadius: 7, fontSize: 10.5, fontWeight: 800, color: '#10b981', cursor: 'pointer' }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  LIVE
                </button>
              </div>

              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setQualityOpen((v) => !v)}
                    title={isRo ? 'Calitate video & Server' : 'Video quality & Server'}
                    style={{
                      height: 34, padding: '0 10px', borderRadius: 9,
                      background: qualityOpen ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: qualityOpen ? '#10b981' : '#fff',
                      fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    ⚙️ {currentLevel === -1 ? `Auto (${liveLabel})` : `${liveLabel}p`}
                  </button>
                  {qualityOpen && (
                    <div style={{ position: 'absolute', bottom: '130%', right: 0, background: 'rgba(12,14,20,0.96)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, overflow: 'hidden', minWidth: 185, boxShadow: '0 16px 48px rgba(0,0,0,0.85)', zIndex: 110, padding: '6px 0' }}>
                      <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {isRo ? 'Calitate video' : 'Video quality'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (hlsRef.current) hlsRef.current.currentLevel = -1;
                          setCurrentLevel(-1);
                          setQualityOpen(false);
                          showOsd(isRo ? '🎞️ Auto HD' : '🎞️ Auto HD');
                        }}
                        style={menuItem(currentLevel === -1)}
                      >
                        <span>Auto ({liveLabel})</span>
                        {currentLevel === -1 && <span>✓</span>}
                      </button>
                      {levels.map((lv) => (
                        <button
                          key={lv.index}
                          type="button"
                          onClick={() => {
                            if (hlsRef.current) hlsRef.current.currentLevel = lv.index;
                            setCurrentLevel(lv.index);
                            if (lv.height) setLiveLabel(`${lv.height}p`);
                            setQualityOpen(false);
                            showOsd(`🎞️ ${lv.label}`);
                          }}
                          style={menuItem(currentLevel === lv.index)}
                        >
                          <span>{lv.label}</span>
                          {currentLevel === lv.index && <span>✓</span>}
                        </button>
                      ))}
                      {servers.length > 1 && (
                        <>
                          <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.06em', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
                            {isRo ? '📡 Sursă Stream:' : '📡 Stream Source:'}
                          </div>
                          {servers.map((s, i) => (
                            <button
                              key={`${s.id}-${i}`}
                              type="button"
                              onClick={() => {
                                setServerIdx(i);
                                setQualityOpen(false);
                              }}
                              style={menuItem(serverIdx === i)}
                            >
                              <span>{s.name}</span>
                              {serverIdx === i && <span>✓</span>}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button type="button" onClick={togglePiP} title={isRo ? 'Ecran mic (PiP)' : 'Picture-in-Picture (PiP)'} style={ctrlBtn(34)}>
                  ⧉
                </button>
                <button type="button" onClick={castMedia} title={castActive ? (isRo ? 'Smart TV activ' : 'Smart TV active') : 'Chromecast'} style={{ ...ctrlBtn(34), color: castActive ? '#10b981' : undefined }}>
                  📺
                </button>
                <button type="button" onClick={toggleTheater} title={isRo ? 'Cinema / Theater mode (T)' : 'Cinema / Theater mode (T)'} style={{ ...ctrlBtn(34), color: theater ? '#10b981' : undefined }}>
                  🎬
                </button>
                <button type="button" onClick={toggleFullscreen} title={isRo ? 'Fullscreen (F)' : 'Fullscreen (F)'} style={ctrlBtn(34)}>
                  ⛶
                </button>
                <button type="button" onClick={() => setReportOpen(true)} title={isRo ? 'Raportează o problemă' : 'Report a problem'} style={ctrlBtn(34)}>
                  🚩
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* channel drawer */}
      {drawerOpen && (
        <div style={{ marginTop: 10, background: 'rgba(10,12,18,0.92)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>{isRo ? '⚡ SCHIMBĂ CANALUL' : '⚡ SWITCH CHANNEL'}</span>
            <button type="button" onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              type="text"
              value={drawerQuery}
              onChange={(e) => setDrawerQuery(e.target.value)}
              placeholder={isRo ? '🔍 Schimbă canalul sau caută emisiune...' : '🔍 Switch channel or search show...'}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, outline: 'none' }}
            />
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {drawerResults
              .filter((c) => isValidSlug(c.slug))
              .map((c) => {
              const active = c.slug === channel.slug;
              return (
                <Link key={c.slug} href={`/watch/${c.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 11, background: active ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (active ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.06)'), textDecoration: 'none' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{c.name}</span>
                  {c.epg_title && <span style={{ fontSize: 11, color: '#10b981' }}>▶ {c.epg_title}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* help modal */}
      {helpOpen && (
        <div onClick={() => setHelpOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', padding: 20 }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#0d1226', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, color: '#e8ecf4' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.05em', color: '#fff', margin: 0 }}>
                {isRo ? '⌨️ TASTE RAPIDE' : '⌨️ KEYBOARD SHORTCUTS'}
              </h3>
              <button type="button" onClick={() => setHelpOpen(false)} style={{ background: 'none', border: 'none', color: '#8896b3', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {(isRo
              ? [['Space / K', 'Play / Pauză'], ['M', 'Mut / Sunet'], ['F', 'Fullscreen'], ['T', 'Theater mode'], ['↑ / ↓', 'Volum +/-'], ['?', 'Această fereastră']]
              : [['Space / K', 'Play / Pause'], ['M', 'Mute / Unmute'], ['F', 'Fullscreen'], ['T', 'Theater mode'], ['↑ / ↓', 'Volume +/-'], ['?', 'This help menu']]
            ).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#8896b3', fontSize: 14 }}>{label}</span>
                <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '3px 10px', fontSize: 13, fontFamily: 'monospace', color: '#e8ecf4' }}>{key}</kbd>
              </div>
            ))}
            <p style={{ marginTop: 16, fontSize: 12, color: '#5a6480', textAlign: 'center' }}>
              {isRo ? 'Apasă ' : 'Press '}<kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '1px 6px', fontSize: 11 }}>?</kbd>{isRo ? ' oricând pentru a deschide acest meniu' : ' anytime to open this menu'}
            </p>
          </div>
        </div>
      )}

      {/* report modal */}
      {reportOpen && (
        <div onClick={() => setReportOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#101218', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, width: '100%', maxWidth: 420, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,0.85)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚩</div>
              <div>
                <h3 style={{ color: '#f8fafc', fontSize: 16, fontWeight: 700, margin: 0 }}>{isRo ? 'Raportează o problemă' : 'Report a stream issue'}</h3>
                <p style={{ color: '#71717a', fontSize: 12, margin: 0 }}>{channel.name}</p>
              </div>
            </div>
            {reportSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <p style={{ color: '#10b981', fontWeight: 700, fontSize: 15 }}>{isRo ? 'Raport trimis! Mulțumim.' : 'Report sent! Thank you.'}</p>
                <p style={{ color: '#71717a', fontSize: 13, marginTop: 4 }}>{isRo ? 'Vom verifica stream-ul în curând.' : 'We will check the stream shortly.'}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {REPORT_ISSUES[lang as 'ro' | 'en']?.map((issue) => (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => setReportIssue(issue === reportIssue ? '' : issue)}
                      style={{ padding: '9px 14px', background: reportIssue === issue ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (reportIssue === issue ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'), borderRadius: 9, color: reportIssue === issue ? '#10b981' : '#a1a1aa', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit', sans-serif" }}
                    >
                      {reportIssue === issue ? '✓ ' : ''}{issue}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder={isRo ? 'Detalii suplimentare (opțional)...' : 'Additional details (optional)...'}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: '#08090c', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, outline: 'none', marginBottom: 14, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={(!reportIssue && !reportText.trim()) || reportSending}
                    style={{ flex: 1, padding: '11px', background: (reportIssue || reportText.trim()) ? '#10b981' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, color: (reportIssue || reportText.trim()) ? '#04130d' : '#71717a', fontSize: 14, fontWeight: 800, cursor: (reportIssue || reportText.trim()) ? 'pointer' : 'not-allowed', opacity: reportSending ? 0.7 : 1 }}
                  >
                    {reportSending ? (isRo ? '⏳ Se trimite...' : '⏳ Sending...') : isRo ? '🚩 Trimite Raportul' : '🚩 Send Report'}
                  </button>
                  <button type="button" onClick={() => setReportOpen(false)} style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#a1a1aa', fontSize: 13, cursor: 'pointer' }}>
                    {isRo ? 'Anulează' : 'Cancel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* server switcher row */}
      {servers.length > 1 && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa' }}>📡 {isRo ? 'Sursă Stream:' : 'Stream Source:'}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {servers.map((s, i) => (
              <button
                key={`${s.id}-${i}`}
                type="button"
                onClick={() => setServerIdx(i)}
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: serverIdx === i ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                  background: serverIdx === i ? '#10b981' : 'rgba(255,255,255,0.04)',
                  color: serverIdx === i ? '#04130d' : '#cbd5e1',
                }}
              >
                {serverIdx === i ? '▶ ' : ''}{s.name}
              </button>
            ))}
          </div>
          {status === 'error' && <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 'auto', fontWeight: 600 }}>{isRo ? '⚠️ Server ocupat — încearcă altă sursă' : '⚠️ Server busy — try another source'}</span>}
        </div>
      )}

      {/* article card: EPG now / next, ratings, share */}
      <article style={{ marginTop: 14, background: '#101218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 20px', boxShadow: '0 16px 40px rgba(0,0,0,0.45)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
            {channel.logo && (
              <div style={{ width: 64, height: 46, background: '#08090c', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.09)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={channel.logo} alt={`${channel.name} logo`} width={52} height={34} style={{ maxHeight: 34, maxWidth: 52, objectFit: 'contain' }} />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: '#f8fafc', margin: 0, fontSize: 22 }}>
                  {channel.name} <span style={{ fontSize: '0.58em', opacity: 0.65 }}>LIVE</span>
                </h1>
                <span style={{ padding: '3px 9px', background: '#10b981', borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#04130d' }}>● LIVE HD</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {channel.category_name && (
                  <Link href={`/?category=${channel.category_slug || ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 7, fontSize: 11.5, fontWeight: 700, border: '1px solid rgba(16,185,129,0.25)' }}>
                    {channel.category_icon} {channel.category_name}
                  </Link>
                )}
                {channel.country && <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, fontSize: 11, color: '#a1a1aa', fontWeight: 600 }}>🌍 {channel.country}</span>}
                {isValidSlug(channel.slug) && (
                  <Link href={`/program/${channel.slug}/azi`} style={{ padding: '2px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>📅 {isRo ? 'Ghid TV' : 'TV Guide'}</Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {currentEpg && (
          <div style={{ marginTop: 14, padding: '12px 15px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ padding: '2px 8px', background: '#10b981', borderRadius: 5, fontSize: 9.5, fontWeight: 800, color: '#04130d' }}>▶ {isRo ? 'ACUM' : 'NOW'}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentEpg.title}</span>
              </div>
              <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600 }}>{fmtTime(currentEpg.start_time)} – {fmtTime(currentEpg.end_time)}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #f59e0b)', borderRadius: 99, width: `${currentProgress}%`, transition: 'width 60s linear' }} />
            </div>
            {nextEpg && isValidSlug(channel.slug) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, fontSize: 11.5, color: '#71717a' }}>
                <span>
                  {isRo ? 'Urmează la' : 'Up next at'} <strong style={{ color: '#cbd5e1' }}>{fmtTime(nextEpg.start_time)}</strong>: {nextEpg.title}
                </span>
                <Link href={`/program/${channel.slug}/azi`} style={{ color: '#10b981', fontSize: 11, fontWeight: 700 }}>Tot programul →</Link>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => voteRating(n)}
                  onMouseEnter={() => setHoverStar(n)}
                  onMouseLeave={() => setHoverStar(0)}
                  disabled={ratingBusy}
                  title={`${n} ⭐`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1, fontSize: 16, lineHeight: 1, transform: (hoverStar || rating.myRating) >= n ? 'scale(1.15)' : 'scale(1)', filter: (hoverStar || rating.myRating) >= n ? 'none' : 'grayscale(1) opacity(0.35)' }}
                >
                  ⭐
                </button>
              ))}
            </div>
            {rating.count > 0 && (
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#f59e0b' }}>
                {rating.avg.toFixed(1)} <span style={{ color: '#71717a', fontWeight: 500 }}>({rating.count})</span>
              </span>
            )}
            <button type="button" onClick={castMedia} style={sBtn} title="Chromecast">📺 {castActive ? (isRo ? 'Pe TV' : 'On TV') : 'Cast'}</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <a href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer" style={{ ...sBtn, color: '#25d366', background: 'rgba(37,211,102,0.08)', borderColor: 'rgba(37,211,102,0.2)' }}>
              WhatsApp
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer" style={{ ...sBtn, color: '#60a5fa', background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.2)' }}>
              Facebook
            </a>
            <button type="button" onClick={copyLink} style={{ ...sBtn, color: copied ? '#10b981' : '#cbd5e1', borderColor: copied ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)' }}>
              {copied ? '✓ Copiat!' : '🔗 Copiază link'}
            </button>
          </div>
        </div>
      </article>

      {/* EPG schedule */}
      {epg.length > 0 && (
        <section style={{ marginTop: 14, background: '#101218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 3, height: 16, background: '#10b981', borderRadius: 2, display: 'inline-block' }} />
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                📅 {isRo ? `Program TV — Astăzi` : `TV Schedule — Today`} — {channel.name}
              </h2>
            </div>
            {isValidSlug(channel.slug) && (
              <Link href={`/program/${channel.slug}/azi`} style={{ fontSize: 11.5, fontWeight: 700, color: '#10b981' }}>Vezi toate →</Link>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
            {epg.map((entry) => {
              const isLive = currentEpg !== null && entry.id === currentEpg.id;
              const isPast = new Date(entry.end_time).getTime() < nowTick;
              const isFuture = new Date(entry.start_time).getTime() > nowTick;
              const isPinned = pinned.has(entry.id);
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                    background: isLive ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
                    borderLeft: isLive ? '3px solid #10b981' : '3px solid transparent',
                    opacity: isPast ? 0.45 : 1,
                  }}
                >
                  <span style={{ fontSize: 11.5, fontFamily: 'monospace', width: 42, flexShrink: 0, color: isLive ? '#10b981' : '#94a3b8', fontWeight: 700 }}>
                    {fmtTime(entry.start_time)}
                  </span>
                  <span style={{ fontSize: 12.5, color: isLive ? '#fff' : '#cbd5e1', fontWeight: isLive ? 700 : 500, flex: 1, lineHeight: 1.35 }}>
                    {entry.title}
                  </span>
                  {isLive && <span style={{ padding: '2px 6px', background: '#10b981', borderRadius: 5, fontSize: 9.5, fontWeight: 800, color: '#04130d', flexShrink: 0 }}>LIVE</span>}
                  {isFuture && !isLive && (
                    <button
                      type="button"
                      onClick={() => togglePin(entry)}
                      disabled={pinBusy === entry.id}
                      title={isRo ? 'Amintește-mi când începe' : 'Remind me when it starts'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 2, opacity: isPinned ? 1 : 0.4, flexShrink: 0 }}
                    >
                      {isPinned ? '📌' : '📍'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* related + blog */}
      {related.length > 0 && (
        <section style={{ marginTop: 14, background: '#101218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 3, height: 16, background: '#10b981', borderRadius: 2, display: 'inline-block' }} />
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              📺 {isRo ? 'Canale Similare' : 'Similar Channels'}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 8 }}>
            {related
              .filter((c) => isValidSlug(c.slug))
              .slice(0, 8)
              .map((c) => (
              <Link key={c.slug} href={`/watch/${c.slug}`} title={`${c.name} live`} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: '#12141a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11 }}>
                <span style={{ width: 40, height: 28, background: '#08090c', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logo} alt={c.name} style={{ maxHeight: 20, maxWidth: 34, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 13 }}>📺</span>
                  )}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{c.name}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: '#10b981' }}>● LIVE</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {blogPosts.length > 0 && (
        <section style={{ marginTop: 14, background: '#101218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '16px 18px' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800, color: '#f8fafc', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 3, height: 15, background: '#10b981', borderRadius: 2, display: 'inline-block' }} />
            📰 {isRo ? `Știri și articole despre ${channel.name}` : `News & Articles about ${channel.name}`}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
            {blogPosts.slice(0, 3).map((b) => (
              <Link key={b.slug} href={`/blog/${b.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: '#12141a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>📰</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.35, flex: 1 }}>{b.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const hdrBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 10px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 9,
  color: '#8896b3',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
  textDecoration: 'none',
};

function ctrlBtn(size: number, bg?: string, color?: string): CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: 10,
    background: bg || 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: color || '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}

const sBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 11px',
  borderRadius: 9,
  fontSize: 11.5,
  fontWeight: 700,
  cursor: 'pointer',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#cbd5e1',
  textDecoration: 'none',
  lineHeight: 1,
  fontFamily: "'Outfit', sans-serif",
};

function menuItem(active: boolean): CSSProperties {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 14px',
    background: active ? 'rgba(16,185,129,0.14)' : 'transparent',
    border: 'none',
    color: active ? '#10b981' : '#cbd5e1',
    fontSize: 12.5,
    fontWeight: active ? 700 : 600,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Outfit', sans-serif",
  };
}
