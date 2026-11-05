import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Disclaimer | CanaleTV Live',
  description: 'Disclaimer CanaleTV Live — informații despre conținutul și fluxurile afișate.',
};

export default function DisclaimerPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>Disclaimer</h1>
        <div style={{ color: '#c8cfd8', lineHeight: 1.8, marginTop: 12 }}>
          <p>
            CanaleTV Live este un ghid și un punct de acces către televiziune online. Informațiile despre canale, programe și orele de difuzare sunt oferite cu cea mai mare atenție, însă pot fi modificate de televiziunile respective fără notificare prealabilă. Nu ne asumăm răspunderea pentru modificări de program sau întreruperi de difuzare care nu depind de noi.
          </p>
          <p>
            Fluxurile video live sunt furnizate de terți. Drepturile asupra emisiunilor, mărcilor și siglelor aparțin titularilor lor. Nicio informație publicată pe Platformă (inclusiv recenziile, clasamentele, articolele din blog și programul TV) nu constituie sfat profesional de orice natură.
          </p>
          <p>
            Site-uri externe, linkuri și reclame afișate pe Platformă sunt oferite de parteneri terți; nu suntem responsabili pentru conținutul, politica de confidențialitate sau practicile acestora. Te încurajăm să citești politicile fiecărui site vizitat.
          </p>
          <p>
            Prezența unui canal sau a unei emisiuni în clasamentul Top Live reflectă doar popularitatea măsurată prin vizualizări pe Platformă și nu o recomandare editorială. Produsele și serviciile menționate aparțin proprietarilor lor respectivi.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
