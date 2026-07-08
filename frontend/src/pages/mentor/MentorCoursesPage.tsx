import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListTree, Users, ArrowRight } from 'lucide-react';
import { getMentorDashboard } from '../../api/mentors';
import { resolveIcon } from '../../utils/iconMap';
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

// Mentorning o'z kurslari — har biridan kurs dasturi tahrirlagichiga o'tiladi
export default function MentorCoursesPage(): React.ReactElement {
  const [courses, setCourses] = useState<MentorCourse[]>([]);
  const [status, setStatus]   = useState<'loading' | 'ready' | 'not-linked' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getMentorDashboard()
      .then((d) => { if (!cancelled) { setCourses(d.mentor.courses); setStatus('ready'); } })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        setStatus(err.code === 'MENTOR_NOT_LINKED' ? 'not-linked' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <AdminPageHeader title="Kurslarim" sub="Sizga biriktirilgan kurslar — dasturini shu yerdan boshqarasiz" />

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}
      {status === 'not-linked' && <MentorNotLinked message={errorMsg} />}

      {status === 'ready' && courses.length === 0 && (
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <p style={{ color:'#64748b', fontSize:14 }}>
            Sizga hali kurs biriktirilmagan. Administrator kurs biriktirgach, u shu yerda ko'rinadi.
          </p>
        </div>
      )}

      {status === 'ready' && courses.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {courses.map((c) => {
            const Icon = resolveIcon(c.iconKey);
            return (
              <div key={c.id} className="card"
                style={{ padding:20, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', background:c.bg, border:`1.5px solid ${c.border}` }}>
                <div style={{ width:48, height:48, borderRadius:13, background:'#fff', border:`1.5px solid ${c.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={22} style={{ color:c.color }} />
                </div>
                <div style={{ flex:'1 1 220px', minWidth:0 }}>
                  <p style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:3 }}>{c.title}</p>
                  <p style={{ display:'flex', alignItems:'center', gap:12, fontSize:12.5, color:'#64748b' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><ListTree size={13}/> {c._count.modules} modul</span>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}><Users size={13}/> {c._count.enrollments} talaba</span>
                  </p>
                </div>
                {!c.published && (
                  <span className="tag" style={{ borderColor:'#fde68a', background:'#fffbeb', color:'#d97706', fontWeight:700, flexShrink:0 }}>
                    Nashr qilinmagan
                  </span>
                )}
                <Link to={`/mentor/courses/${c.id}/curriculum`} style={{ textDecoration:'none', flexShrink:0 }}>
                  <button className="btn-primary" style={{ fontSize:12.5, padding:'9px 16px' }}>
                    Kurs dasturi <ArrowRight size={14}/>
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
