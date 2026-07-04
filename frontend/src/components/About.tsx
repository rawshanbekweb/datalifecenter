import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, BookOpen, Briefcase, Award, CheckCircle } from 'lucide-react';

interface StatItem {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

interface SkillItem {
  label: string;
  pct: number;
}

const STATS: StatItem[] = [
  { icon: Users,     value: '2,000+', label: 'Bitiruvchilar',  color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  { icon: BookOpen,  value: '7+',     label: 'Kurslar',        color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  { icon: Briefcase, value: '180+',   label: 'Loyihalar',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { icon: Award,     value: '5+',     label: 'Yillik Tajriba', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
];

const FEATURES: string[] = [
  'Professional sertifikatlar',   'Real loyihalarda ishlash',
  'Tajribali mentorlar',          "Karera qo'llab-quvvatlash",
  "Zamonaviy o'quv dasturi",      'Kichik guruhlar (max 15)',
];

const SKILLS: SkillItem[] = [
  { label: 'Frontend Development', pct: 95 },
  { label: 'Backend Development',  pct: 88 },
  { label: 'Cyber Security',       pct: 82 },
  { label: 'Mobile Development',   pct: 78 },
];

export default function About(): React.ReactElement {
  const inView = useInView(useRef<HTMLElement>(null), { once: true });
  return (
    <section id="about" className="section-gray" style={{ padding: '104px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:64 }}>
          <span className="pill">About Us</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>Biz <span className="accent">Haqimizda</span></h2>
          <p className="sub">O'zbekistondagi eng innovatsion IT ta'lim markazi</p>
        </motion.div>

        {/* Two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center', marginBottom:64 }} className="about-grid">

          {/* Left */}
          <motion.div initial={{ opacity:0, x:-24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
            <div className="divider" />
            <h3 style={{ fontSize:28, fontWeight:800, color:'#0f172a', lineHeight:1.35, marginBottom:16 }}>
              Kelajak texnologiyalarini <span className="accent">bugun o'rganing</span>
            </h3>
            <p style={{ color:'#64748b', lineHeight:1.85, fontSize:15, marginBottom:14 }}>
              <strong style={{ color:'#0f172a' }}>DATA LIFE</strong> — dasturlash o'qitish, raqamli mahsulotlar yaratish va kelajak mutaxassislarini tayyorlashga ixtisoslashgan zamonaviy IT markazi.
            </p>
            <p style={{ color:'#64748b', lineHeight:1.85, fontSize:15, marginBottom:28 }}>
              Maqsadimiz — har bir o'quvchini IT sanoatining haqiqiy professional mutaxassisiga aylantirish.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 16px' }}>
              {FEATURES.map((f: string) => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#334155' }}>
                  <CheckCircle size={14} style={{ color:'#0ea5e9', flexShrink:0 }} />{f}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Skills card */}
          <motion.div initial={{ opacity:0, x:24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
            <div className="card" style={{ padding:28, boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:'#0ea5e9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontWeight:800, color:'#fff', fontSize:13 }}>DL</span>
                </div>
                <div>
                  <p style={{ fontWeight:700, color:'#0f172a' }}>DATA LIFE</p>
                  <p style={{ fontSize:11, color:'#0ea5e9', fontFamily:'JetBrains Mono,monospace' }}>IT Education Center</p>
                </div>
              </div>

              {SKILLS.map((s: SkillItem, i: number) => (
                <div key={s.label} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'#334155', fontWeight:500 }}>{s.label}</span>
                    <span style={{ fontSize:12, color:'#0ea5e9', fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{s.pct}%</span>
                  </div>
                  <div className="progress-track">
                    <motion.div className="progress-fill"
                      initial={{ width:0 }} whileInView={{ width:`${s.pct}%` }} viewport={{ once:true }}
                      transition={{ duration:1.1, delay:0.2 + i*0.12, ease:'easeOut' }} />
                  </div>
                </div>
              ))}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:20, paddingTop:20, borderTop:'1px solid #f1f5f9' }}>
                {([['98%','Satisfaction'],['92%','Employment']] as [string, string][]).map(([v,l]) => (
                  <div key={l} style={{ textAlign:'center', padding:'14px 0', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
                    <p style={{ fontSize:22, fontWeight:800, color:'#0ea5e9' }}>{v}</p>
                    <p style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18 }} className="stats-grid">
          {STATS.map((s: StatItem, i: number) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ duration:0.55, delay:i*0.1 }}
                className="card" style={{ padding:'28px 20px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ width:48, height:48, borderRadius:14, margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', background:s.bg, border:`1.5px solid ${s.border}` }}>
                  <Icon size={22} style={{ color:s.color }} />
                </div>
                <div style={{ fontSize:36, fontWeight:900, color:'#0f172a', lineHeight:1 }}>{s.value}</div>
                <p style={{ color:'#64748b', fontWeight:600, marginTop:6, fontSize:14 }}>{s.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media(max-width:900px){.about-grid{grid-template-columns:1fr!important} .stats-grid{grid-template-columns:1fr 1fr!important}}
      `}</style>
    </section>
  );
}
