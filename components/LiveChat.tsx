'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '@/components/Providers';
import { T } from '@/lib/i18n';

interface ShoutboxMessage {
  id: number;
  username: string;
  message: string;
  color: string;
  created_at: string;
  type?: string;
  slug?: string;
}

interface LiveChatProps {
  channelSlug: string;
  channelName?: string;
}

const PALETTE = [
  '#10b981',
  '#ff6d00',
  '#ffd600',
  '#00e676',
  '#00b0ff',
  '#d500f9',
  '#f06292',
  '#4fc3f7',
  '#aed581',
  '#ffb74d',
];
const REACTIONS = ['👍', '❤️', '😂', '🔥', '😮', '😢'];

function relativeTime(iso: string): string {
  const t = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (t < 60) return `${Math.max(0, t)}s`;
  if (t < 3600) return `${Math.floor(t / 60)}m`;
  return `${Math.floor(t / 3600)}h`;
}

function mentions(text: string) {
  return text.split(/(@\w+)/g).map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} style={{ color: '#10b981', fontWeight: 700 }}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function LiveChat({ channelSlug, channelName }: LiveChatProps) {
  const { lang } = useLang();
  const q = lang === 'ro'
    ? {
        title: 'Chat Live',
        online: 'online',
        placeholder: 'Scrie un mesaj...',
        send: 'Trimite',
        setupTitle: 'Intră în chat',
        setupSub: 'Alege un nume pentru a participa la conversație',
        namePlaceholder: 'Numele tău (max 20 caractere)',
        joinBtn: 'Intră în chat →',
        changeUser: 'Schimbă numele',
        chatAs: 'Chatiezi ca',
        noMessages: 'Fii primul care scrie ceva! 👋',
        connecting: 'Se conectează...',
        rateLimit: 'Prea multe mesaje! Așteaptă un minut.',
        msgTooLong: 'Mesajul e prea lung (max 300 caractere)',
        minimize: 'Minimizează',
        expand: 'Deschide chat',
      }
    : {
        title: 'Live Chat',
        online: 'online',
        placeholder: 'Write a message...',
        send: 'Send',
        setupTitle: 'Join the chat',
        setupSub: 'Choose a name to join the conversation',
        namePlaceholder: 'Your name (max 20 chars)',
        joinBtn: 'Join chat →',
        changeUser: 'Change name',
        chatAs: 'Chatting as',
        noMessages: 'Be the first to say something! 👋',
        connecting: 'Connecting...',
        rateLimit: 'Too many messages! Wait a minute.',
        msgTooLong: 'Message too long (max 300 chars)',
        minimize: 'Minimize',
        expand: 'Open chat',
      };

  const [messages, setMessages] = useState<ShoutboxMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [username, setUsername] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [needsName, setNeedsName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
  const [poll, setPoll] = useState({ good: 0, meh: 0, bad: 0 });
  const [pollVote, setPollVote] = useState<string | null>(null);
  const [floats, setFloats] = useState<Array<{ id: number; emoji: string; x: number }>>([]);

  const lastIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const floatSeq = useRef(0);

  // gate: shoutbox_username (max 20, strip <>) + color from 10-palette
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shoutbox_username');
      if (saved) {
        setUsername(saved);
        const savedColor = localStorage.getItem('shoutbox_color');
        setColor(savedColor && PALETTE.includes(savedColor) ? savedColor : PALETTE[0]);
      } else {
        setNeedsName(true);
      }
    } catch {
      setNeedsName(true);
    }
    try {
      const vote = localStorage.getItem(`poll_vote_${channelSlug}`);
      if (vote) setPollVote(vote);
    } catch {
      /* ignore */
    }
    fetch(`/api/shoutbox?slug=${encodeURIComponent(channelSlug)}&type=poll&limit=100`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const rows: ShoutboxMessage[] = Array.isArray(d) ? d : (d?.messages ?? []);
        const counts = { good: 0, meh: 0, bad: 0 };
        rows.forEach((m) => {
          if (m.message === 'good' || m.message === 'meh' || m.message === 'bad') {
            counts[m.message as 'good' | 'meh' | 'bad'] += 1;
          }
        });
        setPoll(counts);
      })
      .catch(() => {});
  }, [channelSlug]);

  const fetchMessages = useCallback(
    async (full: boolean) => {
      try {
        const url = full
          ? `/api/shoutbox?slug=${encodeURIComponent(channelSlug)}&limit=100`
          : `/api/shoutbox?slug=${encodeURIComponent(channelSlug)}&since=${encodeURIComponent(new Date(Date.now() - 10000).toISOString())}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: ShoutboxMessage[]; activeUsers?: number };
        if (full) {
          setMessages((data.messages || []).slice(-80));
          if (data.messages?.length) lastIdRef.current = data.messages[data.messages.length - 1].id;
        } else {
          const fresh = (data.messages || []).filter((m) => m.id > lastIdRef.current);
          if (fresh.length > 0) {
            setMessages((prev) => [...prev, ...fresh].slice(-80));
            lastIdRef.current = fresh[fresh.length - 1].id;
          }
        }
        setActiveUsers(data.activeUsers || 0);
      } catch {
        /* ignore */
      }
    },
    [channelSlug]
  );

  useEffect(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // poll every 4s while expanded & desktop
  useEffect(() => {
    if (!expanded || !isDesktop) return;
    const iv = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(iv);
  }, [expanded, isDesktop, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, expanded]);

  const joinChat = useCallback(() => {
    const name = nameInput.trim().replace(/[<>]/g, '').slice(0, 20).trim();
    if (!name) return;
    const nextColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    setUsername(name);
    setColor(nextColor);
    try {
      localStorage.setItem('shoutbox_username', name);
      localStorage.setItem('shoutbox_color', nextColor);
    } catch {
      /* ignore */
    }
    setNeedsName(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [nameInput]);

  const sendMessage = useCallback(async () => {
    if (!draft.trim() || sending || !username) return;
    if (draft.length > 300) {
      setError(q.msgTooLong);
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/shoutbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: channelSlug, username, message: draft.trim(), color }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setError(body?.error || q.rateLimit);
        setSending(false);
        return;
      }
      if (!res.ok) {
        setError(body?.error || 'Error');
        setSending(false);
        return;
      }
      setDraft('');
      await fetchMessages(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      setError('Network error');
    }
    setSending(false);
  }, [draft, sending, username, channelSlug, color, q.msgTooLong, q.rateLimit, fetchMessages]);

  const votePoll = useCallback(
    async (key: 'good' | 'meh' | 'bad') => {
      if (pollVote) return;
      setPollVote(key);
      setPoll((prev) => ({ ...prev, [key]: prev[key] + 1 }));
      try {
        localStorage.setItem(`poll_vote_${channelSlug}`, key);
      } catch {
        /* ignore */
      }
      try {
        await fetch('/api/shoutbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: channelSlug, username: username || 'Anonim', message: key, color: '#5a6480', type: 'poll' }),
        });
      } catch {
        /* ignore */
      }
    },
    [pollVote, channelSlug, username]
  );

  const react = useCallback(
    async (emoji: string) => {
      if (!username) return;
      floatSeq.current += 1;
      const id = floatSeq.current;
      const x = 20 + Math.random() * 60;
      setFloats((prev) => [...prev, { id, emoji, x }]);
      setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 2200);
      try {
        await fetch('/api/shoutbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: channelSlug, username, message: emoji, color, type: 'reaction' }),
        });
      } catch {
        /* ignore */
      }
    },
    [username, channelSlug, color]
  );

  // compact collapsed button 💬+count
  if (!expanded || !isDesktop) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, cursor: 'pointer', color: '#e8ecf4', fontSize: 13, fontWeight: 600, width: '100%', justifyContent: 'space-between', fontFamily: "'Outfit', sans-serif" }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>💬</span>
          {q.title}
          {activeUsers > 0 && (
            <span style={{ padding: '2px 7px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
              ● {activeUsers} {q.online}
            </span>
          )}
        </span>
        <span style={{ color: '#8896b3', fontSize: 11 }}>{q.expand} ▼</span>
      </button>
    );
  }

  const pollTotal = poll.good + poll.meh + poll.bad;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 420, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, overflow: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>💬</span>
          <span style={{ fontWeight: 700, color: '#e8ecf4', fontSize: 14 }}>{q.title}</span>
          <span style={{ padding: '2px 7px', background: activeUsers > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)', color: activeUsers > 0 ? '#22c55e' : '#5a6480', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
            {activeUsers > 0 ? `● ${activeUsers} ${q.online}` : `○ 0 ${q.online}`}
          </span>
        </div>
        <button type="button" onClick={() => setExpanded(false)} title={q.minimize} style={{ background: 'none', border: 'none', color: '#5a6480', cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1 }}>▲</button>
      </div>

      {/* poll */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#5a6480', letterSpacing: '0.04em' }}>{lang === 'ro' ? 'CUM ȚI SE PARE EMISIUNEA?' : 'HOW DO YOU RATE THE SHOW?'}</span>
          {pollVote && (
            <span style={{ fontSize: 10, color: '#8896b3' }}>
              {lang === 'ro' ? 'votul tău: ' : 'your vote: '}{pollVote === 'good' ? '👍' : pollVote === 'meh' ? '😐' : '👎'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(
            [
              { key: 'good' as const, emoji: '👍', label: lang === 'ro' ? 'Bun' : 'Good' },
              { key: 'meh' as const, emoji: '😐', label: lang === 'ro' ? 'Mediocru' : 'Meh' },
              { key: 'bad' as const, emoji: '👎', label: lang === 'ro' ? 'Slab' : 'Bad' },
            ]
          ).map((opt) => {
            const pct = pollTotal > 0 ? Math.round((poll[opt.key] / pollTotal) * 100) : 0;
            const mine = pollVote === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => votePoll(opt.key)}
                disabled={!!pollVote}
                title={opt.label}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '5px 6px', borderRadius: 8, border: `1px solid ${mine ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, background: mine ? 'rgba(16,185,129,0.08)' : '#0a0e1a', cursor: pollVote ? 'default' : 'pointer', fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}
              >
                <span style={{ fontSize: 16 }}>{opt.emoji}</span>
                {pollVote && (
                  <>
                    <div style={{ height: 3, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: mine ? '#10b981' : 'rgba(255,255,255,0.2)', borderRadius: 2, transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: 9, color: mine ? '#10b981' : '#5a6480', fontWeight: 700 }}>{pct}%</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* username gate */}
      {needsName ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, background: 'rgba(9,9,11,0.97)' }}>
          <div style={{ fontSize: 40 }}>💬</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: '#e8ecf4', fontSize: 16, marginBottom: 6 }}>{q.setupTitle}</p>
            <p style={{ fontSize: 13, color: '#8896b3' }}>{q.setupSub}</p>
          </div>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                joinChat();
              }
            }}
            placeholder={q.namePlaceholder}
            maxLength={20}
            style={{ width: '100%', padding: '10px 14px', background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#e8ecf4', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={joinChat}
            disabled={!nameInput.trim()}
            style={{ width: '100%', padding: '11px', background: '#10b981', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: nameInput.trim() ? 1 : 0.5 }}
          >
            {q.joinBtn}
          </button>
        </div>
      ) : (
        <>
          {/* messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a6480', fontSize: 13, textAlign: 'center' }}>{q.noMessages}</div>
            ) : (
              messages.map((m, idx) => {
                if (m.type === 'reaction') {
                  return (
                    <div key={m.id} style={{ textAlign: 'center', padding: '2px 0', opacity: 0.7 }}>
                      <span style={{ fontSize: 18 }}>{m.message}</span>
                      <span style={{ fontSize: 10, color: '#5a6480', marginLeft: 4 }}>{m.username}</span>
                    </div>
                  );
                }
                const own = m.username === username;
                const prev = messages[idx - 1];
                const grouped = idx > 0 && prev.username === m.username && prev.type !== 'reaction';
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start', marginTop: grouped ? 2 : 8 }}>
                    {!grouped && (
                      <span style={{ fontSize: 11, color: m.color, fontWeight: 700, marginBottom: 3, paddingLeft: own ? 0 : 4, paddingRight: own ? 4 : 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {own && '👤 '}{m.username}
                      </span>
                    )}
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '6px 10px',
                        borderRadius: own ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                        background: own ? `${m.color}22` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${own ? `${m.color}44` : 'rgba(255,255,255,0.07)'}`,
                        fontSize: 13,
                        color: '#e2e8f0',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                      }}
                    >
                      {mentions(m.message)}
                      <span style={{ fontSize: 10, color: '#5a6480', marginLeft: 6, display: 'inline-block', verticalAlign: 'bottom' }}>{relativeTime(m.created_at)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* identity row */}
          <div style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#5a6480' }}>
              {q.chatAs}: <strong style={{ color }}>{username}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setNameInput(username);
                setNeedsName(true);
              }}
              style={{ background: 'none', border: 'none', fontSize: 11, color: '#5a6480', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              {q.changeUser}
            </button>
          </div>

          {/* floating reactions */}
          <div style={{ position: 'relative', height: 0, overflow: 'visible' }}>
            {floats.map((f) => (
              <div key={f.id} style={{ position: 'absolute', bottom: 0, left: `${f.x}%`, fontSize: 22, animation: 'floatUp 2.2s ease-out forwards', pointerEvents: 'none', zIndex: 20, userSelect: 'none' }}>
                {f.emoji}
              </div>
            ))}
          </div>

          {/* reaction buttons */}
          <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => react(emoji)}
                title={emoji}
                style={{ flex: 1, padding: '4px 2px', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 16, cursor: 'pointer', lineHeight: 1.2 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.25)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'none';
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* composer */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 8, flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={q.placeholder}
                maxLength={300}
                disabled={sending}
                style={{ width: '100%', padding: '9px 12px', background: '#0a0e1a', border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: '#e8ecf4', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
              {error && (
                <div style={{ position: 'absolute', top: '100%', left: 0, fontSize: 11, color: '#ef4444', marginTop: 3, whiteSpace: 'nowrap' }}>{error}</div>
              )}
            </div>
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !draft.trim()}
              style={{ padding: '9px 14px', background: draft.trim() ? '#10b981' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 10, color: draft.trim() ? '#fff' : '#5a6480', fontSize: 13, fontWeight: 700, cursor: draft.trim() ? 'pointer' : 'default', flexShrink: 0 }}
            >
              {sending ? '⋯' : q.send}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
