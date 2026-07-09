import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, LayoutDashboard, LogOut, ShieldCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { roleHome } from '../utils/roleHome';
import NotificationBell from './common/NotificationBell';
import LanguageSwitcher from './common/LanguageSwitcher';
import React from 'react';

interface NavItem {
  labelKey: string;
  to: string;
  end?: boolean;
}

const NAV: NavItem[] = [
  { labelKey: 'nav.home', to: '/', end: true },
  { labelKey: 'nav.about', to: '/about' },
  { labelKey: 'nav.courses', to: '/courses' },
  { labelKey: 'nav.mentors', to: '/mentors' },
  { labelKey: 'nav.partners', to: '/partners' },
  { labelKey: 'nav.blog', to: '/blog' },
  { labelKey: 'nav.contact', to: '/contact' },
];

const MotionNavLink = motion.create(NavLink);
const MotionLink = motion.create(Link);

export default function Navbar(): React.ReactElement {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [open, setOpen]         = useState<boolean>(false);
  const { user, logout }        = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    fn();
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    textDecoration: 'none', fontSize: 14, fontWeight: 600,
    color: isActive ? '#0ea5e9' : '#475569',
    transition: 'color 0.2s', borderBottom: isActive ? '2px solid #0ea5e9' : '2px solid transparent',
    paddingBottom: 2,
  });

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
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/assets/favicon.jpg" alt="DATA LIFE" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }} />
            <span style={{ fontWeight: 800, fontSize: 19, color: '#0f172a', letterSpacing: 0.5, fontFamily: 'Outfit,sans-serif' }}>
              DATA <span style={{ color: '#0ea5e9' }}>LIFE</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="nav-desktop">
            {NAV.map((n: NavItem) => (
              <NavLink key={n.labelKey} to={n.to} end={n.end} style={linkStyle}>
                {t(n.labelKey)}
              </NavLink>
            ))}
          </div>

          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LanguageSwitcher />
            {user ? (
              <>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" style={{ display:'flex', alignItems:'center', gap:6, textDecoration:'none', fontSize:14, fontWeight:600, color:'#9333ea' }}>
                    <ShieldCheck size={16}/> {t('nav.admin')}
                  </Link>
                )}
                {user.role === 'MENTOR' && (
                  <Link to="/mentor" style={{ display:'flex', alignItems:'center', gap:6, textDecoration:'none', fontSize:14, fontWeight:600, color:'#9333ea' }}>
                    <GraduationCap size={16}/> {t('nav.mentorCabinet')}
                  </Link>
                )}
                <Link to={roleHome(user.role)} style={{ display:'flex', alignItems:'center', gap:6, textDecoration:'none', fontSize:14, fontWeight:600, color:'#475569' }}>
                  <LayoutDashboard size={16}/> {user.name.split(' ')[0]}
                </Link>
                <NotificationBell />
                <button onClick={handleLogout} title={t('nav.logout')}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:10, background:'#f1f5f9', border:'1.5px solid #e2e8f0', color:'#475569', cursor:'pointer' }}>
                  <LogOut size={15}/>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ textDecoration:'none', fontSize:14, fontWeight:600, color:'#475569' }}>{t('nav.login')}</Link>
                <Link to="/register"><button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }}>{t('nav.start')}</button></Link>
              </>
            )}
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
            {NAV.map((n: NavItem, i: number) => (
              <MotionNavLink key={n.labelKey} to={n.to} end={n.end} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setOpen(false)}
                style={{ display: 'block', padding: '12px 4px', textDecoration: 'none', fontWeight: 600, fontSize: 15, color: '#0f172a', borderBottom: i < NAV.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                {t(n.labelKey)}
              </MotionNavLink>
            ))}
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'10px 4px 0' }}>
              <LanguageSwitcher />
            </div>
            {user ? (
              <>
                <div style={{ display:'flex', justifyContent:'flex-end', padding:'6px 4px 0' }}>
                  <NotificationBell />
                </div>
                {user.role === 'ADMIN' && (
                  <MotionLink to="/admin" onClick={() => setOpen(false)}>
                    <button className="btn-outline" style={{ width: '100%', marginTop: 14, justifyContent: 'center', color:'#9333ea', borderColor:'#e9d5ff' }}>
                      <ShieldCheck size={15}/> {t('nav.adminPanel')}
                    </button>
                  </MotionLink>
                )}
                {user.role === 'MENTOR' && (
                  <MotionLink to="/mentor" onClick={() => setOpen(false)}>
                    <button className="btn-outline" style={{ width: '100%', marginTop: 14, justifyContent: 'center', color:'#9333ea', borderColor:'#e9d5ff' }}>
                      <GraduationCap size={15}/> {t('nav.mentorCabinetFull')}
                    </button>
                  </MotionLink>
                )}
                <MotionLink to={roleHome(user.role)} onClick={() => setOpen(false)}>
                  <button className="btn-primary" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}>
                    <LayoutDashboard size={15}/> {t('nav.myCabinet')}
                  </button>
                </MotionLink>
                <button onClick={handleLogout} className="btn-outline" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}>
                  <LogOut size={15}/> {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <MotionLink to="/login" onClick={() => setOpen(false)}>
                  <button className="btn-outline" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>{t('nav.login')}</button>
                </MotionLink>
                <MotionLink to="/register" onClick={() => setOpen(false)}>
                  <button className="btn-primary" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}>{t('nav.start')}</button>
                </MotionLink>
              </>
            )}
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
