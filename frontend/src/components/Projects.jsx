import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, GitBranch, Eye } from 'lucide-react';

const PROJS = [
  { id:1, emoji:'🎓', title:'EduTech Platform',      cat:'Web App',  color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd', tags:['React','Node.js','PostgreSQL','WebRTC'],  desc:"Full-stack onlayn ta'lim platformasi. Real-time video va quiz tizimi.", stats:{users:'5,000+',uptime:'99.9%'} },
  { id:2, emoji:'💳', title:'FinTech Mobile App',    cat:'Mobile',   color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff', tags:['Flutter','Firebase','Stripe','BLoC'],     desc:'Zamonaviy banking ilovasi. Naqd pul transferi va investitsiya.', stats:{users:'12K+',txn:'$2M+'} },
  { id:3, emoji:'🛡️', title:'CyberGuard Dashboard', cat:'Security', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', tags:['Python','Django','Elasticsearch','React'],desc:'Enterprise-level kiberxavfsizlik monitoring tizimi.', stats:{threats:'50K+',uptime:'24/7'} },
  { id:4, emoji:'🤖', title:'AI Content Generator',  cat:'AI/ML',   color:'#db2777', bg:'#fdf2f8', border:'#fbcfe8', tags:['Python','OpenAI','FastAPI','Next.js'],    desc:"GPT-4 asosidagi matn va kod generatsiya qiluvchi SaaS platforma.", stats:{users:'3,200+',gen:'1M+'} },
  { id:5, emoji:'🛒', title:'E-Commerce Suite',      cat:'Web App',  color:'#d97706', bg:'#fffbeb', border:'#fde68a', tags:['Next.js','Prisma','Stripe','AWS'],        desc:"To'liq savdo tizimi: mahsulot, to'lov va analytics.", stats:{sales:'$5M+',products:'10K+'} },
  { id:6, emoji:'📊', title:'Smart Analytics Hub',   cat:'Data',    color:'#0284c7', bg:'#f0f9ff', border:'#bae6fd', tags:['Python','Kafka','ClickHouse','React'],    desc:"Real-time ma'lumotlar tahlili va vizualizatsiya platformasi.", stats:{points:'100M+',qps:'50K/d'} },
];

const CATS = ['All','Web App','Mobile','Security','AI/ML','Data'];

function ProjCard({ p, i }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-30px' }}
      transition={{ duration:0.5, delay:(i%3)*0.1 }} className="card"
      style={{ overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', background:p.bg, border:`1.5px solid ${p.border}` }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>

      {/* Visual */}
      <div style={{ position:'relative', height:150, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', borderBottom:`1.5px solid ${p.border}` }}>
        <div style={{ position:'absolute', top:10, left:12 }}>
          <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:`${p.color}15`, color:p.color, border:`1px solid ${p.border}`, fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{p.cat}</span>
        </div>
        <motion.div style={{ fontSize:50 }} animate={hover ? { scale:1.2, rotate:8 } : { scale:1, rotate:0 }} transition={{ type:'spring', stiffness:260 }}>{p.emoji}</motion.div>
        <AnimatePresence>
          {hover && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(4px)' }}>
              {[Eye, GitBranch, ExternalLink].map((Icon,idx) => (
                <motion.button key={idx} whileHover={{ scale:1.15 }}
                  style={{ width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:p.bg, border:`1.5px solid ${p.border}`, cursor:'pointer' }}>
                  <Icon size={15} style={{ color:p.color }} />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div style={{ padding:'16px 18px' }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:5 }}>{p.title}</h3>
        <p style={{ fontSize:12, color:'#64748b', lineHeight:1.7, marginBottom:12 }}>{p.desc}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
          {p.tags.map(t => <span key={t} style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:'#fff', color:'#64748b', border:'1px solid #e2e8f0', fontFamily:'JetBrains Mono,monospace' }}>{t}</span>)}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTop:`1px solid ${p.border}` }}>
          <div style={{ display:'flex', gap:16 }}>
            {Object.entries(p.stats).map(([k,v]) => (
              <div key={k}><div style={{ fontSize:13, fontWeight:800, color:p.color }}>{v}</div><div style={{ fontSize:10, color:'#94a3b8', textTransform:'capitalize' }}>{k}</div></div>
            ))}
          </div>
          <button style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:p.color, color:'#fff', border:'none', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
            View <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const [active, setActive] = useState('All');
  const list = active === 'All' ? PROJS : PROJS.filter(p => p.cat === active);
  return (
    <section id="projects" className="section-light" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:48 }}>
          <span className="pill" style={{ background:'#f0fdf4', borderColor:'#bbf7d0', color:'#16a34a' }}>Portfolio</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>Loyiha<span className="accent">larimiz</span></h2>
          <p className="sub">Talabalarimiz va jamoamiz tomonidan yaratilgan real mahsulotlar</p>
        </motion.div>

        {/* Filter */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap', marginBottom:40 }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setActive(c)} style={{ padding:'7px 20px', borderRadius:50, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.25s',
              background: active===c ? '#0f172a' : '#fff', color: active===c ? '#fff' : '#475569',
              border: active===c ? 'none' : '1.5px solid #e2e8f0', boxShadow: active===c ? '0 4px 14px rgba(0,0,0,0.15)' : 'none' }}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="proj-grid">
          {list.map((p,i) => <ProjCard key={p.id} p={p} i={i} />)}
        </div>
      </div>
      <style>{`@media(max-width:1024px){.proj-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.proj-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
