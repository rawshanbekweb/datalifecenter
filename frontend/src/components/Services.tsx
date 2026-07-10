import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { resolveIcon } from '../utils/iconMap';

interface ServiceItem {
  icon: string;
  title: string;
  color: string;
  desc: string;
  feats: string[];
}

interface ServicesProps {
  settings?: { items?: ServiceItem[] };
}

const DEFAULT_SVCS: ServiceItem[] = [
  { icon:'Globe',      title:'Web Development',    color:'#0ea5e9', desc:'Zamonaviy veb ilovalar. React, Next.js, Node.js bilan enterprise yechimlar.',          feats:['SPA & SSR ilovalar','API integratsiya','SEO optimizatsiya','Performance'] },
  { icon:'Smartphone', title:'Mobile Applications', color:'#9333ea', desc:'iOS va Android uchun professional ilovalar. Flutter va React Native bilan.',          feats:['Flutter & React Native','Native iOS/Android','App Store deploy','Push notifications'] },
  { icon:'Palette',    title:'UI/UX Design',        color:'#db2777', desc:"Foydalanuvchilar uchun qulay dizayn. Figma bilan prototipdan mahsulotgacha.",          feats:['User Research','Wireframing','Design Systems','Usability Testing'] },
  { icon:'Brain',      title:'IT Consulting',       color:'#d97706', desc:"Biznesingiz uchun texnologik strategiya. Expert maslahat xizmatlar.",                   feats:['Tech Strategy','Digital Transform','System Architecture','Code Audit'] },
  { icon:'Cpu',        title:'Digital Solutions',   color:'#16a34a', desc:"Biznes jarayonlarini avtomatlashtirish. ERP, CRM va maxsus yechimlar.",                feats:['Business Automation','Custom Software','CRM & ERP','Data Analytics'] },
  { icon:'BarChart3',  title:'Data Analytics',      color:'#0284c7', desc:"Ma'lumotlardan qimmatli bilimlar olish. Dashboard va hisobot tizimlar.",               feats:['BI Dashboards','Real-time Analytics','Predictive Models','Reports'] },
];

export default function Services({ settings }: ServicesProps = {}): React.ReactElement {
  const { t } = useTranslation();
  // DEFAULT_SVCS — faqat API xatosida ko'rinadigan zaxira kontent, o'zbekcha qoladi
  const SVCS = settings?.items?.length ? settings.items : DEFAULT_SVCS;
  return (
    <section id="services" className="section-gray" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:52 }}>
          <span className="pill" style={{ background:'#fdf2f8', borderColor:'#fbcfe8', color:'#db2777' }}>{t('home.services.pill')}</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>{t('home.services.titleStart')}<span className="accent">{t('home.services.titleAccent')}</span></h2>
          <p className="sub">{t('home.services.subtitle')}</p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="svc-grid">
          {SVCS.map((s: ServiceItem, i: number) => {
            const Icon = resolveIcon(s.icon);
            return (
              <motion.div key={s.title} initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true, margin:'-30px' }} transition={{ duration:0.5, delay:(i%3)*0.1 }}
                className="card" style={{ padding:'28px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', cursor:'pointer', position:'relative', overflow:'hidden' }}>

                {/* Top color line */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.color, borderRadius:'20px 20px 0 0' }} />

                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                  <div className="icon-box" style={{ background:`${s.color}10`, borderColor:`${s.color}30` }}>
                    <Icon size={22} style={{ color:s.color }} />
                  </div>
                  <h3 style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>{s.title}</h3>
                </div>

                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.75, marginBottom:18 }}>{s.desc}</p>

                <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                  {s.feats.map((f: string) => (
                    <li key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#475569' }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:s.color, flexShrink:0, display:'inline-block' }} />{f}
                    </li>
                  ))}
                </ul>

                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:s.color, cursor:'pointer' }}>
                  {t('common.more')} <ArrowRight size={14} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <style>{`@media(max-width:1024px){.svc-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.svc-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
