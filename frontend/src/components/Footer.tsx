import React from 'react';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GitBranch, MessageCircle, Briefcase, Camera, Play, Send, ArrowRight } from 'lucide-react';

interface SocialItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface FooterLink {
  labelKey: string;
  href: string;
}

// Bo'lim kaliti (neytral, tilga bog'liq emas) — sarlavha t('footer.sections.<key>') orqali olinadi
const LINKS: Record<string, FooterLink[]> = {
  courses: [
    { labelKey: 'links.allCourses', href: '/courses' },
    { labelKey: 'links.whyUs', href: '/#why-us' },
  ],
  services: [
    { labelKey: 'links.webDev', href: '/#services' },
    { labelKey: 'links.mobileApps', href: '/#services' },
    { labelKey: 'links.uiuxDesign', href: '/#services' },
    { labelKey: 'links.itConsulting', href: '/#services' },
    { labelKey: 'links.digitalSolutions', href: '/#services' },
  ],
  company: [
    { labelKey: 'links.aboutUs', href: '/about' },
    { labelKey: 'links.blog', href: '/blog' },
    { labelKey: 'links.projects', href: '/#projects' },
    { labelKey: 'links.partnership', href: '/partners' },
  ],
};
// href bo'sh qoldirilgan ikonkalar butunlay ko'rsatilmaydi — haqiqiy sahifa
// mavjud bo'lganda shu yerga havolani yozish kifoya, boshqa kod o'zgarishi shart emas
const SOCIALS: SocialItem[] = [
  { icon:GitBranch,    label:'GitHub',    href:'' },
  { icon:MessageCircle,label:'Twitter/X', href:'' },
  { icon:Briefcase,    label:'LinkedIn',  href:'' },
  { icon:Camera,       label:'Instagram', href:'' },
  { icon:Play,         label:'YouTube',   href:'' },
  { icon:Send,         label:'Telegram',  href:'' },
].filter((s) => s.href);

export default function Footer(): React.ReactElement {
  const { t } = useTranslation();
  const legalItems: Array<{ key: string; label: string }> = [
    { key: 'privacy', label: t('footer.legal.privacy') },
    { key: 'terms', label: t('footer.legal.terms') },
    { key: 'cookie', label: t('footer.legal.cookie') },
  ];

  return (
    <footer style={{ background:'#0f172a', paddingTop:72, paddingBottom:28, position:'relative' }}>
      {/* Top separator */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #0ea5e9, #9333ea, #0ea5e9)' }} />

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>

        {/* Newsletter */}
        <div style={{ borderRadius:20, padding:'32px 36px', marginBottom:56, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:20 }}>
          <div>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:4 }}>{t('footer.newsletter.title')}</h3>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>{t('footer.newsletter.subtitle')}</p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <input type="email" placeholder={t('footer.newsletter.placeholder')}
              style={{ width:230, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:50, padding:'11px 18px', fontSize:13, color:'#fff', outline:'none', fontFamily:'Outfit,sans-serif' }} />
            <button className="btn-primary" style={{ padding:'11px 22px', whiteSpace:'nowrap' }}>
              {t('footer.newsletter.button')} <ArrowRight size={14}/>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:40, marginBottom:48 }} className="footer-grid">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <img src="/assets/favicon.jpg" alt="DATA LIFE" style={{ width:34, height:34, borderRadius:9, objectFit:'cover' }} />
              <span style={{ fontWeight:800, fontSize:17, color:'#fff' }}>DATA <span style={{ color:'#38bdf8' }}>LIFE</span></span>
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.8, maxWidth:230, marginBottom:20 }}>
              {t('footer.description')}
            </p>
            {SOCIALS.length > 0 && (
              <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                {SOCIALS.map(({ icon:Icon, label, href }: SocialItem) => (
                  <m.a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} whileHover={{ y:-3 }}
                    style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer', textDecoration:'none', color:'rgba(255,255,255,0.45)', transition:'all 0.2s' }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>{e.currentTarget.style.background='#0ea5e9'; e.currentTarget.style.color='#fff';}}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>{e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.45)';}}>
                    <Icon size={13}/>
                  </m.a>
                ))}
              </div>
            )}
          </div>

          {Object.entries(LINKS).map(([section, links]: [string, FooterLink[]]) => (
            <div key={section}>
              <h4 style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.08em' }}>{t(`footer.sections.${section}`)}</h4>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:9 }}>
                {links.map((l: FooterLink) => (
                  <li key={l.labelKey}>
                    <a href={l.href} style={{ fontSize:13, color:'rgba(255,255,255,0.4)', textDecoration:'none', transition:'color 0.2s' }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color='#fff')}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color='rgba(255,255,255,0.4)')}>
                      {t(`footer.${l.labelKey}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div style={{ display:'flex', gap:16 }}>
            {legalItems.map((item) => (
              <a key={item.key} href="#" style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textDecoration:'none', transition:'color 0.2s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color='rgba(255,255,255,0.55)')}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color='rgba(255,255,255,0.25)')}>{item.label}</a>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse 2s infinite' }} />
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontFamily:'JetBrains Mono,monospace' }}>{t('footer.systemsOperational')}</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @media(max-width:900px){.footer-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:540px){.footer-grid{grid-template-columns:1fr!important}}
      `}</style>
    </footer>
  );
}
