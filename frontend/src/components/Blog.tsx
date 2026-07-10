import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { listBlogPosts } from '../api/blog';
import BlogCard from './blog/BlogCard';
import React from 'react';

type BlogStatus = 'loading' | 'ready' | 'error';

export default function Blog(): React.ReactElement {
  const { t } = useTranslation();
  const [posts, setPosts]   = useState<any[]>([]);
  const [status, setStatus] = useState<BlogStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    listBlogPosts({ limit: 6 })
      .then(({ items }: { items: any[] }) => { if (!cancelled) { setPosts(items); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="blog" className="section-light" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:52 }}>
          <span className="pill" style={{ background:'#f0f9ff', borderColor:'#bae6fd', color:'#0284c7' }}>{t('home.blog.pill')}</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>{t('home.blog.titleStart')} <span className="accent">{t('home.blog.titleAccent')}</span></h2>
          <p className="sub">{t('home.blog.subtitle')}</p>
        </motion.div>

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
        {status === 'error' && <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>{t('home.blog.loadError')}</p>}

        {status === 'ready' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="blog-grid">
            {posts.map((p: any, i: number) => <BlogCard key={p.id} post={p} index={i}/>)}
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:36 }}>
          <Link to="/blog">
            <button className="btn-outline" style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
              {t('home.blog.allPosts')} <ArrowRight size={15}/>
            </button>
          </Link>
        </div>
      </div>
      <style>{`@media(max-width:1024px){.blog-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.blog-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
