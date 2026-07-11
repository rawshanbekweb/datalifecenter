import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, PlayCircle, FileText, HelpCircle, ClipboardList, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createModule, updateModule, deleteModule, createLesson, updateLesson, deleteLesson } from '../../api/courses';
import AdminPageHeader from '../admin/AdminPageHeader';
import FileUpload from '../common/FileUpload';
import LocalizedField from '../admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';

interface LessonItem {
  id: string;
  title: LocalizedString;
  order: number;
  contentType: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
  videoUrl?: string | null;
  content?: LocalizedString | null;
  durationMinutes?: number | null;
  isFreePreview: boolean;
}

interface ModuleItem {
  id: string;
  title: LocalizedString;
  description?: LocalizedString | null;
  order: number;
  lessons: LessonItem[];
}

export interface CourseWithCurriculum {
  id: string;
  title: LocalizedString;
  modules: ModuleItem[];
}

const CONTENT_TYPES: { value: LessonItem['contentType']; labelKey: string; icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }> }[] = [
  { value: 'VIDEO',      labelKey: 'admin.curriculum.types.VIDEO',      icon: PlayCircle },
  { value: 'TEXT',       labelKey: 'admin.curriculum.types.TEXT',       icon: FileText },
  { value: 'QUIZ',       labelKey: 'admin.curriculum.types.QUIZ',       icon: HelpCircle },
  { value: 'ASSIGNMENT', labelKey: 'admin.curriculum.types.ASSIGNMENT', icon: ClipboardList },
];

// QUIZ va ASSIGNMENT sxemada bor, lekin test/topshiriq dvigateli hali qurilmagan —
// mentorlarni chalg'itmaslik uchun yangi dars yaratishda faqat shular tanlanadi.
// (Eski QUIZ/ASSIGNMENT darslar ro'yxatda to'g'ri ikonka bilan ko'rinaveradi.)
const SELECTABLE_CONTENT_TYPES = CONTENT_TYPES.filter((ct) => ct.value === 'VIDEO' || ct.value === 'TEXT');

interface LessonFormState {
  id?: string;
  title: LocalizedString;
  contentType: LessonItem['contentType'];
  videoUrl: string;
  content: LocalizedString;
  durationMinutes: string;
  isFreePreview: boolean;
}

const emptyLessonForm: LessonFormState = {
  title: emptyLocalizedString(), contentType: 'VIDEO', videoUrl: '', content: emptyLocalizedString(), durationMinutes: '', isFreePreview: false,
};

interface LessonFormProps {
  initial: LessonFormState;
  moduleId: string;
  onCancel: () => void;
  onSaved: () => void;
}

function LessonForm({ initial, moduleId, onCancel, onSaved }: LessonFormProps): React.ReactElement {
  const { t } = useTranslation();
  const [form, setForm]     = useState<LessonFormState>(initial);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError]   = useState<string>('');

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      title: form.title,
      contentType: form.contentType,
      videoUrl: form.videoUrl || null,
      content: form.content.uz ? form.content : null,
      durationMinutes: form.durationMinutes === '' ? null : Number(form.durationMinutes),
      isFreePreview: form.isFreePreview,
    };
    try {
      if (form.id) {
        await updateLesson(form.id, payload);
      } else {
        await createLesson(moduleId, payload);
      }
      onSaved();
    } catch (err: unknown) {
      setError((err as Error).message || t('common.error'));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ padding:14, borderRadius:12, background:'#f8fafc', border:'1px dashed #cbd5e1', display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
      {error && <p style={{ fontSize:12.5, color:'#dc2626' }}>{error}</p>}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10, alignItems: 'flex-end' }}>
        <LocalizedField label="" placeholder={t('admin.curriculum.lessonTitlePlaceholder')} required value={form.title} onChange={(next) => setForm((f) => ({ ...f, title: next }))} />
        <select className="inp" value={form.contentType} style={{ fontSize:13 }}
          onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value as LessonItem['contentType'] }))}>
          {SELECTABLE_CONTENT_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{t(ct.labelKey)}</option>)}
        </select>
        <input className="inp" type="number" min="0" value={form.durationMinutes} style={{ fontSize:13 }}
          onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} placeholder={t('admin.curriculum.durationPlaceholder')} />
      </div>
      {form.contentType === 'VIDEO' && (
        <FileUpload kind="video" value={form.videoUrl}
          placeholder={t('admin.curriculum.videoPlaceholder')}
          onChange={(url) => setForm((f) => ({ ...f, videoUrl: url }))} />
      )}
      {form.contentType !== 'VIDEO' && (
        <LocalizedField label="" multiline rows={4} value={form.content}
          onChange={(next) => setForm((f) => ({ ...f, content: next }))}
          placeholder={t('admin.curriculum.contentPlaceholder')} />
      )}
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, color:'#334155', cursor:'pointer' }}>
        <input type="checkbox" checked={form.isFreePreview}
          onChange={(e) => setForm((f) => ({ ...f, isFreePreview: e.target.checked }))} />
        {t('admin.curriculum.freePreview')}
      </label>
      <div style={{ display:'flex', gap:8 }}>
        <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize:12.5, padding:'8px 14px', opacity: saving ? 0.6 : 1 }}>
          {saving ? t('common.saving') : t('common.save')}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline" style={{ fontSize:12.5, padding:'8px 14px' }}>{t('common.cancel')}</button>
      </div>
    </form>
  );
}

