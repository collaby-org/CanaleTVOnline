import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Despre noi | CanaleTV Live',
  description: 'Despre CanaleTV Live — televiziune online gratuită pentru români de pretutindeni.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>Despre noi</h1>
        <div style={{ color: '#c8cfd8', lineHeight: 1.8, marginTop: 12 }}>
          <p>
            <strong style={{ color: '#fff' }}>CanaleTV Live</strong> este o platformă de televiziune online gratuită, creată pentru românii de pretutindeni care vor să rămână conectați la cultura și la realitatea din țară. Aici poți urmări direct în browser cele mai populare canale TV românești — știri, sport, filme, divertisment, documentare și programe pentru copii — fără înregistrare și fără cost.
          </p>
          <p>
            Ne-am propus să oferim o experiență simplă și rapidă: un singur click și ești live. De aceea, site-ul funcționează pe orice dispozitiv, include ghidul TV complet cu programul zilei, funcția Multistream pentru până la 4 canale simultan, clasamentul Top Live și chat live alături de alți telespectatori.
          </p>
          <p>
            Acordăm atenție calității fluxurilor, siguranței navigării și informațiilor actualizate zilnic. Dacă întâmpini o problemă cu un canal sau ai o sugestie, ne poți scrie oricând din pagina de contact. Îți mulțumim că ne urmărești și sperăm să te avem zilnic alături de noi — acasă, oriunde ai fi în lume.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
