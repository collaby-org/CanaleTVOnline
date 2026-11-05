import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Politică de confidențialitate | CanaleTV Live',
  description: 'Politica de confidențialitate CanaleTV Live — ce date stocăm și de ce.',
};

export default function ConfidentialitatePage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>Politică de confidențialitate</h1>
        <div style={{ color: '#c8cfd8', lineHeight: 1.8, marginTop: 12 }}>
          <p>
            Respectăm confidențialitatea vizitatorilor noștri. Această pagină explică, pe scurt și clar, ce date prelucrează CanaleTV Live și cum sunt folosite.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>Date stocate local.</strong> Pentru a personaliza experiența (favorite, canale vizionate recent, evaluări, pseudonimul din chat, abonarea la notificări), stocăm în browserul tău date locale (localStorage). Acestea nu părăsesc dispozitivul tău și pot fi șterse oricând din setările browserului.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>Mesaje din chat.</strong> Mesajele trimise în chatul live sunt publicate sub pseudonimul ales de tine și pot include mesaje de reacție sau voturi în sondaje. Nu colectăm adrese de email sau identități reale pentru chat.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>Analitică și reclame.</strong> Putem folosi instrumente de măsurare a audienței și servicii de reclame (Google Analytics, Google AdSense), care își prelucrează datele conform propriilor politici. Implicarea se face doar cu consimțământul tău, exprimat prin bannerul de consimțământ.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>Contact și raportări.</strong> Dacă ne scrii prin pagina de contact, datele de contact sunt folosite exclusiv pentru a-ți răspunde solicitării.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>Drepturile tale.</strong> Poți cere oricând informații despre datele tale sau ștergerea acestora, scriindu-ne din pagina de contact. Detalii suplimentare găsești și în Politica cookies.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
