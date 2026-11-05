import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Români în Străinătate — TV Online Gratis, Acasă | CanaleTV Live',
  description: 'Urmărește TV românesc live din străinătate, gratuit: programul României la ora ta locală, oricând.',
};

const ROWS: Array<{ city: string; offset: string }> = [
  { city: 'România (ora locală)', offset: '19:00' },
  { city: 'Europa Centrală (CET)', offset: '18:00' },
  { city: 'Regatul Unit (UK)', offset: '17:00' },
  { city: 'Coasta de Est SUA', offset: '12:00' },
  { city: 'Coasta de Vest SUA', offset: '09:00' },
];

const CITIES = [
  'Londra', 'Dublin', 'Paris', 'Berlin', 'Madrid', 'Roma', 'Amsterdam',
  'Viena', 'Bruxelles', 'New York', 'Chicago', 'Orlando', 'Toronto', 'Montreal',
];

export default function RomaniInStrainatatePage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>🇷🇴 Români în Străinătate — TV de acasă, oriunde ai fi</h1>
        <p style={{ color: '#c8cfd8', marginTop: 8, lineHeight: 1.7 }}>
          Doar dor de acasă? Urmărește canalele TV românești live, gratuit, direct din browser — fără aplicații, fără înregistrare. Știrile, serialele, emisiunile de divertisment și meciurile preferate sunt la un click distanță, oricât de departe ai fi de România.
        </p>

        <h2 style={{ color: '#fff', marginTop: 28 }}>🕐 Ora României la ora ta locală</h2>
        <p style={{ color: '#9aa5b1', marginTop: 8 }}>
          Dacă în România este <strong style={{ color: '#fff' }}>19:00</strong>, la tine este:
        </p>
        <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse', background: '#0d1017', borderRadius: 10, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#141922' }}>
              <th style={{ color: '#fff', textAlign: 'left', padding: '10px 14px' }}>Locație</th>
              <th style={{ color: '#fff', textAlign: 'left', padding: '10px 14px' }}>Ora locală</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.city} style={{ borderTop: '1px solid #1f2430' }}>
                <td style={{ color: '#c8cfd8', padding: '10px 14px' }}>{r.city}</td>
                <td style={{ color: '#34d399', fontWeight: 700, padding: '10px 14px' }}>{r.offset}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={{ color: '#fff', marginTop: 28 }}>📍 Pentru românii din:</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {CITIES.map((c) => (
            <span key={c} style={{ background: '#141922', border: '1px solid #1f2430', color: '#c8cfd8', borderRadius: 999, padding: '6px 14px', fontSize: 13 }}>
              {c}
            </span>
          ))}
        </div>

        <h2 style={{ color: '#fff', marginTop: 28 }}>▶️ Începe să vizionezi</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <Link href="/" style={{ background: '#10b981', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700 }}>📺 Toate canalele live</Link>
          <Link href="/top-live" style={{ background: '#141922', border: '1px solid #1f2430', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700 }}>🔥 Top Live</Link>
          <Link href="/multistream" style={{ background: '#141922', border: '1px solid #1f2430', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700 }}>▣ Multistream</Link>
        </div>

        <p style={{ color: '#9aa5b1', marginTop: 24, lineHeight: 1.7 }}>
          Funcționează pe orice dispozitiv: telefon, tabletă, laptop sau Smart TV. Conexiunea este securizată, iar streamurile se adaptează automat calității rețelei tale.
        </p>
      </main>
      <Footer />
    </>
  );
}
