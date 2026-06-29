import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Server, Shield, Smartphone, Database, Cloud, Clock, ArrowRight, Star } from 'lucide-react';

const COURSES = [
  { id:'fe', icon:Monitor,   title:'Frontend Development', sub:'React & TypeScript',  color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd', dur:'6 oy', rating:4.9, students:840, tags:['HTML','CSS','JavaScript','React','TypeScript'], desc:"Zamonaviy veb ilovalar yaratishni o'rganing. React va TypeScript bilan professional developer bo'ling.", mods:['HTML & CSS','JavaScript ES6+','React & Redux','TypeScript','Tailwind CSS'] },
  { id:'be', icon:Server,    title:'Backend Development',  sub:'Node.js & APIs',      color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff', dur:'7 oy', rating:4.8, students:620, tags:['Node.js','PostgreSQL','MongoDB','REST API','Docker'], desc:"Server-side dasturlash, ma'lumotlar bazasi va API yaratishni o'rganing.", mods:['Node.js & Express','Database Design','GraphQL','Docker','Cloud Deploy'] },
  { id:'cs', icon:Shield,    title:'Cyber Security',       sub:'Axborot xavfsizligi', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', dur:'5 oy', rating:4.7, students:480, tags:['Linux','Networking','Ethical Hacking','CTF','Forensics'], desc:"Kiberxavfsizlik mutaxassisi bo'ling. Etik hacking va zamonaviy himoya texnikalarini o'rganing.", mods:['Linux','Networking','Ethical Hacking','CTF','Audit'] },
  { id:'mo', icon:Smartphone,title:'Mobile Development',   sub:'Flutter & React Native',color:'#d97706', bg:'#fffbeb', border:'#fde68a', dur:'6 oy', rating:4.8, students:390, tags:['Flutter','Dart','Firebase','React Native'],              desc:"Flutter yordamida iOS va Android ilovalar yaratishni o'rganing.", mods:['Flutter','Dart','State Mgmt','Firebase','App Store'] },
  { id:'ai', icon:Database,  title:'Data Science & AI',    sub:"Sun'iy intellekt",    color:'#db2777', bg:'#fdf2f8', border:'#fbcfe8', dur:'8 oy', rating:4.9, students:310, tags:['Python','TensorFlow','PyTorch','SQL','Pandas'],          desc:"Ma'lumotlar tahlili va sun'iy intellekt modellarini yaratishni o'rganing.", mods:['Python','ML Basics','Deep Learning','NLP','MLOps'] },
  { id:'cl', icon:Cloud,     title:'Cloud & DevOps',       sub:'Bulut texnologiyalari',color:'#0284c7', bg:'#f0f9ff', border:'#bae6fd', dur:'5 oy', rating:4.7, students:280, tags:['AWS','Kubernetes','Docker','CI/CD','Terraform'],        desc:"Bulut infratuzilmasini boshqarishni va DevOps amaliyotlarini o'rganing.", mods:['AWS/Azure','Docker & K8s','CI/CD','IaC','Monitoring'] },
];

function CourseCard({ c, i }) {
  const [open, setOpen] = useState(false);
  const Icon = c.icon;
  return (
    <motion.div initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-30px' }}
      transition={{ duration:0.5, delay:(i%3)*0.1 }} className="card"
      style={{ padding:24, display:'flex', flexDirection:'column', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', background:c.bg, border:`1.5px solid ${c.border}` }}>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ width:48, height:48, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', border:`1.5px solid ${c.border}`, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <Icon size={22} style={{ color:c.color }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'#fff', padding:'4px 10px', borderRadius:20, border:'1px solid #e2e8f0' }}>
          <Star size={11} fill={c.color} style={{ color:c.color }} />
          <span style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{c.rating}</span>
        </div>
      </div>

      <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a', marginBottom:3 }}>{c.title}</h3>
      <p style={{ fontSize:12, color:c.color, fontWeight:700, marginBottom:10 }}>{c.sub}</p>
      <p style={{ fontSize:13, color:'#64748b', lineHeight:1.75, marginBottom:14, flexGrow:1 }}>{c.desc}</p>

      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
        {c.tags.map(t => <span key={t} className="tag" style={{ background:'#fff', borderColor:c.border, color:c.color }}>{t}</span>)}
      </div>

      {open && (
        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
          style={{ background:'#fff', border:`1px solid ${c.border}`, borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
          <p style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Modullar</p>
          {c.mods.map((m,mi) => (
            <p key={m} style={{ fontSize:12, color:'#334155', marginBottom:4 }}>
              <span style={{ color:c.color, fontFamily:'JetBrains Mono,monospace', fontSize:11, marginRight:6 }}>0{mi+1}</span>{m}
            </p>
          ))}
        </motion.div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:`1px solid ${c.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#94a3b8' }}>
          <Clock size={13} />{c.dur}
          <span style={{ marginLeft:8 }}>{c.students} ta</span>
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <button onClick={() => setOpen(!open)} style={{ fontSize:11, padding:'5px 12px', borderRadius:20, cursor:'pointer', background:'#fff', color:c.color, border:`1px solid ${c.border}`, fontWeight:600, transition:'all 0.2s' }}>
            {open ? 'Yopish' : "Ko'proq"}
          </button>
          <button style={{ fontSize:11, padding:'5px 14px', borderRadius:20, cursor:'pointer', background:c.color, color:'#fff', border:'none', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
            Ro'yxat <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Courses() {
  return (
    <section id="courses" className="section-light" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:52 }}>
          <span className="pill">Our Programs</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>Kurs<span className="accent">larimiz</span></h2>
          <p className="sub">Har bir sohada professional bo'lish uchun to'liq dasturlar</p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="courses-grid">
          {COURSES.map((c, i) => <CourseCard key={c.id} c={c} i={i} />)}
        </div>

        <div style={{ textAlign:'center', marginTop:36 }}>
          <button className="btn-dark" style={{ display:'inline-flex', alignItems:'center', gap:8 }}>Barcha Kurslar <ArrowRight size={15}/></button>
        </div>
      </div>
      <style>{`@media(max-width:1024px){.courses-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.courses-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
