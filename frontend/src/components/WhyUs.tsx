import React from 'react';
import { motion } from 'framer-motion';
import { resolveIcon } from '../utils/iconMap';

interface FeatureItem {
  icon: string;
  title: string;
  color: string;
  stat: string;
  desc: string;
}

interface WhyUsProps {
  settings?: { items?: FeatureItem[] };
}

const DEFAULT_FEATS: FeatureItem[] = [
  { icon:'GraduationCap', title:"Tajribali Mentorlar",     color:'#0ea5e9', stat:'40+',    desc:"IT sanoatida 5+ yil tajribaga ega mutaxassislar tomonidan o'qiting." },
  { icon:'Zap',           title:"Amaliy Ta'lim",           color:'#9333ea', stat:'70%',    desc:"Nazariyadan ko'ra amaliyot ustuvor. Real loyihalar va hackathon-lar." },
  { icon:'Briefcase',     title:"Real Loyihalar",          color:'#16a34a', stat:'180+',   desc:"Ta'lim jarayonida haqiqiy mijozlar uchun loyihalarda ishlaysiz." },
  { icon:'HeartHandshake',title:"Karera Qo'llab-quvvat",  color:'#d97706', stat:'92%',    desc:"Resume, intervyu tayyorlash va ish topishda to'liq yordam." },
  { icon:'Trophy',        title:"Sertifikatlar",           color:'#db2777', stat:'3,000+', desc:"Sanoat tomonidan tan olingan. LinkedIn va xalqaro platformalarda tasdiqlangan." },
  { icon:'Users',         title:"Kuchli Hamjamiyat",       color:'#0284c7', stat:'2,500+', desc:"DATA LIFE bitiruvchilari tarmog'i. Networking va karera imkoniyatlari." },
];

export default function WhyUs({ settings }: WhyUsProps = {}): React.ReactElement {
  const FEATS = settings?.items?.length ? settings.items : DEFAULT_FEATS;
  return (
    <section id="why-us" className="section-gray" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:56 }}>
          <span className="pill" style={{ background:'#fffbeb', borderColor:'#fde68a', color:'#d97706' }}>Why Choose Us</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>
            Nima Uchun <span className="accent">DATA LIFE?</span>
          </h2>
          <p className="sub">Sanoatning eng yaxshi standartlari bilan shaxsiy yondashuvni birlashtiramiz</p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="why-grid">
          {FEATS.map((f: FeatureItem, i: number) => {
            const Icon = resolveIcon(f.icon);
            return (
              <motion.div key={f.title} initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true, margin:'-30px' }} transition={{ duration:0.5, delay:(i%3)*0.1 }}
                className="card" style={{ padding:'28px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', position:'relative', overflow:'hidden' }}>

                {/* Left accent bar */}
                <div style={{ position:'absolute', top:0, left:0, bottom:0, width:3, background:f.color, borderRadius:'20px 0 0 20px' }} />

                <div style={{ paddingLeft:8 }}>
                  <div style={{ width:46, height:46, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14,
                    background:`${f.color}12`, border:`1.5px solid ${f.color}30` }}>
                    <Icon size={21} style={{ color:f.color }} />
                  </div>
                  <div style={{ fontSize:30, fontWeight:900, color:'#0f172a', lineHeight:1 }}>{f.stat}</div>
                  <h3 style={{ fontSize:15, fontWeight:800, color:'#0f172a', margin:'8px 0 8px' }}>{f.title}</h3>
                  <p style={{ fontSize:13, color:'#64748b', lineHeight:1.75 }}>{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.3 }}>
          <div style={{ marginTop:56, borderRadius:24, padding:'52px 40px', textAlign:'center',
            background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', position:'relative', overflow:'hidden' }}>
            {/* Subtle top accent */}
            <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:80, height:2, background:'#0ea5e9', borderRadius:2 }} />
            <h3 style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:10 }}>Bugun boshlamoqchimisiz?</h3>
            <p style={{ color:'rgba(255,255,255,0.6)', marginBottom:28, fontSize:15 }}>Bepul konsultatsiya oling va to'g'ri kursni tanla.</p>
            <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
              <a href="#contact"><button className="btn-primary">Bepul Konsultatsiya</button></a>
              <a href="#courses" style={{ textDecoration:'none' }}>
                <button style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:50, background:'rgba(255,255,255,0.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.2)', fontWeight:700, fontSize:15, cursor:'pointer', transition:'all 0.25s', fontFamily:'Outfit,sans-serif' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>{e.currentTarget.style.background='rgba(255,255,255,0.18)'}}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>{e.currentTarget.style.background='rgba(255,255,255,0.1)'}}>
                  Kurslarni Ko'rish
                </button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
      <style>{`@media(max-width:1024px){.why-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.why-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
