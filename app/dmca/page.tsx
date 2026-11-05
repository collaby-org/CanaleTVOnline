import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'DMCA | CanaleTV Live',
  description: 'Procedura DMCA pentru notificări privind drepturile de autor pe CanaleTV Live.',
};

export default function DmcaPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>DMCA</h1>
        <div style={{ color: '#c8cfd8', lineHeight: 1.8, marginTop: 12 }}>
          <p>
            CanaleTV Live respectă drepturile de proprietate intelectuală și răspunde notificărilor conforme cu DMCA (Digital Millennium Copyright Act). Conținutul audio-video difuzat prin fluxuri aparține titularilor de drepturi respective; Platforma oferă doar acces la vizionare și nu găzduiește fișiere video proprii.
          </p>
          <p>
            Dacă ești titular de drepturi și consideri că un conținut accesibil prin Platformă îți încalcă drepturile, te rugăm să ne contactezi din pagina de contact, menționând:
          </p>
          <ul style={{ paddingLeft: 20 }}>
            <li>denumirea lucrării și dovada calității tale de titular (sau de reprezentant autorizat);</li>
            <li>adresa exactă (URL) a paginii unde apare conținutul contestat;</li>
            <li>datele de contact pentru a putea reveni la tine.</li>
          </ul>
          <p>
            La primirea unei notificări valide, vom investiga și, dacă este cazul, vom elimina sau bloca accesul la conținutul indicat într-un termen rezonabil. Solicitările nefondate sautrimise cu rea-credință pot fi respinse.
          </p>
          <p>
            Titularii de drepturi (televiziuni și distribuitori) care doresc un parteneriat oficial de difuzare sunt invitați să ne contacteze prin aceeași pagină de contact.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
