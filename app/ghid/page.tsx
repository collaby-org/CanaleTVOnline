import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Ghid TV Complet | CanaleTV Live',
  description: 'Ghidul TV complet CanaleTV Live: programul tuturor canalelor, zi de zi, cu ora de difuzare a fiecărei emisiuni.',
};

export default function GhidPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>🗓️ Ghid TV Complet</h1>
        <p style={{ color: '#c8cfd8', marginTop: 8, lineHeight: 1.8 }}>
          Ghidul TV complet de pe CanaleTV Live îți arată, pentru fiecare canal, ce se difuzează acum, ce urmează și la ce oră. Este actualizat la fiecare câteva minute, pe baza programului oficial al zilei.
        </p>
        <h2 style={{ color: '#fff', marginTop: 24 }}>Cum folosești ghidul</h2>
        <ul style={{ color: '#c8cfd8', lineHeight: 1.9, marginTop: 8, paddingLeft: 20 }}>
          <li><strong style={{ color: '#fff' }}>Ghidul interactiv</strong> — pe axa orară vezi toate emisiunile zilei, canal cu canal, cu indicatorul LIVE pe programul aflat în desfășurare.</li>
          <li><strong style={{ color: '#fff' }}>Programul de azi</strong> — pagina „Ce e la TV Azi” prezintă întreaga grilă a zilei, cu posibilitatea de a porni direct canalul dorit.</li>
          <li><strong style={{ color: '#fff' }}>Programul de mâine</strong> — verifică din timp ce urmează, ca să nu ratezi emisiunile preferate.</li>
          <li><strong style={{ color: '#fff' }}>Programul pe zile</strong> — pentru fiecare canal poți deschide pagina de program zilnic, cu toate emisiunile și orele exacte.</li>
          <li><strong style={{ color: '#fff' }}>Pin de remindere</strong> — pe pagina canalului, fixează emisiunile viitoare cu 📌 și primești un reminder înainte de difuzare.</li>
        </ul>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <Link href="/ghid-tv" style={{ background: '#10b981', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700 }}>Deschide ghidul interactiv</Link>
          <Link href="/azi" style={{ background: '#141922', border: '1px solid #1f2430', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700 }}>Ce e la TV Azi</Link>
          <Link href="/maine" style={{ background: '#141922', border: '1px solid #1f2430', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700 }}>Programul de mâine</Link>
        </div>
        <p style={{ color: '#9aa5b1', marginTop: 24, lineHeight: 1.7 }}>
          Orele afișate sunt ora României. Modificările de ultim moment operate de televiziuni pot face ca unele emisiuni să decaleze ușor față de programul anunțat; în acest caz, informațiile din player (programul curent și cel următor) sunt mereu cele mai actuale.
        </p>
      </main>
      <Footer />
    </>
  );
}
