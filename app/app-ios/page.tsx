import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Aplicația CanaleTV Live pentru iOS — PWA | CanaleTV Live',
  description: 'Adaugă CanaleTV Live pe ecranul principal pe iPhone sau iPad și urmărește TV live ca dintr-o aplicație.',
};

export default function AppIosPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>🍎 CanaleTV Live pentru iOS</h1>
        <p style={{ color: '#c8cfd8', marginTop: 8, lineHeight: 1.8 }}>
          Pe iPhone și iPad, CanaleTV Live se adaugă pe ecranul principal ca PWA (Progressive Web App) — se deschide pe tot ecranul, ca o aplicație obișnuită, gratuit și fără descărcări din App Store.
        </p>
        <h2 style={{ color: '#fff', marginTop: 24 }}>Pași de instalare</h2>
        <ol style={{ color: '#c8cfd8', lineHeight: 1.9, marginTop: 8, paddingLeft: 20 }}>
          <li>Deschide site-ul CanaleTV Live în Safari (browserul din iOS).</li>
          <li>Atinge butonul <strong style={{ color: '#fff' }}>Distribuire</strong> (pătratul cu săgeata în sus), din bara de jos.</li>
          <li>Alege <strong style={{ color: '#fff' }}>„Adaugă pe ecranul principal”</strong>.</li>
          <li>Atinge <strong style={{ color: '#fff' }}>Adaugă</strong> — pictograma verde CanaleTV apare pe ecranul principal.</li>
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
