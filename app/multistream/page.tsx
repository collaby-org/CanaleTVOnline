import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Multistream from '@/components/Multistream';
import { channels } from '@/lib/store';

export const metadata = {
  title: 'Multistream — Vizionează 2-4 canale TV în același timp | CanaleTV Live',
  description: 'Multistream CanaleTV Live: vizionează până la 4 canale TV live simultan, gratuit, fără înregistrare.',
};

export default function MultistreamPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>📺 Multistream — până la 4 canale simultan</h1>
        <p style={{ color: '#9aa5b1', marginTop: 8 }}>
          Alege canale din lista de jos pentru a le urmări pe toate, în același timp. Poți partaja o configurație cu linkuri de forma <code>/multistream?a=protv&amp;b=antena-1</code>.
        </p>
        <Multistream channels={channels} />
      </main>
      <Footer />
    </>
  );
}
