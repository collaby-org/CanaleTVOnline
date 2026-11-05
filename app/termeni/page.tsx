import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Termeni și condiții | CanaleTV Live',
  description: 'Termenii și condițiile de utilizare a platformei CanaleTV Live.',
};

export default function TermeniPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>Termeni și condiții</h1>
        <div style={{ color: '#c8cfd8', lineHeight: 1.8, marginTop: 12 }}>
          <p>
            Prin accesarea și utilizarea site-ului CanaleTV Live (denumit în continuare „Platforma”) accepți acești Termeni și condiții. Platforma oferă vizionarea gratuită a canalelor TV românești în scop informativ și personal.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>1. Utilizare permisă.</strong> Poți accesa conținutul Platformei exclusiv pentru uz personal și necomercial. Este interzisă redistribuirea, înregistrarea, vânzarea sau încorporarea fluxurilor video în alte servicii fără acord prealabil.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>2. Disponibilitate.</strong> Fluxurile live sunt furnizate de terți și pot fi întrerupte temporar. Nu garantăm disponibilitatea continuă a unui anumit canal, însă depunem eforturi pentru a menține o experiență stabilă.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>3. Chat live.</strong> În chat se aplică regulile de conduită civilizată: este interzis limbajul vulgar, spamul, publicitatea neautorizată și orice conținut ilegal. Ne rezervăm dreptul de a elimina mesaje care încalcă aceste reguli.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>4. Răspundere.</strong> Platforma este oferită „ca atare”. Nu suntem răspunzători pentru pierderi rezultate din întreruperi temporare ale fluxurilor sau din utilizarea conținutului furnizat de terți.
          </p>
          <p>
            <strong style={{ color: '#fff' }}>5. Modificări.</strong> Ne rezervăm dreptul de a actualiza acești termeni. Variantă actualizată este publicată pe această pagină, iar continuarea utilizării implică acceptarea ei.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
