'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useLang } from './Providers';
import { T } from '@/lib/i18n';

const POPULAR: Array<[string, string]> = [
  ['ProTV', '/watch/protv'],
  ['Antena 1', '/watch/antena-1'],
  ['Digi Sport 1', '/watch/digi-sport-1'],
  ['Kanal D', '/watch/kanal-d'],
  ['TVR 1', '/watch/tvr1'],
];

const CATEGORIES: Array<[string, string]> = [
  ['Generale', '/categorie/generale'],
  ['Știri', '/categorie/stiri'],
  ['Sport', '/categorie/sport'],
  ['Filme & Seriale', '/categorie/filme'],
  ['Divertisment', '/categorie/divertisment'],
  ['Documentare', '/categorie/documentare'],
  ['Copii', '/categorie/copii'],
  ['Muzică', '/categorie/muzica'],
  ['Internațional', '/categorie/international'],
  ['Religioase', '/categorie/religioase'],
];

export default function Footer() {
  const { lang } = useLang();
  const t = T[lang];

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
  };

  const headingStyle: React.CSSProperties = {
    fontSize: 12,
    letterSpacing: '0.12em',
    color: 'var(--c-text-dim)',
    marginBottom: 4,
    fontWeight: 700,
  };

  return (
    <footer
      style={{
        marginTop: 48,
        borderTop: '1px solid var(--c-border)',
        background: 'var(--c-surface-2)',
        padding: '32px 16px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 24,
        }}
      >
        <div style={groupStyle}>
          <Logo size="sm" />
          <span style={{ color: 'var(--c-text-dim)', fontSize: 13 }}>CanaleTV Live — TV Online Gratuit</span>
        </div>

        <div style={groupStyle}>
          <span style={headingStyle}>POSTURI POPULARE</span>
          {POPULAR.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </div>

        <div style={groupStyle}>
          <span style={headingStyle}>WEB APP</span>
          <Link href="/app">Web App</Link>
          <Link href="/multistream">Multi-Stream</Link>
          <Link href="/app-android">Android</Link>
          <Link href="/app-ios">iOS</Link>
        </div>

        <div style={groupStyle}>
          <span style={headingStyle}>CATEGORII TV LIVE</span>
          {CATEGORIES.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </div>

        <div style={groupStyle}>
          <span style={headingStyle}>PROGRAM TV &amp; GHID</span>
          <Link href="/ghid-tv">Ghid TV</Link>
          <Link href="/azi">Azi</Link>
          <Link href="/maine">Mâine</Link>
          <Link href="/program-saptamana">Program săptămâna</Link>
          <Link href="/top-live">Top Live</Link>
        </div>

        <div style={groupStyle}>
          <span style={headingStyle}>INFORMAȚII &amp; LEGAL</span>
          <Link href="/about">{t.about}</Link>
          <Link href="/contact">{t.contact}</Link>
          <Link href="/faq">{t.faq}</Link>
          <Link href="/termeni">{t.terms}</Link>
          <Link href="/confidentialitate">{t.privacy}</Link>
          <Link href="/cookies">{t.cookies}</Link>
          <Link href="/dmca">{t.dmca}</Link>
          <Link href="/disclaimer">{t.disclaimer}</Link>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: '24px auto 0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          borderTop: '1px solid var(--c-border)',
          paddingTop: 16,
          fontSize: 13,
        }}
      >
        <span style={{ color: 'var(--c-text-dim)' }}>© {new Date().getFullYear()} CanaleTV Live</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link href="/app">{lang === 'ro' ? 'Instalează aplicația' : 'Get the app'}</Link>
          <Link href="/api/feed">RSS</Link>
          <Link href="/sitemap.xml">{t.sitemap}</Link>
          <Link href="/settings/notifications">{t.notifications}</Link>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              background: 'var(--c-surface)',
              color: 'var(--c-text)',
              border: '1px solid var(--c-border)',
              borderRadius: 10,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            ↑ {t.backToTop}
          </button>
        </span>
      </div>
    </footer>
  );
}
