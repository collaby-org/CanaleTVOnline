import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Aplicația CanaleTV Live pentru Android — PWA | CanaleTV Live',
  description: 'Instalează CanaleTV Live ca PWA pe Android: ținuta TV live ca dintr-o aplicație nativă, gratuit.',
};

export default function AppAndroidPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>🤖 CanaleTV Live pentru Android</h1>
        <p style={{ color: '#c8cfd8', marginTop: 8, lineHeight: 1.8 }}>
          Pe Android, CanaleTV Live se instalează ca PWA (Progressive Web App) — o aplicație web care se comportă ca una nativă: pictogramă pe ecranul principal, deschidere pe tot ecranul și fără bare de adresă. Nu ocupă mult spațiu, se actualizează automat și este complet gratuită.
        </p>
        <h2 style={{ color: '#fff', marginTop: 24 }}>Pași de instalare</h2>
        <ol style={{ color: '#c8cfd8', lineHeight: 1.9, marginTop: 8, paddingLeft: 20 }}>
          <li>Deschide site-ul CanaleTV Live în Chrome (sau alt browser modern pe Android).</li>
          <li>Atinge meniul <strong style={{ color: '#fff' }}>⋮</strong> din colțul din dreapta sus.</li>
          <li>Alege opțiunea <strong style={{ color: '#fff' }}>„Instalează aplicația”</strong> (sau <strong style={{ color: '#fff' }}>„Adaugă pe ecranul principal”</strong>).</li>
          <li>Confirmă instalarea — pictograma verde CanaleTV apare pe ecranul principal.</li>
        </ol>
        <p style={{ color: '#9aa5b1', marginTop: 8, fontSize: 14 }}>
          Manifest aplicație: <a href="/manifest.json" style={{ color: '#34d399' }}>/manifest.json</a> (nume: „CanaleTV PRO - TV Online Gratis”).
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <Link href="/" style={{ background: '#10b981', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700 }}>📥 Instalează acum — deschide site-ul</Link>
          <Link href="/app" style={{ background: '#141922', border: '1px solid #1f2430', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700 }}>Pagina aplicației</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
