import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Clock, Eye, ArrowLeft } from 'lucide-react';
import { getBlogPostBySlug } from '../api/blog';
import { resolveIcon } from '../utils/iconMap';
import { formatDate } from '../utils/format';
import ComingSoon from '../components/common/ComingSoon';

interface BlogPost {
  iconKey: string;
  bg: string;
  border: string;
  color: string;
  category: string;
  title: string;
  readMinutes: number;
  views: number;
  publishedAt: string;
  content: string;
  tags: string[];
  [key: string]: unknown;
}

interface ApiError {
  status?: number;
}

type Status = 'loading' | 'ready' | 'not-found' | 'error';

export default function BlogDetailPage(): React.ReactElement {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getBlogPostBySlug(slug!)
      .then((data: BlogPost) => { if (!cancelled) { setPost(data); setStatus('ready'); } })
      .catch((err: ApiError) => { if (!cancelled) setStatus(err.status === 404 ? 'not-found' : 'error'); });
    return () => { cancelled = true; };
  }, [slug]);

  if (status === 'loading') {
    return <section style={{ padding:'200px 24px 80px', textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</section>;
  }
  if (status === 'not-found') {
    return <ComingSoon title={t('pages.blogDetail.notFoundTitle')} sub={t('pages.blogDetail.notFoundSub')} />;
  }
  if (status === 'error') {
    return <ComingSoon title={t('common.error')} sub={t('pages.blogDetail.errorSub')} />;
  }

  const Icon: React.ElementType = resolveIcon(post!.iconKey);

  return (
    <section style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:760, margin:'0 auto', padding:'0 24px' }}>
        <Link to="/blog" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none', marginBottom:24 }}>
          <ArrowLeft size={14}/> {t('pages.blogDetail.back')}
        </Link>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
            <div style={{ width:52, height:52, borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', background:post!.bg, border:`1.5px solid ${post!.border}`, flexShrink:0 }}>
              <Icon size={24} style={{ color:post!.color }} />
            </div>
            <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:post!.bg, color:post!.color, border:`1px solid ${post!.border}`, fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{post!.category}</span>
          </div>

          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(26px,4vw,38px)', fontWeight:800, color:'#0f172a', lineHeight:1.25, marginBottom:16 }}>{post!.title}</h1>

          <div style={{ display:'flex', gap:20, flexWrap:'wrap', fontSize:13, color:'#94a3b8', marginBottom:28, paddingBottom:24, borderBottom:'1px solid #f1f5f9' }}>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><Clock size={13}/> {t('pages.blogDetail.readMinutes', { n: post!.readMinutes })}</span>
            <span style={{ display:'flex', alignItems:'center', gap:5 }}><Eye size={13}/> {t('pages.blogDetail.views', { n: post!.views })}</span>
            <span>{formatDate(post!.publishedAt, { day:'numeric', month:'long', year:'numeric' })}</span>
          </div>

          <div style={{ fontSize:15, color:'#334155', lineHeight:1.9 }}>
            {post!.content.split('\n').filter(Boolean).map((para: string, i: number) => (
              <p key={i} style={{ marginBottom:18 }}>{para}</p>
            ))}
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:28, paddingTop:24, borderTop:'1px solid #f1f5f9' }}>
            {post!.tags.map((tag: string) => (
              <span key={tag} style={{ fontSize:11, padding:'4px 10px', borderRadius:12, background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0', fontFamily:'JetBrains Mono,monospace' }}>#{tag}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
