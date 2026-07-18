import React, { useEffect, useState } from 'react';
import { Plus, Trash2, AlertCircle, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listAnnouncements, createAnnouncement, deleteAnnouncement, type Announcement } from '../../api/notifications';
import { listCoursesAdmin } from '../../api/courses';
import { formatDateTime } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast, useConfirm } from '../../components/common/Feedback';
import LocalizedField from '../../components/admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';

interface CourseOption {
  id: string;
  title: LocalizedString;
}

interface FormState {
  title: LocalizedString;
  body: LocalizedString;
  audience: Announcement['audience'];
  courseId: string;
}

const emptyForm: FormState = { title: emptyLocalizedString(), body: emptyLocalizedString(), audience: 'ALL', courseId: '' };

const AUDIENCE_LABEL_KEY: Record<Announcement['audience'], string> = {
  ALL: 'admin.announcements.audAll',
  STUDENTS: 'admin.announcements.audStudents',
  MENTORS: 'admin.announcements.audMentors',
};

type Status = 'loading' | 'ready' | 'error';

export default function AdminAnnouncementsPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
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
      setError(err.message || t('common.error'));
      setFormStatus('error');
    }
  };

  const remove = async (id: string): Promise<void> => {
    if (!(await confirm(t('admin.announcements.confirmDelete'), { danger: true }))) return;
    try {
      await deleteAnnouncement(id);
      load();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.announcements.title')} sub={t('admin.announcements.sub')} />

      <form onSubmit={submit} className="card" style={{ padding:24, marginBottom:20, display:'flex', flexDirection:'column', gap:12 }}>
        {formStatus === 'error' && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca' }}>
            <AlertCircle size={15} style={{ color:'#dc2626' }} />
            <p style={{ fontSize:13, color:'#dc2626' }}>{error}</p>
          </div>
        )}
        <LocalizedField label={t('admin.announcements.titleField')} required value={form.title} onChange={(next) => setForm((f) => ({ ...f, title: next }))} />
        <LocalizedField label={t('admin.announcements.bodyField')} required multiline value={form.body} onChange={(next) => setForm((f) => ({ ...f, body: next }))} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.announcements.audience')}</label>
            <select className="inp" value={form.audience} disabled={!!form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as Announcement['audience'] }))} style={{ cursor:'pointer' }}>
              <option value="ALL">{t('admin.announcements.audienceAll')}</option>
              <option value="STUDENTS">{t('admin.announcements.audienceStudents')}</option>
              <option value="MENTORS">{t('admin.announcements.audienceMentors')}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.announcements.courseTarget')}</label>
            <select className="inp" value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} style={{ cursor:'pointer' }}>
              <option value="">{t('admin.announcements.courseNone')}</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title.uz}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={formStatus==='loading'} className="btn-primary" style={{ opacity: formStatus==='loading'?0.7:1, alignSelf:'flex-start' }}>
          <Plus size={15}/> {formStatus==='loading' ? t('common.sending') : t('admin.announcements.send')}
        </button>
      </form>

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {items.map((a) => (
            <div key={a.id} className="card" style={{ padding:16, display:'flex', alignItems:'flex-start', gap:14 }}>
              <div className="icon-box" style={{ flexShrink:0 }}><Megaphone size={16} style={{ color:'#0ea5e9' }} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:2 }}>{a.title}</p>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, marginBottom:6 }}>{a.body}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span className="tag">{a.course ? a.course.title : t(AUDIENCE_LABEL_KEY[a.audience])}</span>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>{formatDateTime(a.createdAt)}</span>
                </div>
              </div>
              <button onClick={() => remove(a.id)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', flexShrink:0 }}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="card" style={{ padding:36, textAlign:'center' }}>
              <p style={{ color:'#64748b', fontSize:14 }}>{t('admin.announcements.empty')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
