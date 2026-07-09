import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Cpu, Globe, CheckCircle } from 'lucide-react';

interface TerminalLine {
  t: string;
  c: string;
}

interface BadgeItem {
  icon: React.ElementType;
  label: string;
  value: string;
  bg: string;
  border: string;
  ic: string;
}

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface StatItem {
  label: string;
  value: string;
}

interface HeroProps {
  settings?: { stats?: StatItem[] };
}

const DEFAULT_STATS: StatItem[] = [
  { value: '2,000+', label: 'Bitiruvchilar' },
  { value: '7+', label: 'Kurslar' },
  { value: '5+', label: 'Yillik Tajriba' },
  { value: '09:00–19:00', label: 'Ish Vaqti' },
];

/* Animated particle canvas — light version */
function ParticleCanvas(): React.ReactElement {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const nodes: ParticleNode[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      nodes.forEach((n: ParticleNode) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > c.width)  n.vx *= -1;
        if (n.y < 0 || n.y > c.height) n.vy *= -1;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14,165,233,0.35)'; ctx.fill();
      });
      nodes.forEach((a: ParticleNode, i: number) => nodes.slice(i + 1).forEach((b: ParticleNode) => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(14,165,233,${(1 - d / 120) * 0.15})`;
          ctx.lineWidth = 0.8; ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

/* Terminal widget — white version */
const LINES: TerminalLine[] = [
  { t: '> Initializing DATA LIFE...',       c: '#94a3b8' },
  { t: '> Loading modules... ████ 100%',    c: '#0ea5e9' },
  { t: '> Frontend: React & TS   ✓',        c: '#16a34a' },
  { t: '> Backend:  Node.js & DB  ✓',       c: '#16a34a' },
  { t: '> Security: Activated     ✓',       c: '#16a34a' },
  { t: '> Welcome to DATA LIFE!',           c: '#0f172a' },
];
function Terminal(): React.ReactElement {
  const [shown, setShown] = useState<TerminalLine[]>([]);
  const [idx, setIdx] = useState<number>(0);
  useEffect(() => {
    if (idx >= LINES.length) return;
    const t = setTimeout(() => { setShown((p: TerminalLine[]) => [...p, LINES[idx]]); setIdx((i: number) => i + 1); }, 420 + idx * 200);
    return () => clearTimeout(t);
  }, [idx]);
  return (
    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '18px 20px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        {(['#f87171','#fbbf24','#34d399'] as string[]).map((c: string) => <span key={c} style={{ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block' }} />)}
        <span style={{ marginLeft: 10, fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono,monospace' }}>datalife — terminal</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {shown.map((l: TerminalLine, i: number) => (
          <motion.p key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
            style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: l.c, lineHeight: 1.6 }}>{l.t}</motion.p>
        ))}
        {idx < LINES.length && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#0ea5e9', animation: 'blink 1s infinite' }}>█</span>}
      </div>
    </div>
  );
}

const BADGES: BadgeItem[] = [
  { icon: Code2,    label: 'Frontend',   value: 'React & TypeScript', bg: '#f0f9ff', border: '#bae6fd', ic: '#0ea5e9' },
  { icon: Cpu,      label: 'Backend',    value: 'Node.js & APIs',     bg: '#faf5ff', border: '#e9d5ff', ic: '#9333ea' },
  { icon: Globe,    label: 'Deployment', value: 'Cloud & DevOps',     bg: '#f0fdf4', border: '#bbf7d0', ic: '#16a34a' },
];

export default function Hero({ settings }: HeroProps = {}): React.ReactElement {
  const stats = settings?.stats?.length ? settings.stats : DEFAULT_STATS;
  return (
    <section id="home" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #faf5ff 100%)' }}>
      {/* Subtle BG circles */}
      <div style={{ position: 'absolute', top: -180, right: -180, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.07), transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(147,51,234,0.05), transparent)', pointerEvents: 'none' }} />

      {/* Light particle canvas */}
      <ParticleCanvas />

      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '120px 24px 80px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }} className="hero-grid">

          {/* LEFT */}
          <div>
            <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
              <span className="pill">
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#0ea5e9', display:'inline-block', animation:'blink 1.5s infinite' }} />
                Next-Gen IT Education Center
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12, duration:0.6 }}
              style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, lineHeight:1.05, letterSpacing:'-0.03em', marginBottom:12,
                fontSize:'clamp(44px,7vw,76px)', color:'#0f172a' }}>
              DATA <br /><span style={{ color:'#0ea5e9' }}>LIFE</span>
            </motion.h1>

            <motion.p initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}
              style={{ fontSize:'clamp(16px,2vw,22px)', fontWeight:600, color:'#334155', marginBottom:10 }}>
              IT kelajagini bugundan yarating
            </motion.p>

            <motion.p initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
              style={{ color:'#64748b', fontSize:15, lineHeight:1.85, marginBottom:36, maxWidth:460 }}>
              Zamonaviy dasturlash, sun'iy intellekt va raqamli texnologiyalar bo'yicha professional ta'lim oling.
              Real loyihalar va tajribali mentorlar bilan karera quring.
            </motion.p>

            <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.38 }}
              style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:44 }}>
              <a href="#contact"><button className="btn-primary">Start Learning <ArrowRight size={15} /></button></a>
              <a href="#contact"><button className="btn-outline">Contact Us</button></a>
            </motion.div>

            {/* Trust badges */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.52 }}
              style={{ display:'flex', gap:28, paddingTop:28, borderTop:'1px solid #f1f5f9', flexWrap:'wrap' }}>
              {stats.map((s: StatItem) => (
                <div key={s.label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>{s.value}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT */}
          <motion.div initial={{ opacity:0, x:36 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.28, duration:0.7 }}
            style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Terminal />
            {BADGES.map((b: BadgeItem) => {
              const Icon = b.icon;
              return (
                <motion.div key={b.label} whileHover={{ x:4, scale:1.02 }}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderRadius:14, background:b.bg, border:`1.5px solid ${b.border}`, cursor:'default' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                    <Icon size={18} style={{ color: b.ic }} />
                  </div>
                  <div>
                    <p style={{ fontSize:11, color:'#94a3b8', marginBottom:1 }}>{b.label}</p>
                    <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{b.value}</p>
                  </div>
                  <CheckCircle size={16} style={{ color:'#16a34a', marginLeft:'auto' }} />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @media(max-width:768px){.hero-grid{grid-template-columns:1fr!important;gap:40px!important}}
      `}</style>
    </section>
  );
}
