import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NAV = [
  { label: 'Home',     href: '#home' },
  { label: 'About',    href: '#about' },
  { label: 'Courses',  href: '#courses' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Blog',     href: '#blog' },
  { label: 'Contact',  href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [open, setOpen]           = useState(false);
  const [active, setActive]       = useState('home');

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 50);
      for (let i = NAV.length - 1; i >= 0; i--) {
        const el = document.getElementById(NAV[i].href.slice(1));
        if (el && window.scrollY >= el.offsetTop - 130) { setActive(NAV[i].href.slice(1)); break; }
      }
    };
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: scrolled ? '12px 0' : '20px 0',
          background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid #e2e8f0' : 'none',
          transition: 'all 0.3s',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 800, color: '#fff', fontSize: 13 }}>DL</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 19, color: '#0f172a', letterSpacing: 0.5, fontFamily: 'Outfit,sans-serif' }}>
              DATA <span style={{ color: '#0ea5e9' }}>LIFE</span>
            </span>
          </a>

          {/* Desktop nav */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="nav-desktop">
            {NAV.map(n => (
              <a key={n.label} href={n.href} style={{
                textDecoration: 'none', fontSize: 14, fontWeight: 600,
                color: active === n.href.slice(1) ? '#0ea5e9' : '#475569',
                transition: 'color 0.2s', borderBottom: active === n.href.slice(1) ? '2px solid #0ea5e9' : '2px solid transparent',
                paddingBottom: 2,
              }}
              onMouseEnter={e => e.target.style.color = '#0ea5e9'}
              onMouseLeave={e => e.target.style.color = active === n.href.slice(1) ? '#0ea5e9' : '#475569'}>
                {n.label}
              </a>
            ))}
          </div>

          <div className="nav-desktop">
            <a href="#contact"><button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }}>Get Started</button></a>
          </div>

          {/* Burger */}
          <button onClick={() => setOpen(!open)} className="nav-mobile"
            style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#0f172a' }}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ position: 'fixed', top: 70, left: 12, right: 12, zIndex: 99, background: '#fff', borderRadius: 20, padding: '16px 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }}>
            {NAV.map((n, i) => (
              <motion.a key={n.label} href={n.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setOpen(false)}
                style={{ display: 'block', padding: '12px 4px', textDecoration: 'none', fontWeight: 600, fontSize: 15, color: '#0f172a', borderBottom: i < NAV.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                {n.label}
              </motion.a>
            ))}
            <button className="btn-primary" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
              onClick={() => setOpen(false)}>Get Started</button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media(max-width:768px){ .nav-desktop{display:none!important} .nav-mobile{display:flex!important} }
        @media(min-width:769px){ .nav-mobile{display:none!important} }
      `}</style>
    </>
  );
}
