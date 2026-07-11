import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, GraduationCap, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMentorDashboard } from '../../api/mentors';
import { resolveIcon } from '../../utils/iconMap';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import MentorNotLinked from './MentorNotLinked';

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

const STATUS_META: Record<string, { labelKey: string; color: string; bg: string; border: string }> = {
  PENDING:   { labelKey: 'mentor.enrollStatus.PENDING',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ACTIVE:    { labelKey: 'mentor.enrollStatus.ACTIVE',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  COMPLETED: { labelKey: 'mentor.enrollStatus.COMPLETED', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  CANCELLED: { labelKey: 'mentor.enrollStatus.CANCELLED', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

export default function MentorHomePage(): React.ReactElement {
  const { t } = useTranslation();
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
    <div>
      <AdminPageHeader
        title={t('mentor.home.welcome', { name: user?.name?.split(' ')[0] || 'Mentor' })}
        sub={t('mentor.home.sub')} />

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}
      {status === 'not-linked' && <MentorNotLinked message={errorMsg} />}

      {status === 'ready' && data && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, marginBottom:28 }}>
            {[
              { label:t('mentor.home.statCourses'), value:data.stats.coursesCount, icon:BookOpen, color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff' },
              { label:t('mentor.home.statTotalStudents'), value:data.stats.totalStudents, icon:Users, color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd' },
              { label:t('mentor.home.statActiveStudents'), value:data.stats.activeStudents, icon:GraduationCap, color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
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

          <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:14 }}>{t('mentor.home.myCourses')}</h2>
          {data.mentor.courses.length === 0 && (
            <div className="card" style={{ padding:28, textAlign:'center', marginBottom:28 }}>
              <p style={{ fontSize:13.5, color:'#64748b' }}>{t('mentor.home.noCourseAssigned')}</p>
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
                    <p style={{ fontSize:12, color:'#64748b' }}>{t('mentor.home.moduleCount', { modules: c._count.modules, students: c._count.enrollments })}</p>
                  </div>
                  <span className="tag" style={{ background: c.published ? '#f0fdf4' : '#fff', borderColor: c.published ? '#bbf7d0' : '#e2e8f0', color: c.published ? '#16a34a' : '#94a3b8', flexShrink:0 }}>
                    {c.published ? t('mentor.home.published') : t('mentor.home.draft')}
                  </span>
                  <ArrowRight size={15} style={{ color:c.color, flexShrink:0 }} />
                </Link>
              );
            })}
          </div>

          <h2 style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:14 }}>{t('mentor.home.recentEnrollments')}</h2>
          {data.recentEnrollments.length === 0 && (
            <div className="card" style={{ padding:28, textAlign:'center' }}>
              <p style={{ fontSize:13.5, color:'#64748b' }}>{t('mentor.home.noEnrollments')}</p>
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
                  <p style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{formatDate(e.enrolledAt)}</p>
                  <span className="tag" style={{ background:s.bg, borderColor:s.border, color:s.color, fontWeight:700, flexShrink:0 }}>{t(s.labelKey)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
