import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Aplicația CanaleTV Live — Instalează ca PWA | CanaleTV Live',
  description: 'Instalează CanaleTV Live ca aplicație web (PWA) pe orice dispozitiv și urmărește TV live ca dintr-o aplicație nativă.',
};

export default function AppPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>📱 Aplicația CanaleTV Live</h1>
        <p style={{ color: '#c8cfd8', marginTop: 8, lineHeight: 1.8 }}>
          CanaleTV Live este un PWA (Progressive Web App): îl poți instala pe telefon, tabletă sau computer, direct din browser, și îl folosești ca pe o aplicație obișnuită — pe tot ecranul, fără bare de adresă, cu acces rapid de pe ecranul principal.
        </p>
        <p style={{ color: '#c8cfd8', marginTop: 8, lineHeight: 1.8 }}>
          Fișierul de manifest al aplicației: <a href="/manifest.json" style={{ color: '#34d399' }}>/manifest.json</a>. Numele aplicației este „CanaleTV PRO - TV Online Gratis”, cu iconița verde CanaleTV.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <Link href="/app-android" style={{ background: '#10b981', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700 }}>🤖 Instalează pe Android</Link>
          <Link href="/app-ios" style={{ background: '#141922', border: '1px solid #1f2430', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700 }}>🍎 Instalează pe iOS</Link>
        </div>
        <h2 style={{ color: '#fff', marginTop: 28 }}>🖼️ Capturi de ecran</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
          {[
            'Ecran principal cu canalele live',
            'Player video cu controale complete',
            'Multistream — 4 canale simultan',
            'Ghid TV interactiv',
          ].map((t, i) => (
            <div key={t} style={{ background: '#0d1017', border: '1px solid #1f2430', borderRadius: 10, padding: 18, minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 28 }} aria-hidden>{['📺', '▶️', '▣', '🗓️'][i]}</span>
              <span style={{ color: '#9aa5b1', fontSize: 13 }}>{t}</span>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
