import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
import { resolveIcon } from '../utils/iconMap';

interface RawStatItem {
  icon: string;
  value: string;
  label: string;
  color: string;
}

interface SkillItem {
  label: string;
  pct: number;
}

interface SatisfactionItem {
  value: string;
  label: string;
}

interface AboutSettings {
  stats?: RawStatItem[];
  features?: string[];
  skills?: SkillItem[];
  satisfaction?: SatisfactionItem[];
}

interface AboutProps {
  settings?: AboutSettings;
}

function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

// Fallback — API bo'sh/xato bo'lsa; label'lar t() kaliti sifatida saqlanadi
const DEFAULT_STATS: RawStatItem[] = [
  { icon: 'Users',     value: '2,000+', label: 'home.about.fallback.graduates',  color: '#0ea5e9' },
  { icon: 'BookOpen',  value: '7+',     label: 'home.about.fallback.courses',    color: '#9333ea' },
  { icon: 'Briefcase', value: '180+',   label: 'home.about.fallback.projects',   color: '#16a34a' },
  { icon: 'Award',     value: '5+',     label: 'home.about.fallback.experience', color: '#d97706' },
];

const DEFAULT_FEATURE_KEYS: string[] = [
  'home.about.fallback.feat1', 'home.about.fallback.feat2',
  'home.about.fallback.feat3', 'home.about.fallback.feat4',
  'home.about.fallback.feat5', 'home.about.fallback.feat6',
];

const DEFAULT_SKILLS: SkillItem[] = [
  { label: 'Frontend Development', pct: 95 },
  { label: 'Backend Development',  pct: 88 },
  { label: 'Cyber Security',       pct: 82 },
  { label: 'Mobile Development',   pct: 78 },
];

const DEFAULT_SATISFACTION: SatisfactionItem[] = [
  { value: '98%', label: 'Satisfaction' },
  { value: '92%', label: 'Employment' },
];

export default function About({ settings }: AboutProps = {}): React.ReactElement {
  const { t } = useTranslation();
  const STATS = settings?.stats?.length
    ? settings.stats
    : DEFAULT_STATS.map((s) => ({ ...s, label: t(s.label) }));
  const FEATURES = settings?.features?.length ? settings.features : DEFAULT_FEATURE_KEYS.map((k) => t(k));
  const SKILLS = settings?.skills?.length ? settings.skills : DEFAULT_SKILLS;
  const SATISFACTION = settings?.satisfaction?.length ? settings.satisfaction : DEFAULT_SATISFACTION;
  return (
    <section id="about" className="section-gray" style={{ padding: '104px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:64 }}>
          <span className="pill">{t('home.about.pill')}</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>{t('home.about.titleStart')} <span className="accent">{t('home.about.titleAccent')}</span></h2>
          <p className="sub">{t('home.about.subtitle')}</p>
        </motion.div>

        {/* Two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center', marginBottom:64 }} className="about-grid">

          {/* Left */}
          <motion.div initial={{ opacity:0, x:-24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
            <div className="divider" />
            <h3 style={{ fontSize:28, fontWeight:800, color:'#0f172a', lineHeight:1.35, marginBottom:16 }}>
              {t('home.about.headingStart')} <span className="accent">{t('home.about.headingAccent')}</span>
            </h3>
            <p style={{ color:'#64748b', lineHeight:1.85, fontSize:15, marginBottom:14 }}>
              <strong style={{ color:'#0f172a' }}>DATA LIFE</strong> — {t('home.about.para1')}
            </p>
            <p style={{ color:'#64748b', lineHeight:1.85, fontSize:15, marginBottom:28 }}>
              {t('home.about.para2')}
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
                <img src="/assets/logotype.png" alt="DATA LIFE" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover' }} />
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
                {SATISFACTION.map((sf: SatisfactionItem) => (
                  <div key={sf.label} style={{ textAlign:'center', padding:'14px 0', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
                    <p style={{ fontSize:22, fontWeight:800, color:'#0ea5e9' }}>{sf.value}</p>
                    <p style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{sf.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18 }} className="stats-grid">
          {STATS.map((s: RawStatItem, i: number) => {
            const Icon = resolveIcon(s.icon);
            return (
              <motion.div key={s.label} initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ duration:0.55, delay:i*0.1 }}
                className="card" style={{ padding:'28px 20px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ width:48, height:48, borderRadius:14, margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', background:withAlpha(s.color,'12'), border:`1.5px solid ${withAlpha(s.color,'30')}` }}>
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
