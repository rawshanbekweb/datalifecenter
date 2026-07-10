import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeader from '../components/common/SectionHeader';
import BlogCard, { BlogPostCardData } from '../components/blog/BlogCard';
import { listBlogPosts } from '../api/blog';

type BlogPost = BlogPostCardData;

type Status = 'loading' | 'ready' | 'error';

export default function BlogPage(): React.ReactElement {
  const { t } = useTranslation();
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [category, setCategory] = useState<string>('');
  const [status, setStatus]     = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    listBlogPosts({ limit: 50 })
      .then(({ items }: { items: BlogPost[] }) => { if (!cancelled) { setAllPosts(items); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo<string[]>(() => ['', ...new Set(allPosts.map((p) => p.category))], [allPosts]);
  const posts: BlogPost[] = category ? allPosts.filter((p) => p.category === category) : allPosts;

  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <SectionHeader pill={t('pages.blog.pill')} title={t('pages.blog.title')} accent={t('pages.blog.accent')} sub={t('pages.blog.sub')} />

        {categories.length > 1 && (
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:32 }}>
            {categories.map((c) => (
              <button key={c || 'all'} onClick={() => setCategory(c)}
                style={{ fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:20, cursor:'pointer',
                  background: category === c ? '#0f172a' : '#fff', color: category === c ? '#fff' : '#475569',
                  border:'1px solid #e2e8f0' }}>
                {c || t('common.all')}
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
        {status === 'error' && <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>{t('home.blog.loadError')}</p>}
        {status === 'ready' && posts.length === 0 && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('pages.blog.empty')}</p>
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
