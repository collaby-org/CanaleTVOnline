import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { blogPosts } from '@/lib/store';

export const metadata = {
  title: 'Blog — CanaleTV Live',
  description: 'Articole și ghiduri despre TV online, recepție și streaming în România.',
};

export default function BlogPage() {
  const posts = Object.values(blogPosts);
  return (
    <>
      <Header />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>Blog ({posts.length})</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {posts.map((p) => (
            <article key={p.slug} style={{ border: '1px solid #1f2430', borderRadius: 10, padding: 16, background: '#0d1017' }}>
              <Link href={`/blog/${p.slug}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>{p.title}</Link>
              <p style={{ color: '#8a93a6' }}>{p.excerpt}</p>
              <p style={{ color: '#6b7486', fontSize: 12 }}>{p.author} · {new Date(p.published_at).toLocaleDateString('ro-RO')} · 👁 {p.views}</p>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
