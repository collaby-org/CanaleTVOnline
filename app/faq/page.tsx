import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'FAQ — Întrebări frecvente | CanaleTV Live',
  description: 'Întrebări frecvente despre CanaleTV Live: streaming, calitate, aplicații și conturi.',
};

const QA: Array<[string, string]> = [
  ['Este televizionarea gratuită?', 'Da. Toate canalele live de pe CanaleTV Live se urmăresc gratuit, direct din browser, fără înregistrare și fără închiriere de echipament.'],
  ['De ce îmi apare eroarea „Stream indisponibil”?', 'De obicei este o întrerupere temporară a fluxului sau o problemă de rețea. Apasă butonul „Reîncearcă” din player sau reîncarcă pagina — canalul revine în câteva secunde. Dacă eroarea persistă, poți raporta problema cu butonul 🚩 din player.'],
  ['Cum pot crește calitatea imaginii?', 'Calitatea se adaptează automat la conexiunea ta. Asigură-te că ai o rețea stabilă și folosește, dacă este disponibil, modul fullscreen sau theater din controalele playerului pentru o imagine mai mare.'],
  ['Pot urmări TV pe telefon sau Smart TV?', 'Da. Site-ul funcționează pe orice dispozitiv modern — telefon, tabletă, laptop și Smart TV. Poți instala site-ul ca PWA din paginile /app, /app-android și /app-ios, pentru acces rapid ca o aplicație.'],
  ['Cum funcționează Multistream?', 'Din pagina Multistream poți urmări simultan până la 4 canale. Sunetul este activ doar pe un singur canal la un moment dat (butonul 🔊), iar canalele se aleg din lista de jos. Poți partaja selecția prin linkul cu parametri, de exemplu /multistream?a=protv&b=antena-1.'],
  ['Trebuie să îmi creez cont?', 'Nu. Nu cerem cont sau date personale pentru vizionare. Favoritele, istoricul și evaluările sunt stocate local în browserul tău, iar chatul live folosește doar un pseudonim ales de tine.'],
];

export default function FaqPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>FAQ — Întrebări frecvente</h1>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {QA.map(([q, a]) => (
            <details key={q} style={{ background: '#0d1017', border: '1px solid #1f2430', borderRadius: 10, padding: '14px 18px' }}>
              <summary style={{ color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{q}</summary>
              <p style={{ color: '#c8cfd8', lineHeight: 1.7, marginTop: 10 }}>{a}</p>
            </details>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
