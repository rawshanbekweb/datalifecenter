import { NavLink, Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const TABS = [
  { label: 'Xabarlar',  to: '/admin/messages' },
  { label: 'Kurslar',   to: '/admin/courses' },
  { label: 'Mentorlar', to: '/admin/mentors' },
  { label: 'Hamkorlar', to: '/admin/partners' },
  { label: 'Blog',      to: '/admin/blog' },
];

export default function AdminLayout() {
  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <span className="pill" style={{ background:'#faf5ff', borderColor:'#e9d5ff', color:'#9333ea' }}>
            <ShieldCheck size={12}/> Admin panel
          </span>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:32, borderBottom:'1.5px solid #e2e8f0', flexWrap:'wrap' }}>
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to}
              style={({ isActive }) => ({
                padding:'10px 16px', fontSize:14, fontWeight:700, textDecoration:'none',
                color: isActive ? '#0ea5e9' : '#64748b',
                borderBottom: isActive ? '2px solid #0ea5e9' : '2px solid transparent',
                marginBottom:-2,
              })}>
              {t.label}
            </NavLink>
          ))}
        </div>

        <Outlet/>
      </div>
    </section>
  );
}
