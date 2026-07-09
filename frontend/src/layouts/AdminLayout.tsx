import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, BookOpen, Users, UserSquare2,
  Newspaper, Handshake, Mail, Inbox, LogOut, Globe, Menu, X, Settings, Star, MessageSquare, LayoutGrid, Megaphone,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/common/NotificationBell';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number | string }>;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Boshqaruv paneli',  to: '/admin',             icon: LayoutDashboard, end: true },
  { label: 'Yozilishlar',       to: '/admin/enrollments', icon: GraduationCap },
  { label: 'Kurslar',           to: '/admin/courses',     icon: BookOpen },
  { label: 'Foydalanuvchilar',  to: '/admin/users',       icon: Users },
  { label: 'Mentorlar',         to: '/admin/mentors',     icon: UserSquare2 },
  { label: "Mentor so'rovlari", to: '/admin/mentor-requests', icon: Inbox },
  { label: 'Blog',              to: '/admin/blog',        icon: Newspaper },
  { label: 'Hamkorlar',         to: '/admin/partners',    icon: Handshake },
  { label: 'Loyihalar',         to: '/admin/projects',    icon: LayoutGrid },
  { label: 'Xabarlar',          to: '/admin/messages',    icon: Mail },
  { label: "E'lonlar",          to: '/admin/announcements', icon: Megaphone },
  { label: 'Sayt sozlamalari',  to: '/admin/site-settings', icon: Settings },
  { label: 'Sharhlar',          to: '/admin/testimonials', icon: Star },
  { label: 'Kurs sharhlari',    to: '/admin/course-reviews', icon: MessageSquare },
];

export default function AdminLayout(): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const handleLogout = async (): Promise<void> => {
    // Avval sahifadan chiqamiz, keyin foydalanuvchini tozalaymiz — aks holda
    // ProtectedRoute hali /admin'da turgan holda user=null'ni ko'rib, joriy
    // yo'lni location.state.from sifatida saqlab, /login'ga o'tkazib yuboradi
    // (keyingi login shu eski from'ga qaytarib qo'yishi mumkin edi).
    navigate('/', { replace: true });
    await logout();
  };

  const sidebarContent = (
    <>
      <Link to="/admin" onClick={() => setMenuOpen(false)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'22px 20px 18px', textDecoration:'none', borderBottom:'1px solid #1e293b' }}>
        <img src="/assets/favicon.jpg" alt="DATA LIFE" style={{ width:34, height:34, borderRadius:10, objectFit:'cover', flexShrink:0 }} />
        <div>
          <p style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:800, color:'#f8fafc', lineHeight:1.1 }}>DATA LIFE</p>
          <p style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em' }}>Admin panel</p>
        </div>
      </Link>

      <nav style={{ padding:'14px 12px', display:'flex', flexDirection:'column', gap:2, flex:1, overflowY:'auto' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:11, padding:'10px 12px', borderRadius:10,
                fontSize:13.5, fontWeight:600, textDecoration:'none', transition:'background 0.15s, color 0.15s',
                color: isActive ? '#f8fafc' : '#94a3b8',
                background: isActive ? 'rgba(14,165,233,0.18)' : 'transparent',
                borderLeft: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
              })}>
              <Icon size={16} /> {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding:'14px 12px', borderTop:'1px solid #1e293b', display:'flex', flexDirection:'column', gap:2 }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 12px', borderRadius:10, fontSize:13.5, fontWeight:600, color:'#94a3b8', textDecoration:'none' }}>
          <Globe size={16} /> Saytga qaytish
        </Link>
        <button onClick={handleLogout}
          style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 12px', borderRadius:10, fontSize:13.5, fontWeight:600, color:'#f87171', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', width:'100%' }}>
          <LogOut size={16} /> Chiqish
        </button>
      </div>
    </>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', display:'flex' }}>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar"
        style={{ width:248, background:'#0f172a', display:'flex', flexDirection:'column', position:'fixed', top:0, bottom:0, left:0, zIndex:40 }}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', zIndex:49 }}>
          <aside onClick={(e) => e.stopPropagation()}
            style={{ width:248, height:'100%', background:'#0f172a', display:'flex', flexDirection:'column' }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="admin-main" style={{ flex:1, marginLeft:248, display:'flex', flexDirection:'column', minWidth:0 }}>
        <header style={{ height:60, background:'#fff', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:14, padding:'0 24px', position:'sticky', top:0, zIndex:30 }}>
          <button className="admin-menu-btn" onClick={() => setMenuOpen((v) => !v)}
            style={{ display:'none', width:36, height:36, borderRadius:9, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', alignItems:'center', justifyContent:'center', color:'#475569' }}>
            {menuOpen ? <X size={17}/> : <Menu size={17}/>}
          </button>
          <p style={{ fontSize:13, color:'#94a3b8', fontWeight:600 }}>Platforma boshqaruvi</p>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
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

      <style>{`
        @media (max-width: 960px) {
          .admin-sidebar { display: none !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
