import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pagina negăsită (404) | CanaleTV Live',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '64px 16px', textAlign: 'center' }}>
      <h1 className="font-display" style={{ fontSize: 56, margin: '0 0 8px' }}>
        Pagina negăsită (404)
      </h1>
      <p style={{ color: 'var(--c-text-dim)' }}>
        Pagina căutată nu există sau a fost mutată.
      </p>
      <p>
        <Link href="/">← Înapoi la pagina principală</Link>
      </p>
    </main>
  );
}
