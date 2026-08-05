import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, Mail, ArrowRight, Clock, Eye, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAdminStats, AdminStats, TopContentItem } from '../../api/admin';
import { formatDate } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Loading from '../../components/common/Loading';

const ENROLLMENT_STATUS: Record<string, { labelKey: string; color: string; bg: string; border: string }> = {
  PENDING:   { labelKey: 'admin.enrollStatus.PENDING',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ACTIVE:    { labelKey: 'admin.enrollStatus.ACTIVE',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  COMPLETED: { labelKey: 'admin.enrollStatus.COMPLETED', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  CANCELLED: { labelKey: 'admin.enrollStatus.CANCELLED', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
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
  const { t } = useTranslation();
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
    return <Loading />;
  }
  if (status === 'error' || !stats) {
    return <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailedBackend')}</p>;
  }

  const c = stats.counts;
  const cards: StatCard[] = [
    { label:t('admin.dashboard.cardUsers'), value:c.usersTotal, sub:t('admin.dashboard.cardUsersSub', { n: c.studentsTotal }), icon:Users, color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd', to:'/admin/users' },
    { label:t('admin.dashboard.cardCourses'), value:c.coursesTotal, sub:t('admin.dashboard.cardCoursesSub', { n: c.coursesPublished }), icon:BookOpen, color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff', to:'/admin/courses' },
    { label:t('admin.dashboard.cardEnrollments'), value:c.enrollmentsTotal, sub:t('admin.dashboard.cardEnrollmentsSub', { pending: c.enrollmentsPending, active: c.enrollmentsActive }), icon:GraduationCap, color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', to:'/admin/enrollments' },
    { label:t('admin.dashboard.cardMessages'), value:c.messagesNew, sub:t('admin.dashboard.cardMessagesSub', { blog: c.blogPostsTotal, mentors: c.mentorsTotal }), icon:Mail, color:'#d97706', bg:'#fffbeb', border:'#fde68a', to:'/admin/messages' },
    // Jami raqam kartada, kunlik dinamikasi monitoring sahifasida
    { label:t('admin.dashboard.cardViews'), value:c.viewsTotal, sub:t('admin.dashboard.cardViewsSub', { n: c.likesTotal }), icon:Eye, color:'#0891b2', bg:'#ecfeff', border:'#a5f3fc', to:'/admin/analytics' },
    { label:t('admin.dashboard.cardCourseRequests'), value:c.courseRequestsNew, sub:t('admin.dashboard.cardCourseRequestsSub'), icon:GraduationCap, color:'#c2410c', bg:'#fff7ed', border:'#fed7aa', to:'/admin/course-requests' },
  ];

  // Eng ko'p ko'rilgan kontent — qaysi mavzu ishlayotganini bir qarashda ko'rsatadi
  const topLists: { titleKey: string; to: string; items: TopContentItem[] }[] = [
    { titleKey:'admin.dashboard.topCourses',  to:'/admin/courses',  items: stats.topContent?.courses  ?? [] },
    { titleKey:'admin.dashboard.topPosts',    to:'/admin/blog',     items: stats.topContent?.posts    ?? [] },
    { titleKey:'admin.dashboard.topProjects', to:'/admin/projects', items: stats.topContent?.projects ?? [] },
  ].filter((list) => list.items.length > 0);

  return (
    <div>
      <AdminPageHeader title={t('admin.dashboard.title')} sub={t('admin.dashboard.sub')} />

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
              <p style={{ fontFamily:'var(--font-sans)', fontSize:28, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{card.value}</p>
              <p style={{ fontSize:13, fontWeight:700, color:'#334155', margin:'6px 0 2px' }}>{card.label}</p>
              <p style={{ fontSize:11.5, color:'#64748b' }}>{card.sub}</p>
            </Link>
          );
        })}
      </div>

      {topLists.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:14, marginBottom:28 }}>
          {topLists.map((list) => (
            <div key={list.titleKey} className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{t(list.titleKey)}</p>
                <Link to={list.to} style={{ fontSize:12, fontWeight:700, color:'#0ea5e9', textDecoration:'none' }}>{t('admin.common.all')}</Link>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {list.items.map((item, i) => (
                  <div key={item.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, border:'1px solid #f1f5f9' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:'#cbd5e1', flexShrink:0 }}>{i + 1}</span>
                    <p style={{ flex:1, minWidth:0, fontSize:12.5, fontWeight:600, color:'#334155', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</p>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'#0891b2', fontWeight:700, flexShrink:0 }}>
                      <Eye size={12}/> {item.views}
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'#f43f5e', fontWeight:700, flexShrink:0 }}>
                      <Heart size={12}/> {item.likesCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:14 }}>
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{t('admin.dashboard.recentEnrollments')}</p>
            <Link to="/admin/enrollments" style={{ fontSize:12, fontWeight:700, color:'#0ea5e9', textDecoration:'none' }}>{t('admin.common.all')}</Link>
          </div>
          {stats.recentEnrollments.length === 0 && <p style={{ fontSize:13, color:'#94a3b8' }}>{t('admin.dashboard.noEnrollments')}</p>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {stats.recentEnrollments.map((e) => {
              const s = ENROLLMENT_STATUS[e.status] || ENROLLMENT_STATUS.PENDING;
              return (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:11, border:'1px solid #f1f5f9' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.user.name}</p>
                    <p style={{ fontSize:11.5, color:'#94a3b8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.course.title}</p>
                  </div>
                  <span className="tag" style={{ background:s.bg, borderColor:s.border, color:s.color, fontWeight:700, flexShrink:0 }}>{t(s.labelKey)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{t('admin.dashboard.recentMessages')}</p>
            <Link to="/admin/messages" style={{ fontSize:12, fontWeight:700, color:'#0ea5e9', textDecoration:'none' }}>{t('admin.common.all')}</Link>
          </div>
          {stats.recentMessages.length === 0 && <p style={{ fontSize:13, color:'#94a3b8' }}>{t('admin.dashboard.noMessages')}</p>}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {stats.recentMessages.map((m) => (
              <div key={m.id} style={{ padding:'10px 12px', borderRadius:11, border:'1px solid #f1f5f9' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</p>
                  {m.status === 'NEW' && <span className="tag" style={{ background:'#fffbeb', borderColor:'#fde68a', color:'#d97706', fontWeight:700 }}>{t('admin.dashboard.new')}</span>}
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94a3b8', flexShrink:0 }}>
                    <Clock size={11}/> {formatDate(m.createdAt)}
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
