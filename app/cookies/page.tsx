import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Politică cookies | CanaleTV Live',
  description: 'Politica cookies CanaleTV Live — cum folosim cookie-uri și stocare locală.',
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>Politică cookies</h1>
        <div style={{ color: '#c8cfd8', lineHeight: 1.8, marginTop: 12 }}>
          <p>
            CanaleTV Live folosește cookie-uri și stocare locală pentru ca site-ul să funcționeze bine și pentru a-ți aminti preferințele. Iată ce categorie de cookie-uri utilizăm:
          </p>
          <p>
            <strong style={{ color: '#fff' }}>Cookie-uri esențiale.</strong> Sunt necesare pentru funcționalitatea de bază: tema (mod întunecat), limba interfeței, preferințele de consimțământ și menținerea sesiunii de vizionare.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>Stocare locală (localStorage).</strong> Reținem pe dispozitivul tău canale favorite, istoricul vizionărilor, evaluările oferite, pseudonimul din chat, reminderele de emisiuni și notificările push. Niciuna dintre aceste date nu este transmisă fără acțiunea ta (de exemplu, trimiterea unui mesaj în chat).
          </p>
          <p>
            <strong style={{ color: '#fff' }}>Analitică și reclame.</strong> Cu consimțământul tău, folosim cookie-uri de măsurare a audienței (Google Analytics) și de reclame (Google AdSense), care ajută la afișarea de conținut și reclame relevante.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>Cum controlezi cookie-urile.</strong> Poți accepta sau refuza categoriile opționale din bannerul de consimțământ, iar din setările browserului poți bloca sau șterge cookie-uri oricând. Blocarea cookie-urilor esențiale poate afecta funcționarea playerului și a preferințelor.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
