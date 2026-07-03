import { useEffect, useMemo, useState } from 'react';
import SectionHeader from '../components/common/SectionHeader';
import BlogCard from '../components/blog/BlogCard';
import { listBlogPosts } from '../api/blog';

export default function BlogPage() {
  const [allPosts, setAllPosts] = useState([]);
  const [category, setCategory] = useState('');
  const [status, setStatus]     = useState('loading');

  useEffect(() => {
    let cancelled = false;
    listBlogPosts({ limit: 50 })
      .then(({ items }) => { if (!cancelled) { setAllPosts(items); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => ['', ...new Set(allPosts.map((p) => p.category))], [allPosts]);
  const posts = category ? allPosts.filter((p) => p.category === category) : allPosts;

  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <SectionHeader pill="Knowledge Hub" title="Blog &" accent="Maqolalar" sub="Texnologiya, dasturlash va IT karera bo'yicha so'nggi maqolalar" />

        {categories.length > 1 && (
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:32 }}>
            {categories.map((c) => (
              <button key={c || 'all'} onClick={() => setCategory(c)}
                style={{ fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:20, cursor:'pointer',
                  background: category === c ? '#0f172a' : '#fff', color: category === c ? '#fff' : '#475569',
                  border:'1px solid #e2e8f0' }}>
                {c || 'Barchasi'}
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
        {status === 'error' && <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>Maqolalarni yuklab bo'lmadi.</p>}
        {status === 'ready' && posts.length === 0 && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>Hech qanday maqola topilmadi.</p>
        )}

        {status === 'ready' && posts.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="blog-grid">
            {posts.map((p, i) => <BlogCard key={p.id} post={p} index={i}/>)}
          </div>
        )}
      </div>
      <style>{`@media(max-width:1024px){.blog-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.blog-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
