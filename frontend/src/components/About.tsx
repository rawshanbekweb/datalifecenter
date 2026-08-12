import React from 'react';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
import { resolveIcon } from '../utils/iconMap';
import AboutTeamCard from './home/AboutTeamCard';
import { useTeam } from '../hooks/useTeam';

interface RawStatItem {
  icon: string;
  value: string;
  label: string;
  color: string;
}

interface AboutSettings {
  stats?: RawStatItem[];
  features?: string[];
}

interface AboutProps {
  settings?: AboutSettings;
}

function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

// Fallback — API bo'sh/xato bo'lsa; label'lar t() kaliti sifatida saqlanadi.
//
// FAQAT TEKSHIRILGAN raqamlar: kompaniya bergan ma'lumot (2019-yildan beri,
// 3000+ bitiruvchi, 7 yo'nalish, 12 mutaxassis). Ilgari bu yerda o'ylab
// topilgan qiymatlar turardi ("2,000+" bitiruvchi, "180+" loyiha, "5+" yil)
// va ular jonli saytda haqiqiy statistika bo'lib ko'rinardi.
const DEFAULT_STATS: RawStatItem[] = [
  { icon: 'Users',          value: '3000+', label: 'home.about.fallback.graduates',   color: '#0ea5e9' },
  { icon: 'BookOpen',       value: '7',     label: 'home.about.fallback.directions',  color: '#9333ea' },
  { icon: 'GraduationCap',  value: '12',    label: 'home.about.fallback.specialists', color: '#16a34a' },
  { icon: 'Award',          value: '2019',  label: 'home.about.fallback.founded',     color: '#d97706' },
];

const DEFAULT_FEATURE_KEYS: string[] = [
  'home.about.fallback.feat1', 'home.about.fallback.feat2',
  'home.about.fallback.feat3', 'home.about.fallback.feat4',
];

export default function About({ settings }: AboutProps = {}): React.ReactElement {
  const { t } = useTranslation();
  const STATS = settings?.stats?.length
    ? settings.stats
    : DEFAULT_STATS.map((s) => ({ ...s, label: t(s.label) }));
  const FEATURES = settings?.features?.length ? settings.features : DEFAULT_FEATURE_KEYS.map((k) => t(k));

  // O'ng ustun — jamoaning yuzlari (AboutTeamCard izohiga qarang).
  // Bazada hali a'zo bo'lmasa yoki so'rov yiqilsa karta butunlay
  // ko'rsatilmaydi va chap ustun markazga chiqadi: yarim bo'sh grid buzuq
  // element taassurotini berardi.
  const team = useTeam();
  const showTeamCard = team.length > 0;
  return (
    <section id="about" className="section-gray" style={{ padding: '104px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <m.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:64 }}>
          <span className="pill">{t('home.about.pill')}</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>{t('home.about.titleStart')} <span className="accent">{t('home.about.titleAccent')}</span></h2>
          <p className="sub">{t('home.about.subtitle')}</p>
        </m.div>

        {/* Two columns */}
        <div style={{ display:'grid', gridTemplateColumns: showTeamCard ? '1fr 1fr' : '1fr', gap:56, alignItems:'center', marginBottom:64, maxWidth: showTeamCard ? undefined : 760, marginInline: showTeamCard ? undefined : 'auto' }} className="about-grid">

          {/* Left */}
          <m.div initial={{ opacity:0, x:-24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
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
          </m.div>

          {/* O'ng — jamoaning yuzlari. Bazada a'zo bo'lmasa ko'rsatilmaydi. */}
          {showTeamCard && (
            <m.div initial={{ opacity:0, x:24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
              <AboutTeamCard members={team} />
            </m.div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18 }} className="stats-grid">
          {STATS.map((s: RawStatItem, i: number) => {
            const Icon = resolveIcon(s.icon);
            return (
              <m.div key={s.label} initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ duration:0.55, delay:i*0.1 }}
                className="card" style={{ padding:'28px 20px', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ width:48, height:48, borderRadius:14, margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', background:withAlpha(s.color,'12'), border:`1.5px solid ${withAlpha(s.color,'30')}` }}>
                  <Icon size={22} style={{ color:s.color }} />
                </div>
                <div style={{ fontSize:36, fontWeight:900, color:'#0f172a', lineHeight:1 }}>{s.value}</div>
                <p style={{ color:'#64748b', fontWeight:600, marginTop:6, fontSize:14 }}>{s.label}</p>
              </m.div>
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
