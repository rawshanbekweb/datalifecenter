import { useEffect, useState } from 'react';
import { getMentorDashboard, getMentorStudents } from '../../api/mentors';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import MentorSessionsPanel, { StudentOption } from '../../components/sessions/MentorSessionsPanel';
import MentorNotLinked from './MentorNotLinked';

interface CourseOption {
  id: string;
  title: string;
}

export default function MentorSessionsPage(): React.ReactElement {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-linked' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMentorDashboard(), getMentorStudents()])
      .then(([d, s]: [{ mentor: { courses: CourseOption[] } }, { user: { id: string; name: string; email: string }; course: { id: string } }[]]) => {
        if (cancelled) return;
        setCourses(d.mentor.courses.map((c) => ({ id: c.id, title: c.title })));
        setStudents(s.map((row) => ({ id: row.user.id, name: row.user.name, email: row.user.email, courseId: row.course.id })));
        setStatus('ready');
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

      {status === 'ready' && <MentorSessionsPanel courses={courses} students={students} />}
    </div>
  );
}
