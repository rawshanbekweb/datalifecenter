import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMentorStudents } from '../../api/mentors';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import MentorNotLinked from './MentorNotLinked';

interface StudentProgressRow {
  id: string;
  status: string;
  enrolledAt: string;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string; slug: string };
  progress: { totalLessons: number; completedLessons: number };
}

export default function MentorStudentsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [students, setStudents] = useState<StudentProgressRow[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-linked' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getMentorStudents()
      .then((rows: StudentProgressRow[]) => { if (!cancelled) { setStudents(rows); setStatus('ready'); } })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        setStatus(err.code === 'MENTOR_NOT_LINKED' ? 'not-linked' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <AdminPageHeader title={t('mentor.students.title')} sub={t('mentor.students.sub')} />

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}
      {status === 'not-linked' && <MentorNotLinked message={errorMsg} />}

      {status === 'ready' && students.length === 0 && (
        <div className="card" style={{ padding:36, textAlign:'center' }}>
          <p style={{ fontSize:13.5, color:'#64748b' }}>{t('mentor.students.empty')}</p>
        </div>
      )}

      {status === 'ready' && students.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {students.map((row) => {
            const pct = row.progress.totalLessons > 0
              ? Math.round((row.progress.completedLessons / row.progress.totalLessons) * 100)
              : 0;
            const done = row.status === 'COMPLETED';
            return (
              <div key={row.id} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{row.user.name}</p>
                  <p style={{ fontSize:11.5, color:'#94a3b8' }}>{row.user.email}</p>
                </div>
                <p style={{ flex:'1 1 150px', fontSize:12.5, fontWeight:600, color:'#475569', minWidth:0 }}>{row.course.title}</p>
                <div style={{ flex:'2 1 220px', display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                  <div style={{ flex:1, height:7, borderRadius:99, background:'#f1f5f9', border:'1px solid #e2e8f0', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:99, background: done ? '#16a34a' : '#9333ea' }} />
                  </div>
                  <span style={{ fontSize:11.5, fontWeight:800, color: done ? '#16a34a' : '#475569', flexShrink:0, minWidth:74, textAlign:'right' }}>
                    {row.progress.completedLessons}/{row.progress.totalLessons} · {pct}%
                  </span>
                </div>
                <span className="tag" style={{
                  background: done ? '#f0fdf4' : '#faf5ff',
                  borderColor: done ? '#bbf7d0' : '#e9d5ff',
                  color: done ? '#16a34a' : '#9333ea',
                  fontWeight:700, flexShrink:0,
                }}>
                  {done ? t('mentor.students.completed') : t('mentor.students.studying')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
