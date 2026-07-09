import React, { useEffect, useState } from 'react';
import { Plus, Trash2, AlertCircle, Megaphone } from 'lucide-react';
import { listAnnouncements, createAnnouncement, deleteAnnouncement, type Announcement } from '../../api/notifications';
import { listCoursesAdmin } from '../../api/courses';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

interface CourseOption {
  id: string;
  title: string;
}

interface FormState {
  title: string;
  body: string;
  audience: Announcement['audience'];
  courseId: string;
}

const emptyForm: FormState = { title: '', body: '', audience: 'ALL', courseId: '' };

const AUDIENCE_LABEL: Record<Announcement['audience'], string> = {
  ALL: 'Hammaga',
  STUDENTS: 'Talabalarga',
  MENTORS: 'Mentorlarga',
};

type Status = 'loading' | 'ready' | 'error';

export default function AdminAnnouncementsPage(): React.ReactElement {
  const [items, setItems]     = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [status, setStatus]   = useState<Status>('loading');
  const [form, setForm]       = useState<FormState>(emptyForm);
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError]     = useState<string>('');

  const load = (): void => {
    setStatus('loading');
    Promise.all([listAnnouncements(), listCoursesAdmin()])
      .then(([a, c]: [Announcement[], CourseOption[]]) => { setItems(a); setCourses(c); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      await createAnnouncement({
        title: form.title,
        body: form.body,
        audience: form.audience,
        courseId: form.courseId || null,
      });
      setForm(emptyForm);
      setFormStatus('idle');
      load();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
      setFormStatus('error');
    }
  };

  const remove = async (id: string): Promise<void> => {
    if (!window.confirm("E'lonni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteAnnouncement(id);
      load();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div>
      <AdminPageHeader title="E'lonlar" sub="Talaba yoki mentorlarga bildirishnoma sifatida yetkaziladigan e'lonlar" />

      <form onSubmit={submit} className="card" style={{ padding:24, marginBottom:20, display:'flex', flexDirection:'column', gap:12 }}>
        {formStatus === 'error' && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca' }}>
            <AlertCircle size={15} style={{ color:'#dc2626' }} />
            <p style={{ fontSize:13, color:'#dc2626' }}>{error}</p>
          </div>
        )}
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Sarlavha *</label>
          <input className="inp" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required minLength={3} maxLength={200} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Matn *</label>
          <textarea className="inp" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} required minLength={5} maxLength={5000} rows={3} style={{ resize:'none' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Auditoriya</label>
            <select className="inp" value={form.audience} disabled={!!form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as Announcement['audience'] }))} style={{ cursor:'pointer' }}>
              <option value="ALL">Hammaga</option>
              <option value="STUDENTS">Faqat talabalarga</option>
              <option value="MENTORS">Faqat mentorlarga</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Muayyan kursga yuborish (ixtiyoriy)</label>
            <select className="inp" value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} style={{ cursor:'pointer' }}>
              <option value="">— tanlanmagan (yuqoridagi auditoriya ishlatiladi)</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={formStatus==='loading'} className="btn-primary" style={{ opacity: formStatus==='loading'?0.7:1, alignSelf:'flex-start' }}>
          <Plus size={15}/> {formStatus==='loading' ? 'Yuborilmoqda...' : "E'lon yuborish"}
        </button>
      </form>

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {items.map((a) => (
            <div key={a.id} className="card" style={{ padding:16, display:'flex', alignItems:'flex-start', gap:14 }}>
              <div className="icon-box" style={{ flexShrink:0 }}><Megaphone size={16} style={{ color:'#0ea5e9' }} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:2 }}>{a.title}</p>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:6 }}>{a.body}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span className="tag">{a.course ? a.course.title : AUDIENCE_LABEL[a.audience]}</span>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>{new Date(a.createdAt).toLocaleString('uz-UZ')}</span>
                </div>
              </div>
              <button onClick={() => remove(a.id)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', flexShrink:0 }}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="card" style={{ padding:36, textAlign:'center' }}>
              <p style={{ color:'#64748b', fontSize:14 }}>Hali e'lon yuborilmagan.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
