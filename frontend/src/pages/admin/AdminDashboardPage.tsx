import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, Mail, ArrowRight, Clock } from 'lucide-react';
import { getAdminStats, AdminStats } from '../../api/admin';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const ENROLLMENT_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:   { label: 'Kutilmoqda',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ACTIVE:    { label: 'Faol',           color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  COMPLETED: { label: 'Yakunlangan',    color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  CANCELLED: { label: 'Bekor qilingan', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

interface StatCard {
  label: string;
  value: number;
  sub: string;
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
  color: string;
  bg: string;
  border: string;
  to: string;
}

export default function AdminDashboardPage(): React.ReactElement {
  const [stats, setStats]   = useState<AdminStats | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then((data) => { if (!cancelled) { setStats(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') {
    return <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>;
  }
  if (status === 'error' || !stats) {
    return <p style={{ color:'#dc2626', fontSize:14 }}>Statistikani yuklab bo'lmadi. Backend ishga tushirilganini tekshiring.</p>;
  }

  const c = stats.counts;
  const cards: StatCard[] = [
    { label:'Foydalanuvchilar', value:c.usersTotal, sub:`${c.studentsTotal} talaba`, icon:Users, color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd', to:'/admin/users' },
    { label:'Kurslar', value:c.coursesTotal, sub:`${c.coursesPublished} chop etilgan`, icon:BookOpen, color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff', to:'/admin/courses' },
    { label:'Yozilishlar', value:c.enrollmentsTotal, sub:`${c.enrollmentsPending} kutilmoqda · ${c.enrollmentsActive} faol`, icon:GraduationCap, color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', to:'/admin/enrollments' },
    { label:'Yangi xabarlar', value:c.messagesNew, sub:`Blog: ${c.blogPostsTotal} · Mentorlar: ${c.mentorsTotal}`, icon:Mail, color:'#d97706', bg:'#fffbeb', border:'#fde68a', to:'/admin/messages' },
  ];

  return (
    <div>
      <AdminPageHeader title="Boshqaruv paneli" sub="Platformaning umumiy holati" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14, marginBottom:28 }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.to} className="card"
              style={{ padding:20, textDecoration:'none', background:card.bg, border:`1.5px solid ${card.border}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ width:38, height:38, borderRadius:11, background:'#fff', border:`1.5px solid ${card.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={17} style={{ color:card.color }} />
                </div>
                <ArrowRight size={15} style={{ color:card.color }} />
              </div>
              <p style={{ fontFamily:'Outfit,sans-serif', fontSize:28, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{card.value}</p>
              <p style={{ fontSize:13, fontWeight:700, color:'#334155', margin:'6px 0 2px' }}>{card.label}</p>
              <p style={{ fontSize:11.5, color:'#64748b' }}>{card.sub}</p>
            </Link>
          );
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:14 }}>
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>Oxirgi yozilishlar</p>
            <Link to="/admin/enrollments" style={{ fontSize:12, fontWeight:700, color:'#0ea5e9', textDecoration:'none' }}>Barchasi</Link>
          </div>
          {stats.recentEnrollments.length === 0 && <p style={{ fontSize:13, color:'#94a3b8' }}>Hozircha yozilishlar yo'q.</p>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {stats.recentEnrollments.map((e) => {
              const s = ENROLLMENT_STATUS[e.status] || ENROLLMENT_STATUS.PENDING;
              return (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:11, border:'1px solid #f1f5f9' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.user.name}</p>
                    <p style={{ fontSize:11.5, color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.course.title}</p>
                  </div>
                  <span className="tag" style={{ background:s.bg, borderColor:s.border, color:s.color, fontWeight:700, flexShrink:0 }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>Oxirgi xabarlar</p>
            <Link to="/admin/messages" style={{ fontSize:12, fontWeight:700, color:'#0ea5e9', textDecoration:'none' }}>Barchasi</Link>
          </div>
          {stats.recentMessages.length === 0 && <p style={{ fontSize:13, color:'#94a3b8' }}>Hozircha xabarlar yo'q.</p>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {stats.recentMessages.map((m) => (
              <div key={m.id} style={{ padding:'10px 12px', borderRadius:11, border:'1px solid #f1f5f9' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</p>
                  {m.status === 'NEW' && <span className="tag" style={{ background:'#fffbeb', borderColor:'#fde68a', color:'#d97706', fontWeight:700 }}>Yangi</span>}
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94a3b8', flexShrink:0 }}>
                    <Clock size={11}/> {new Date(m.createdAt).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
                <p style={{ fontSize:12, color:'#64748b', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{m.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
