import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, MessageCircle, Briefcase, Camera, Play, Send, ArrowRight } from 'lucide-react';

interface SocialItem {
  icon: React.ElementType;
  label: string;
}

const LINKS: Record<string, string[]> = {
  'Kurslar':   ['Frontend Dev','Backend Dev','Cyber Security','Mobile Dev','Data Science','Cloud & DevOps'],
  'Xizmatlar': ['Web Development','Mobile Apps','UI/UX Design','IT Consulting','Digital Solutions'],
  'Kompaniya': ['Biz Haqimizda','Blog','Loyihalar','Karera','Hamkorlik'],
};
const SOCIALS: SocialItem[] = [
  { icon:GitBranch,    label:'GitHub'     },
  { icon:MessageCircle,label:'Twitter/X'  },
  { icon:Briefcase,    label:'LinkedIn'   },
  { icon:Camera,       label:'Instagram'  },
  { icon:Play,         label:'YouTube'    },
  { icon:Send,         label:'Telegram'   },
];

export default function Footer(): React.ReactElement {
  return (
    <footer style={{ background:'#0f172a', paddingTop:72, paddingBottom:28, position:'relative' }}>
      {/* Top separator */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #0ea5e9, #9333ea, #0ea5e9)' }} />

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>

        {/* Newsletter */}
        <div style={{ borderRadius:20, padding:'32px 36px', marginBottom:56, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:20 }}>
          <div>
            <h3 style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:4 }}>IT yangiliklardan xabardor bo'ling</h3>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>Haftalik IT yangiliklar, kurs chegirmalari va maqolalar</p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <input type="email" placeholder="Email manzilingiz"
              style={{ width:230, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:50, padding:'11px 18px', fontSize:13, color:'#fff', outline:'none', fontFamily:'Outfit,sans-serif' }} />
            <button className="btn-primary" style={{ padding:'11px 22px', whiteSpace:'nowrap' }}>
              Subscribe <ArrowRight size={14}/>
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
              O'zbekistondagi eng zamonaviy IT ta'lim markazi. Dasturlash va raqamli mahsulotlar — bizning missiyamiz.
            </p>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {SOCIALS.map(({ icon:Icon, label }: SocialItem) => (
                <motion.a key={label} href="#" aria-label={label} title={label} whileHover={{ y:-3 }}
                  style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', cursor:'pointer', textDecoration:'none', color:'rgba(255,255,255,0.45)', transition:'all 0.2s' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>{e.currentTarget.style.background='#0ea5e9'; e.currentTarget.style.color='#fff';}}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>{e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.45)';}}>
                  <Icon size={13}/>
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(LINKS).map(([section, links]: [string, string[]]) => (
            <div key={section}>
              <h4 style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.08em' }}>{section}</h4>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:9 }}>
                {links.map((l: string) => (
                  <li key={l}>
                    <a href="#" style={{ fontSize:13, color:'rgba(255,255,255,0.4)', textDecoration:'none', transition:'color 0.2s' }}
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color='#fff')}
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color='rgba(255,255,255,0.4)')}>
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>© 2025 DATA LIFE IT Center. Barcha huquqlar himoyalangan.</p>
          <div style={{ display:'flex', gap:16 }}>
            {["Maxfiylik","Foydalanish Shartlari","Cookie"].map((item: string) => (
              <a key={item} href="#" style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textDecoration:'none', transition:'color 0.2s' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color='rgba(255,255,255,0.55)')}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color='rgba(255,255,255,0.25)')}>{item}</a>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse 2s infinite' }} />
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontFamily:'JetBrains Mono,monospace' }}>All systems operational</span>
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