interface CurriculumEditorProps {
  courseId: string;
  backTo: string;
  backLabel: string;
  loadCourse: (id: string) => Promise<CourseWithCurriculum>;
}

// Kurs dasturi tahrirlagichi — admin va mentor kabinetlarida birgalikda ishlatiladi
export default function CurriculumEditor({ courseId, backTo, backLabel, loadCourse }: CurriculumEditorProps): React.ReactElement {
  const { t } = useTranslation();
  const [course, setCourse] = useState<CourseWithCurriculum | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const [moduleForm, setModuleForm]       = useState<{ id?: string; title: LocalizedString; description: LocalizedString } | null>(null);
  const [moduleSaving, setModuleSaving]   = useState<boolean>(false);
  const [lessonForm, setLessonForm]       = useState<{ moduleId: string; form: LessonFormState } | null>(null);

  const load = useCallback((): void => {
    loadCourse(courseId)
      .then((data: CourseWithCurriculum) => { setCourse(data); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [courseId, loadCourse]);

  useEffect(load, [load]);

  const saveModule = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!moduleForm) return;
    setModuleSaving(true);
    try {
      const description = moduleForm.description.uz ? moduleForm.description : null;
      if (moduleForm.id) {
        await updateModule(moduleForm.id, { title: moduleForm.title, description });
      } else {
        await createModule({ courseId, title: moduleForm.title, description });
      }
      setModuleForm(null);
      load();
    } catch (err: unknown) {
      alert((err as Error).message || t('common.error'));
    } finally {
      setModuleSaving(false);
    }
  };

  const removeModule = async (moduleId: string): Promise<void> => {
    if (!window.confirm(t('admin.curriculum.confirmDeleteModule'))) return;
    try {
      await deleteModule(moduleId);
      load();
    } catch (err: unknown) {
      alert((err as Error).message || t('common.error'));
    }
  };

  const removeLesson = async (lessonId: string): Promise<void> => {
    if (!window.confirm(t('admin.curriculum.confirmDeleteLesson'))) return;
    try {
      await deleteLesson(lessonId);
      load();
    } catch (err: unknown) {
      alert((err as Error).message || t('common.error'));
    }
  };

  if (status === 'loading') return <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>;
  if (status === 'error' || !course) return <p style={{ color:'#dc2626', fontSize:14 }}>{t('admin.curriculum.loadFailed')}</p>;

  return (
    <div>
      <Link to={backTo} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none', marginBottom:14 }}>
        <ArrowLeft size={14}/> {backLabel}
      </Link>
      <AdminPageHeader title={course.title.uz} sub={t('admin.curriculum.sub')}
        actions={
          !moduleForm ? (
            <button onClick={() => setModuleForm({ title: emptyLocalizedString(), description: emptyLocalizedString() })} className="btn-primary" style={{ fontSize:13 }}>
              <Plus size={15}/> {t('admin.curriculum.newModule')}
            </button>
          ) : undefined
        } />

      {moduleForm && (
        <form onSubmit={saveModule} className="card" style={{ padding:18, marginBottom:18, display:'flex', flexDirection:'column', gap:10 }}>
          <p style={{ fontSize:13.5, fontWeight:800, color:'#0f172a' }}>{moduleForm.id ? t('admin.curriculum.editModule') : t('admin.curriculum.newModule')}</p>
          <LocalizedField label="" placeholder={t('admin.curriculum.moduleTitlePlaceholder')} required value={moduleForm.title}
            onChange={(next) => setModuleForm((f) => f && ({ ...f, title: next }))} />
          <LocalizedField label="" placeholder={t('admin.curriculum.moduleDescPlaceholder')} value={moduleForm.description}
            onChange={(next) => setModuleForm((f) => f && ({ ...f, description: next }))} />
          <div style={{ display:'flex', gap:8 }}>
            <button type="submit" disabled={moduleSaving} className="btn-primary" style={{ fontSize:12.5, padding:'8px 14px', opacity: moduleSaving ? 0.6 : 1 }}>
              {moduleSaving ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" onClick={() => setModuleForm(null)} className="btn-outline" style={{ fontSize:12.5, padding:'8px 14px' }}>{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {course.modules.length === 0 && !moduleForm && (
        <div className="card" style={{ padding:36, textAlign:'center' }}>
          <p style={{ color:'#64748b', fontSize:14, marginBottom:16 }}>{t('admin.curriculum.emptyModules')}</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {course.modules.map((mod, mi) => (
          <div key={mod.id} className="card" style={{ padding:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: mod.lessons.length || lessonForm?.moduleId === mod.id ? 12 : 0 }}>
              <GripVertical size={15} style={{ color:'#cbd5e1', flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>
                  <span style={{ color:'#0ea5e9', fontFamily:'JetBrains Mono,monospace', marginRight:8 }}>{String(mi + 1).padStart(2, '0')}</span>
                  {mod.title.uz}
                </p>
                {mod.description?.uz && <p style={{ fontSize:12, color:'#94a3b8' }}>{mod.description.uz}</p>}
              </div>
              <span style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{t('admin.curriculum.lessonCount', { n: mod.lessons.length })}</span>
              <button onClick={() => setModuleForm({ id: mod.id, title: mod.title, description: mod.description || emptyLocalizedString() })}
                style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', flexShrink:0 }}>
                <Pencil size={13}/>
              </button>
              <button onClick={() => removeModule(mod.id)}
                style={{ width:30, height:30, borderRadius:8, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', flexShrink:0 }}>
                <Trash2 size={13}/>
              </button>
            </div>

            {mod.lessons.map((lesson) => {
              const typeMeta = CONTENT_TYPES.find((ct) => ct.value === lesson.contentType) || CONTENT_TYPES[0];
              const TypeIcon = typeMeta.icon;
              const isEditingThis = lessonForm?.moduleId === mod.id && lessonForm.form.id === lesson.id;
              return (
                <div key={lesson.id}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0 8px 25px', borderTop:'1px solid #f1f5f9' }}>
                    <TypeIcon size={14} style={{ color:'#0ea5e9', flexShrink:0 }} />
                    <span style={{ flex:1, fontSize:13, color:'#334155', minWidth:0 }}>{lesson.title.uz}</span>
                    {lesson.isFreePreview && <span className="tag" style={{ borderColor:'#bae6fd', color:'#0ea5e9', fontSize:10.5 }}>{t('admin.curriculum.freeTag')}</span>}
                    <span style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>{t(typeMeta.labelKey)}{lesson.durationMinutes ? ` · ${t('admin.curriculum.durationShort', { n: lesson.durationMinutes })}` : ''}</span>
                    <button onClick={() => setLessonForm({
                        moduleId: mod.id,
                        form: {
                          id: lesson.id, title: lesson.title, contentType: lesson.contentType,
                          videoUrl: lesson.videoUrl || '', content: lesson.content || emptyLocalizedString(),
                          durationMinutes: lesson.durationMinutes == null ? '' : String(lesson.durationMinutes),
                          isFreePreview: lesson.isFreePreview,
                        },
                      })}
                      style={{ width:26, height:26, borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', flexShrink:0 }}>
                      <Pencil size={12}/>
                    </button>
                    <button onClick={() => removeLesson(lesson.id)}
                      style={{ width:26, height:26, borderRadius:7, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', flexShrink:0 }}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                  {isEditingThis && (
                    <LessonForm initial={lessonForm.form} moduleId={mod.id}
                      onCancel={() => setLessonForm(null)}
                      onSaved={() => { setLessonForm(null); load(); }} />
                  )}
                </div>
              );
            })}

            {lessonForm?.moduleId === mod.id && !lessonForm.form.id && (
              <LessonForm initial={lessonForm.form} moduleId={mod.id}
                onCancel={() => setLessonForm(null)}
                onSaved={() => { setLessonForm(null); load(); }} />
            )}

            {(!lessonForm || lessonForm.moduleId !== mod.id) && (
              <button onClick={() => setLessonForm({ moduleId: mod.id, form: { ...emptyLessonForm } })}
                style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:700, color:'#0ea5e9', background:'transparent', border:'none', cursor:'pointer', padding:'10px 0 0 25px' }}>
                <Plus size={14}/> {t('admin.curriculum.addLesson')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
