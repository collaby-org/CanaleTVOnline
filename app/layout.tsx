import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Announcements from '@/components/Announcements';
import CommandPalette from '@/components/CommandPalette';
import './globals.css';
import channelsData from '@/data/channels.json';

const SITE_URL = 'https://canaletvlive.online';

const SITE_TITLE = 'CanaleTV Live — TV Online Gratuit | Canale TV Live România';
const SITE_DESCRIPTION =
  'Urmărește cele mai populare canale TV românești live online, gratuit, oricând și oriunde — știri, sport, filme, divertisment și muzică.';
const SITE_KEYWORDS = 'canale tv live, tv online gratuit, canale tv live românia, live tv, program tv, ghid tv';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: SITE_URL,
    languages: {
      'ro-RO': SITE_URL,
      ro: SITE_URL,
      'x-default': SITE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  manifest: '/manifest.json',
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'CanaleTV Live',
    type: 'website',
    images: [{ url: SITE_URL + '/og-image.svg', width: 1200, height: 630, alt: 'CanaleTV Live' }],
    locale: 'ro_RO',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_URL + '/og-image.svg'],
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090c',
  width: 'device-width',
  initialScale: 1,
};

type TopChannel = { name: string; slug: string; views: number };

function topItems(): Array<{ name: string; slug: string }> {
  const list = (channelsData as Array<{ name: string; slug: string; views: number }>)
    .slice()
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 20);
  return list.map((c) => ({ name: c.name, slug: c.slug }));
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': SITE_URL + '/#website',
      url: SITE_URL,
      name: 'CanaleTV Live',
      description: SITE_DESCRIPTION,
      inLanguage: 'ro',
      potentialAction: {
        '@type': 'SearchAction',
        target: SITE_URL + '/?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': SITE_URL + '/#organization',
      name: 'CanaleTV Live',
      url: SITE_URL,
      logo: SITE_URL + '/favicon.svg',
    },
    {
      '@type': 'ItemList',
      name: 'Top canale TV live',
      itemListElement: topItems().map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        url: SITE_URL + '/watch/' + c.slug,
      })),
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ro" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700&family=Space+Grotesk:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "localStorage.setItem('theme','dark');localStorage.removeItem('theme_manual');",
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: [
              'window.dataLayer = window.dataLayer || [];',
              'function gtag(){dataLayer.push(arguments);}',
              "gtag('consent','default',{'ad_storage':'denied','analytics_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','functionality_storage':'granted','security_storage':'granted','wait_for_update':500});",
              "gtag('js', new Date());",
              "gtag('config','G-8JMS1ZL176');",
            ].join('\n'),
          }}
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-8JMS1ZL176" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5319812978064645"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>
          <Announcements />
          <Header />
          {children}
          <Footer />
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
