import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, BookOpen, Shield, Map } from 'lucide-react';

const POSTS = [
  { id:1, icon:BookOpen, cat:'Tutorial',  color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd', time:'8 daqiqa',  date:'25 Iyun, 2025', views:'3.2K', tags:['React','JavaScript'], title:"React Hooks: useState va useEffect ni chuqur o'rganing",  excerpt:"React Hooks — zamonaviy React dasturlashning asosi. Ushbu maqolada real misolar bilan o'rganamiz." },
  { id:2, icon:Shield,   cat:'Security', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', time:'12 daqiqa', date:'20 Iyun, 2025', views:'5.8K', tags:['Security','SQL'],    title:'Kiberxavfsizlik: SQL Injection dan qanday himoyalanish',   excerpt:"SQL Injection — eng keng tarqalgan zaifliklardan biri. Himoya usullari va amaliy misollarni ko'rib chiqamiz." },
  { id:3, icon:Map,      cat:'Career',   color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff', time:'15 daqiqa', date:'15 Iyun, 2025', views:'9.1K', tags:['Career','IT'],       title:"IT Sanoatida Karera: 2025-yilgi To'liq Roadmap",           excerpt:"Frontend, Backend yoki AI — qaysi yo'nalishni tanlash kerak? 2025-yilgi IT karera yo'l xaritasi." },
  { id:4, icon:BookOpen, cat:'Tutorial', color:'#d97706', bg:'#fffbeb', border:'#fde68a', time:'20 daqiqa', date:'10 Iyun, 2025', views:'4.5K', tags:['Node.js','API'],     title:"Node.js va Express bilan REST API qurish",                  excerpt:"Sifatli REST API yaratish sirlarini o'rganing. Authentication, validation va documentation." },
  { id:5, icon:Shield,   cat:'AI',       color:'#db2777', bg:'#fdf2f8', border:'#fbcfe8', time:'18 daqiqa', date:'5 Iyun, 2025',  views:'7.2K', tags:['Python','ML'],       title:"Python bilan Machine Learning: Birinchi modelingiz",        excerpt:"Sun'iy intellekt va ML haqida yangi boshlayotganlar uchun amaliy qo'llanma." },
  { id:6, icon:Map,      cat:'DevOps',   color:'#0284c7', bg:'#f0f9ff', border:'#bae6fd', time:'14 daqiqa', date:'1 Iyun, 2025',  views:'6.3K', tags:['Docker','K8s'],      title:'Docker va Kubernetes: Container deployment asoslari',       excerpt:"Containerization nima? Docker va Kubernetes yordamida ilovalarni deploy qilishni o'rganing." },
];

function BlogCard({ p, i }) {
  const Icon = p.icon;
  return (
    <motion.article initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:'-30px' }} transition={{ duration:0.5, delay:(i%3)*0.1 }}
      className="card" style={{ overflow:'hidden', cursor:'pointer', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', background:p.bg, border:`1.5px solid ${p.border}` }}>

      {/* Header */}
      <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', background:'#fff', borderBottom:`1.5px solid ${p.border}` }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:`radial-gradient(circle at 80% 20%, ${p.color}12, transparent)` }} />
        <div style={{ width:50, height:50, borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', background:p.bg, border:`1.5px solid ${p.border}`, zIndex:1 }}>
          <Icon size={22} style={{ color:p.color }} />
        </div>
        <div style={{ position:'absolute', top:10, left:12 }}>
          <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:p.bg, color:p.color, border:`1px solid ${p.border}`, fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{p.cat}</span>
        </div>
        <div style={{ position:'absolute', top:12, right:12, fontSize:11, color:'#94a3b8' }}>{p.views} views</div>
      </div>

      {/* Content */}
      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', flexGrow:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#94a3b8', marginBottom:9 }}>
          <Clock size={11}/>{p.time} · {p.date}
        </div>
        <h3 style={{ fontSize:14, fontWeight:800, color:'#0f172a', lineHeight:1.5, marginBottom:7,
          overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.title}</h3>
        <p style={{ fontSize:12, color:'#64748b', lineHeight:1.75, marginBottom:12, flexGrow:1,
          overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.excerpt}</p>

        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
          {p.tags.map(t => <span key={t} style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:'#fff', color:'#64748b', border:'1px solid #e2e8f0', fontFamily:'JetBrains Mono,monospace' }}>#{t}</span>)}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:p.color, cursor:'pointer' }}>
          O'qishni davom ettirish <ArrowRight size={13}/>
        </div>
      </div>
    </motion.article>
  );
}

export default function Blog() {
  return (
    <section id="blog" className="section-light" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:52 }}>
          <span className="pill" style={{ background:'#f0f9ff', borderColor:'#bae6fd', color:'#0284c7' }}>Knowledge Hub</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>Blog & <span className="accent">Maqolalar</span></h2>
          <p className="sub">Texnologiya, dasturlash va IT karera bo'yicha so'nggi maqolalar</p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="blog-grid">
          {POSTS.map((p,i) => <BlogCard key={p.id} p={p} i={i}/>)}
        </div>

        <div style={{ textAlign:'center', marginTop:36 }}>
          <button className="btn-outline" style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
            Barcha Maqolalar <ArrowRight size={15}/>
          </button>
        </div>
      </div>
      <style>{`@media(max-width:1024px){.blog-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.blog-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
