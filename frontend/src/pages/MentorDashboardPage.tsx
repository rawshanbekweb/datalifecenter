import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Users, GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';
import { getMentorDashboard } from '../api/mentors';
import { resolveIcon } from '../utils/iconMap';
import { useAuth } from '../hooks/useAuth';
import MentorSessionsPanel from '../components/sessions/MentorSessionsPanel';

interface MentorCourse {
  id: string;
  slug: string;
  title: string;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  published: boolean;
  _count: { enrollments: number; modules: number };
}

interface MentorDashboardData {
  mentor: {
    id: string;
    name: string;
    specialty: string;
    courses: MentorCourse[];
  };
  recentEnrollments: {
    id: string;
    status: string;
    enrolledAt: string;
    user: { id: string; name: string; email: string };
    course: { id: string; title: string; slug: string };
  }[];
  stats: { totalStudents: number; activeStudents: number; coursesCount: number };
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:   { label: 'Kutilmoqda',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ACTIVE:    { label: 'Faol',           color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  COMPLETED: { label: 'Yakunlangan',    color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  CANCELLED: { label: 'Bekor qilingan', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

export default function MentorDashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const [data, setData]     = useState<MentorDashboardData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-linked' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getMentorDashboard()
      .then((d: MentorDashboardData) => { if (!cancelled) { setData(d); setStatus('ready'); } })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        setStatus(err.code === 'MENTOR_NOT_LINKED' ? 'not-linked' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:32 }}>
          <span className="pill" style={{ background:'#faf5ff', borderColor:'#e9d5ff', color:'#9333ea' }}>Mentor kabineti</span>
          <h1 className="h-section" style={{ marginBottom:6 }}>Xush kelibsiz, <span className="accent">{user?.name?.split(' ')[0]}</span></h1>
          <p className="sub" style={{ textAlign:'left' }}>Kurslaringiz va talabalaringiz shu yerda</p>
        </motion.div>

        {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
        {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}
        {status === 'not-linked' && (
          <div className="card" style={{ padding:32, display:'flex', alignItems:'flex-start', gap:14 }}>
            <AlertCircle size={20} style={{ color:'#d97706', flexShrink:0, marginTop:2 }} />
            <div>
              <p style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:6 }}>Mentor profili bog'lanmagan</p>
              <p style={{ fontSize:13.5, color:'#64748b', lineHeight:1.7 }}>{errorMsg}</p>
            </div>
          </div>
        )}

        {status === 'ready' && data && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, marginBottom:28 }}>
              {[
                { label:'Kurslarim', value:data.stats.coursesCount, icon:BookOpen, color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff' },
                { label:'Jami talabalar', value:data.stats.totalStudents, icon:Users, color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd' },
                { label:'Faol talabalar', value:data.stats.activeStudents, icon:GraduationCap, color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="card" style={{ padding:20, background:card.bg, border:`1.5px solid ${card.border}` }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'#fff', border:`1.5px solid ${card.border}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                      <Icon size={16} style={{ color:card.color }} />
                    </div>
                    <p style={{ fontFamily:'Outfit,sans-serif', fontSize:26, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{card.value}</p>
                    <p style={{ fontSize:12.5, fontWeight:700, color:'#475569', marginTop:5 }}>{card.label}</p>
                  </div>
                );
              })}
            </div>

            <MentorSessionsPanel courses={data.mentor.courses.map((c) => ({ id: c.id, title: c.title }))} />

            <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:14 }}>Kurslarim</h2>
            {data.mentor.courses.length === 0 && (
              <div className="card" style={{ padding:28, textAlign:'center', marginBottom:28 }}>
                <p style={{ fontSize:13.5, color:'#64748b' }}>Sizga hali kurs biriktirilmagan. Administrator kurs yaratishda sizni mentor sifatida tanlashi kerak.</p>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:32 }}>
              {data.mentor.courses.map((c) => {
                const Icon = resolveIcon(c.iconKey);
                return (
                  <Link key={c.id} to={`/courses/${c.slug}`} className="card"
                    style={{ padding:16, display:'flex', alignItems:'center', gap:14, textDecoration:'none', background:c.bg, border:`1.5px solid ${c.border}` }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:'#fff', border:`1.5px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={18} style={{ color:c.color }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{c.title}</p>
                      <p style={{ fontSize:12, color:'#64748b' }}>{c._count.modules} modul · {c._count.enrollments} talaba</p>
                    </div>
                    <span className="tag" style={{ background: c.published ? '#f0fdf4' : '#fff', borderColor: c.published ? '#bbf7d0' : '#e2e8f0', color: c.published ? '#16a34a' : '#94a3b8', flexShrink:0 }}>
                      {c.published ? 'Chop etilgan' : 'Qoralama'}
                    </span>
                    <ArrowRight size={15} style={{ color:c.color, flexShrink:0 }} />
                  </Link>
                );
              })}
            </div>

            <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:14 }}>Oxirgi yozilishlar</h2>
            {data.recentEnrollments.length === 0 && (
              <div className="card" style={{ padding:28, textAlign:'center' }}>
                <p style={{ fontSize:13.5, color:'#64748b' }}>Kurslaringizga hali hech kim yozilmagan.</p>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {data.recentEnrollments.map((e) => {
                const s = STATUS_META[e.status] || STATUS_META.PENDING;
                return (
                  <div key={e.id} className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <div style={{ flex:'1 1 180px', minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{e.user.name}</p>
                      <p style={{ fontSize:11.5, color:'#94a3b8' }}>{e.user.email}</p>
                    </div>
                    <p style={{ flex:'1 1 160px', fontSize:12.5, fontWeight:600, color:'#475569', minWidth:0 }}>{e.course.title}</p>
                    <p style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{new Date(e.enrolledAt).toLocaleDateString('uz-UZ')}</p>
                    <span className="tag" style={{ background:s.bg, borderColor:s.border, color:s.color, fontWeight:700, flexShrink:0 }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
