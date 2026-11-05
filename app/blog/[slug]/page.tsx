import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { blogPosts } from '@/lib/store';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = blogPosts[params.slug];
  if (!post) return { title: 'Articol negăsit | CanaleTV Live' };
  return { title: `${post.title} | CanaleTV Live`, description: post.excerpt, alternates: { canonical: `/blog/${post.slug}` } };
}

function renderMd(md: string) {
  const lines = md.split('\n');
  const out: React.ReactNode[] = [];
  let table: string[][] = [];
  let list: string[] = [];
  const flushTable = () => {
    if (table.length === 0) return;
    const head = table[0];
    const body = table.slice(2);
    out.push(<table key={'t' + out.length} style={{ borderCollapse: 'collapse', margin: '12px 0' }}><thead><tr>{head.map((h, i) => <th key={i} style={{ border: '1px solid #1f2430', padding: 6, color: '#fff' }}>{h}</th>)}</tr></thead><tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} style={{ border: '1px solid #1f2430', padding: 6, color: '#d7dce6' }}>{c}</td>)}</tr>)}</tbody></table>);
    table = [];
  };
  const flushList = () => {
    if (list.length === 0) return;
    out.push(<ul key={'l' + out.length} style={{ color: '#d7dce6' }}>{list.map((li, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />)}</ul>);
    list = [];
  };
  const inline = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\s)\*(.+?)\*/g, '$1<i>$2</i>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#34d399">$1</a>');
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('|')) {
      flushList();
      const cells = t.split('|').slice(1, -1).map((c) => c.trim());
      if (!cells.every((c) => /^[-:\s]+$/.test(c))) table.push(cells);
      return;
    }
    flushTable();
    if (/^#{1,6}\s/.test(t)) {
      flushList();
      const level = t.match(/^#+/)![0].length;
      const text = t.replace(/^#+\s/, '');
      const Tag = `h${Math.min(6, level + 1)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      out.push(<Tag key={i} style={{ color: '#fff' }} dangerouslySetInnerHTML={{ __html: inline(text) }} />);
    } else if (/^(\d+\.\s|[-*]\s)/.test(t)) {
      list.push(t.replace(/^(\d+\.\s|[-*]\s)/, ''));
    } else if (t === '') {
      flushList();
    } else {
      flushList();
      out.push(<p key={i} style={{ color: '#d7dce6' }} dangerouslySetInnerHTML={{ __html: inline(t) }} />);
    }
  });
  flushList(); flushTable();
  return out;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts[params.slug];
  if (!post) notFound();
  return (
    <>
      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ color: '#fff', marginTop: 16 }}>{post.title}</h1>
        <p style={{ color: '#8a93a6' }}>{post.author} · {new Date(post.published_at).toLocaleDateString('ro-RO')} · 👁 {post.views}</p>
        <div>{renderMd(post.content || post.excerpt || '')}</div>
      </main>
      <Footer />
    </>
  );
}
