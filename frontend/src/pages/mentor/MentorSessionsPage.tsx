import { useEffect, useState } from 'react';
import { getMentorDashboard } from '../../api/mentors';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import MentorSessionsPanel from '../../components/sessions/MentorSessionsPanel';
import MentorNotLinked from './MentorNotLinked';

interface CourseOption {
  id: string;
  title: string;
}

export default function MentorSessionsPage(): React.ReactElement {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-linked' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getMentorDashboard()
      .then((d: { mentor: { courses: CourseOption[] } }) => {
        if (!cancelled) {
          setCourses(d.mentor.courses.map((c) => ({ id: c.id, title: c.title })));
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        setStatus(err.code === 'MENTOR_NOT_LINKED' ? 'not-linked' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <AdminPageHeader title="Jonli darslar" sub="Sessiyalarni rejalashtirish va boshqarish" />

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}
      {status === 'not-linked' && <MentorNotLinked message={errorMsg} />}

      {status === 'ready' && <MentorSessionsPanel courses={courses} />}
    </div>
  );
}
