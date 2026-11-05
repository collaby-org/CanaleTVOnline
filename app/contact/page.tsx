import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Contact | CanaleTV Live',
  description: 'Contactează echipa CanaleTV Live — raportări, întrebări și sugestii.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>Contact</h1>
        <p style={{ color: '#c8cfd8', marginTop: 8, lineHeight: 1.7 }}>
          Ai găsit un canal care nu funcționează, vrei să sugerezi un conținut nou sau ai o întrebare despre site? Scrie-ne și răspundem de obicei în maximum 48 de ore lucrătoare.
        </p>
        <form action="mailto:contact@canaletvlive.online" method="post" encType="text/plain" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#c8cfd8', fontSize: 14 }}>
            Nume
            <input name="name" required style={{ background: '#0d1017', border: '1px solid #1f2430', borderRadius: 8, color: '#fff', padding: '10px 14px' }} placeholder="Numele tău" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#c8cfd8', fontSize: 14 }}>
            Email
            <input name="email" type="email" required style={{ background: '#0d1017', border: '1px solid #1f2430', borderRadius: 8, color: '#fff', padding: '10px 14px' }} placeholder="email@exemplu.ro" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#c8cfd8', fontSize: 14 }}>
            Mesaj
            <textarea name="message" required rows={5} style={{ background: '#0d1017', border: '1px solid #1f2430', borderRadius: 8, color: '#fff', padding: '10px 14px', resize: 'vertical' }} placeholder="Descrie pe scurt problema sau sugestia…" />
          </label>
          <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 18px', fontWeight: 700, cursor: 'pointer' }}>
            Trimite mesajul
          </button>
        </form>
        <p style={{ color: '#8a93a6', fontSize: 13, marginTop: 16, lineHeight: 1.7 }}>
          Pentru probleme legate de un stream, folosește și butonul 🚩 „Raportează problema” din player, direct pe pagina canalului. Datele transmise prin formular sunt folosite exclusiv pentru a răspunde solicitărilor tale.
        </p>
      </main>
      <Footer />
    </>
  );
}
