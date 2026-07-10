import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, ArrowRight } from 'lucide-react';
import { resolveIcon } from '../../utils/iconMap';

export interface BlogPostCardData {
  id: string | number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  views: number;
  readMinutes: number;
  publishedAt: string;
  tags: string[];
  [key: string]: unknown;
}

interface BlogCardProps {
  post: BlogPostCardData;
  index?: number;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogCard({ post, index = 0 }: BlogCardProps): React.ReactElement {
  const { t } = useTranslation();
  const Icon = resolveIcon(post.iconKey);
  return (
    <Link to={`/blog/${post.slug}`} style={{ textDecoration:'none' }}>
      <motion.article initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true, margin:'-30px' }} transition={{ duration:0.5, delay:(index%3)*0.1 }}
        className="card" style={{ overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', background:post.bg, border:`1.5px solid ${post.border}`, height:'100%' }}>

        <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', background:'#fff', borderBottom:`1.5px solid ${post.border}` }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:`radial-gradient(circle at 80% 20%, ${post.color}12, transparent)` }} />
          <div style={{ width:50, height:50, borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', background:post.bg, border:`1.5px solid ${post.border}`, zIndex:1 }}>
            <Icon size={22} style={{ color:post.color }} />
          </div>
          <div style={{ position:'absolute', top:10, left:12 }}>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:post.bg, color:post.color, border:`1px solid ${post.border}`, fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{post.category}</span>
          </div>
          <div style={{ position:'absolute', top:12, right:12, fontSize:11, color:'#94a3b8' }}>{t('cards.blog.views', { n: formatViews(post.views) })}</div>
        </div>

        <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', flexGrow:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#94a3b8', marginBottom:9 }}>
            <Clock size={11}/>{t('cards.blog.readMinutes', { n: post.readMinutes })} · {formatDate(post.publishedAt)}
          </div>
          <h3 style={{ fontSize:14, fontWeight:800, color:'#0f172a', lineHeight:1.5, marginBottom:7,
            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{post.title}</h3>
          <p style={{ fontSize:12, color:'#64748b', lineHeight:1.75, marginBottom:12, flexGrow:1,
            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{post.excerpt}</p>

          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
            {post.tags.map((tag: string) => <span key={tag} style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:'#fff', color:'#64748b', border:'1px solid #e2e8f0', fontFamily:'JetBrains Mono,monospace' }}>#{tag}</span>)}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:post.color }}>
            {t('cards.blog.continue')} <ArrowRight size={13}/>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
