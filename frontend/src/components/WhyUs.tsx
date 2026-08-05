import React from 'react';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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

// Zaxira ro'yxat — faqat API xatosida ko'rinadi, shuning uchun o'zbekcha qoladi.
//
// FAQAT TEKSHIRILGAN RAQAMLAR: markaz egasi bergan ma'lumot (9 mentor,
// 3000+ bitiruvchi, 7 yo'nalish, 2019-yil, 11 kishilik jamoa). Ilgari bu
// yerda o'ylab topilgan qiymatlar turardi — "40+" mentor, "92%" ishga
// joylashish, "180+" loyiha, "2,500+" hamjamiyat — va ular jonli saytda
// haqiqiy statistika bo'lib ko'rinardi.
//
// "Karera qo'llab-quvvatlash" kartasi ATAYIN YO'Q: markaz bunday xizmatni
// alohida taklif qilmaydi (egasining 2026-08-05 dagi ko'rsatmasi).
const DEFAULT_FEATS: FeatureItem[] = [
  { icon:'GraduationCap', title:"Tajribali mentorlar", color:'#0ea5e9', stat:'9',     desc:"Har bir yo'nalishni o'z sohasida ishlaydigan mentor olib boradi." },
  { icon:'Trophy',        title:"Bitiruvchilar",       color:'#db2777', stat:'3000+', desc:"Markazni tugatgan o'quvchilar soni." },
  { icon:'BookOpen',      title:"Yo'nalishlar",        color:'#9333ea', stat:'7',     desc:"Kompyuter savodxonligidan Prompt Engineering va kiberxavfsizlikkacha." },
  { icon:'Award',         title:"Shu yildan beri",     color:'#16a34a', stat:'2019',  desc:"DATA LIFE 2019-yildan beri uzluksiz ishlaydi." },
  { icon:'Users',         title:"Jamoa",               color:'#0284c7', stat:'11',    desc:"Mentorlar, rahbariyat va marketing mutaxassislari." },
];

export default function WhyUs({ settings }: WhyUsProps = {}): React.ReactElement {
  const { t } = useTranslation();
  // DEFAULT_FEATS — faqat API xatosida ko'rinadigan zaxira kontent, o'zbekcha qoladi
  const FEATS = settings?.items?.length ? settings.items : DEFAULT_FEATS;
  return (
    <section id="why-us" className="section-gray" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <m.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:56 }}>
          <span className="pill" style={{ background:'#fffbeb', borderColor:'#fde68a', color:'#d97706' }}>{t('home.whyUs.pill')}</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>
            {t('home.whyUs.titleStart')} <span className="accent">DATA LIFE?</span>
          </h2>
          <p className="sub">{t('home.whyUs.subtitle')}</p>
        </m.div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="why-grid">
          {FEATS.map((f: FeatureItem, i: number) => {
            const Icon = resolveIcon(f.icon);
            return (
              <m.div key={f.title} initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }}
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
              </m.div>
            );
          })}
        </div>

        {/* CTA */}
        <m.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.3 }}>
          <div style={{ marginTop:56, borderRadius:24, padding:'52px 40px', textAlign:'center',
            background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', position:'relative', overflow:'hidden' }}>
            {/* Subtle top accent */}
            <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:80, height:2, background:'#0ea5e9', borderRadius:2 }} />
            <h3 style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:10 }}>{t('home.whyUs.ctaTitle')}</h3>
            <p style={{ color:'rgba(255,255,255,0.6)', marginBottom:28, fontSize:15 }}>{t('home.whyUs.ctaSubtitle')}</p>
            <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
              <a href="#contact"><button className="btn-primary">{t('home.whyUs.ctaButton')}</button></a>
              <a href="#courses" style={{ textDecoration:'none' }}>
                <button style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', borderRadius:50, background:'rgba(255,255,255,0.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.2)', fontWeight:700, fontSize:15, cursor:'pointer', transition:'all 0.25s', fontFamily:'var(--font-sans)' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>{e.currentTarget.style.background='rgba(255,255,255,0.18)'}}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>{e.currentTarget.style.background='rgba(255,255,255,0.1)'}}>
                  {t('home.whyUs.ctaCourses')}
                </button>
              </a>
            </div>
          </div>
        </m.div>
      </div>
      <style>{`@media(max-width:1024px){.why-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.why-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
