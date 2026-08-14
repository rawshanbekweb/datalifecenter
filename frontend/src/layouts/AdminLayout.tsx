import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Globe, Menu, X, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import NotificationBell from '../components/common/NotificationBell';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import QuickJump, { QUICK_JUMP_EVENT } from '../components/admin/QuickJump';
import {
  BOTTOM_ITEMS, NAV_GROUPS, NavItem, TOP_ITEMS, groupOfPath,
} from '../components/admin/adminNav';
import { Z } from '../utils/zLayers';

export default function AdminLayout(): React.ReactElement {
  const { t } = useTranslation();
  const unreadMessages = useUnreadMessages();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Turgan sahifangiz qaysi guruhda bo'lsa, o'sha guruh ochiq bo'ladi
  const activeGroup = groupOfPath(location.pathname);
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);

  // Boshqa bo'limga o'tilganda guruh o'zi almashadi — aks holda foydalanuvchi
  // qaysi guruhda ekanini ko'rmay qolardi
  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup);
  }, [activeGroup]);

  const handleLogout = async (): Promise<void> => {
    // Avval sahifadan chiqamiz, keyin foydalanuvchini tozalaymiz — aks holda
    // ProtectedRoute hali /admin'da turgan holda user=null'ni ko'rib, joriy
    // yo'lni location.state.from sifatida saqlab, /login'ga o'tkazib yuboradi
    // (keyingi login shu eski from'ga qaytarib qo'yishi mumkin edi).
    navigate('/', { replace: true });
    await logout();
  };

  const renderItem = (item: NavItem): React.ReactElement => {
    const Icon = item.icon;
    return (
      <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)}
        style={({ isActive }) => ({
          display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:9,
          fontSize:13, fontWeight:600, textDecoration:'none', transition:'background 0.15s, color 0.15s',
          color: isActive ? '#f8fafc' : '#94a3b8',
          background: isActive ? 'rgba(14,165,233,0.18)' : 'transparent',
          borderLeft: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
        })}>
        <Icon size={15} /> {t(item.labelKey)}
        {/* O'qilmagan xabarlar — kabinetning qaysi bo'limida ekaningizdan qat'i nazar ko'rinadi */}
        {item.badge && unreadMessages > 0 && (
          <span style={{ marginLeft:'auto', fontSize:10.5, fontWeight:800, color:'#fff', background:'#f43f5e', borderRadius:20, padding:'1px 7px' }}>
            {unreadMessages}
          </span>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      <Link to="/admin" onClick={() => setMenuOpen(false)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 18px 14px', textDecoration:'none', borderBottom:'1px solid #1e293b' }}>
        <img src="/assets/favicon.jpg" alt="DATA LIFE" style={{ width:30, height:30, borderRadius:9, objectFit:'cover', flexShrink:0 }} />
        <div>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:15, fontWeight:800, color:'#f8fafc', lineHeight:1.1 }}>DATA LIFE</p>
          <p style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em' }}>{t('admin.panel')}</p>
        </div>
      </Link>

      <nav style={{ padding:'10px 10px', display:'flex', flexDirection:'column', gap:1, flex:1, overflowY:'auto' }}>
        {TOP_ITEMS.map(renderItem)}

        {NAV_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          const open = openGroup === group.labelKey;
          // Guruh yopiq bo'lsa ichidagi o'qilmagan xabar belgisi sarlavhaga
          // ko'chadi — aks holda yangi xabar butunlay ko'rinmay qolardi
          const hiddenBadge = !open && group.items.some((i) => i.badge) && unreadMessages > 0;
          return (
            <div key={group.labelKey} style={{ marginTop:6 }}>
              <button type="button" onClick={() => setOpenGroup(open ? null : group.labelKey)}
                aria-expanded={open}
                style={{
                  display:'flex', alignItems:'center', gap:9, width:'100%', padding:'7px 12px',
                  borderRadius:9, border:'none', background:'transparent', cursor:'pointer', textAlign:'left',
                  fontSize:10.5, fontWeight:800, letterSpacing:'0.07em', textTransform:'uppercase',
                  color: open ? '#cbd5e1' : '#64748b',
                }}>
                <GroupIcon size={13} />
                <span style={{ flex:1 }}>{t(group.labelKey)}</span>
                {hiddenBadge && (
                  <span style={{ fontSize:10, fontWeight:800, color:'#fff', background:'#f43f5e', borderRadius:20, padding:'1px 6px' }}>
                    {unreadMessages}
                  </span>
                )}
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              {open && (
                <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  {group.items.map(renderItem)}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop:6 }}>{BOTTOM_ITEMS.map(renderItem)}</div>
      </nav>

      {/* O'lchamlar menyu punktlari bilan bir xil (8px/13px/15px) — aks holda
          pastki ikki havola ularga nisbatan yirikroq ko'rinib qolardi */}
      <div style={{ padding:'10px 10px', borderTop:'1px solid #1e293b', display:'flex', flexDirection:'column', gap:1 }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:9, fontSize:13, fontWeight:600, color:'#94a3b8', textDecoration:'none' }}>
          <Globe size={15} /> {t('admin.backToSite')}
        </Link>
        <button onClick={handleLogout}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:9, fontSize:13, fontWeight:600, color:'#f87171', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', width:'100%' }}>
          <LogOut size={15} /> {t('nav.logout')}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', display:'flex' }}>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar"
        style={{ width:248, background:'#0f172a', display:'flex', flexDirection:'column', position:'fixed', top:0, bottom:0, left:0, zIndex: Z.sidebar }}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex: Z.sidebarOverlay }}>
          <aside onClick={(e) => e.stopPropagation()}
            style={{ width:248, height:'100%', background:'#0f172a', display:'flex', flexDirection:'column' }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="admin-main" style={{ flex:1, marginLeft:248, display:'flex', flexDirection:'column', minWidth:0 }}>
        <header style={{ height:60, background:'#fff', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:14, padding:'0 24px', position:'sticky', top:0, zIndex: Z.cabinetHeader }}>
          <button className="admin-menu-btn" onClick={() => setMenuOpen((v) => !v)}
            style={{ display:'none', width:36, height:36, borderRadius:9, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', alignItems:'center', justifyContent:'center', color:'#475569' }}>
            {menuOpen ? <X size={17}/> : <Menu size={17}/>}
          </button>
          <p className="admin-hide-sm" style={{ fontSize:13, color:'#94a3b8', fontWeight:600 }}>{t('admin.platformMgmt')}</p>
          {/* Tez o'tish tugmasi — klaviatura qisqartmasi o'z-o'zidan bilinmaydi,
              shuning uchun u ko'rinib turadi va bosib ham ochiladi */}
          <button type="button" onClick={() => window.dispatchEvent(new Event(QUICK_JUMP_EVENT))}
            title={t('admin.quickJump.title')}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:9, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', color:'#94a3b8', fontSize:12.5, fontWeight:600 }}>
            <Search size={14} />
            <span className="admin-hide-sm">{t('admin.quickJump.button')}</span>
            <kbd className="admin-hide-sm" style={{ fontSize:10, fontWeight:700, border:'1px solid #e2e8f0', borderRadius:5, padding:'1px 5px', background:'#fff', fontFamily:'var(--font-mono)' }}>Ctrl K</kbd>
          </button>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
            <LanguageSwitcher />
            <NotificationBell />
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', lineHeight:1.2 }}>{user?.name}</p>
              <p style={{ fontSize:11, color:'#94a3b8' }}>{user?.email}</p>
            </div>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#0ea5e9', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, flexShrink:0 }}>
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main style={{ flex:1, padding:'28px 24px 48px', maxWidth:1200, width:'100%', margin:'0 auto' }}>
          <Outlet />
        </main>
      </div>

      <QuickJump />

      <style>{`
        @media (max-width: 960px) {
          .admin-sidebar { display: none !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-menu-btn { display: flex !important; }
        }
        /* Tor ekranda header'da faqat ikonkalar qoladi — matn va qisqartma
           sig'may, tugmalarni bir-biriga siqib qo'yardi */
        @media (max-width: 720px) {
          .admin-hide-sm { display: none !important; }
        }
      `}</style>
    </div>
  );
}
