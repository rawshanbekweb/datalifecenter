import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, AlertCircle, ListTree } from 'lucide-react';
import { listCoursesAdmin, createCourse, updateCourse, deleteCourse } from '../../api/courses';
import { listMentors } from '../../api/mentors';
import { resolveIcon } from '../../utils/iconMap';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import LocalizedField from '../../components/admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';

const ICON_KEYS: string[] = ['Monitor', 'Server', 'Shield', 'Smartphone', 'Database', 'Cloud', 'BookOpen'];
const LEVELS: { value: string; label: string }[] = [
  { value: 'BEGINNER', label: "Boshlang'ich" },
  { value: 'INTERMEDIATE', label: "O'rta" },
  { value: 'ADVANCED', label: 'Yuqori' },
];
const PRESETS: { name: string; color: string; bg: string; border: string }[] = [
  { name: "Ko'k",      color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd' },
  { name: 'Binafsha',  color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff' },
  { name: 'Yashil',    color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  { name: 'Amber',     color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  { name: 'Pushti',    color:'#db2777', bg:'#fdf2f8', border:'#fbcfe8' },
];

interface CourseFormState {
  id?: string;
  title: LocalizedString;
  subtitle: LocalizedString;
  description: LocalizedString;
  iconKey: string;
  preset: number;
  price: number;
  durationMonths: number;
  level: string;
  tags: string;
  published: boolean;
  mentorId: string;
}

interface Mentor {
  id: string;
  name: string;
}

interface Course {
  id: string;
  title: LocalizedString;
  subtitle?: LocalizedString | null;
  description: LocalizedString;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  price: number | string;
  durationMonths: number;
  level: string;
  tags?: string[];
  published: boolean;
  mentorId?: string;
  mentor?: { name: string };
  isFree?: boolean;
}

const emptyForm: CourseFormState = {
  title: emptyLocalizedString(), subtitle: emptyLocalizedString(), description: emptyLocalizedString(), iconKey:'BookOpen', preset:0,
  price:0, durationMonths:1, level:'BEGINNER', tags:'', published:false, mentorId:'',
};

interface CourseFormProps {
  initial: CourseFormState;
  mentors: Mentor[];
  onCancel: () => void;
  onSaved: () => void;
}

function CourseForm({ initial, mentors, onCancel, onSaved }: CourseFormProps): React.ReactElement {
  const [form, setForm]     = useState<CourseFormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError]   = useState<string>('');

  const change = (field: keyof CourseFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    const preset = PRESETS[form.preset] || PRESETS[0];
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
      iconKey: form.iconKey,
      color: preset.color, bg: preset.bg, border: preset.border,
      price: Number(form.price) || 0,
      durationMonths: Number(form.durationMonths) || 1,
      level: form.level,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      published: form.published,
      mentorId: form.mentorId || null,
    };
    try {
      if (form.id) {
        await updateCourse(form.id, payload);
      } else {
        await createCourse(payload);
      }
      onSaved();
    } catch (err: unknown) {
      setError((err as Error).message || 'Xatolik yuz berdi');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ padding:24, marginBottom:20, display:'flex', flexDirection:'column', gap:12 }}>
      {status === 'error' && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca' }}>
          <AlertCircle size={15} style={{ color:'#dc2626' }} />
          <p style={{ fontSize:13, color:'#dc2626' }}>{error}</p>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <LocalizedField label="Sarlavha" required value={form.title} onChange={(next) => setForm((f) => ({ ...f, title: next }))} />
        <LocalizedField label="Subtitr" value={form.subtitle} onChange={(next) => setForm((f) => ({ ...f, subtitle: next }))} />
      </div>
      <LocalizedField label="Tavsif" required multiline value={form.description} onChange={(next) => setForm((f) => ({ ...f, description: next }))} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Ikonka</label>
          <select className="inp" value={form.iconKey} onChange={change('iconKey')}>
            {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Rang</label>
          <select className="inp" value={form.preset} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((f) => ({ ...f, preset: Number(e.target.value) }))}>
            {PRESETS.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Daraja</label>
          <select className="inp" value={form.level} onChange={change('level')}>
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Narx (UZS, bepul = 0)</label>
          <input className="inp" type="number" min="0" value={form.price} onChange={change('price')} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Davomiylik (oy)</label>
          <input className="inp" type="number" min="1" value={form.durationMonths} onChange={change('durationMonths')} required />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Mentor</label>
          <select className="inp" value={form.mentorId} onChange={change('mentorId')}>
            <option value="">Tanlanmagan</option>
            {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Teglar (vergul bilan)</label>
        <input className="inp" value={form.tags} onChange={change('tags')} placeholder="React, TypeScript, ..." />
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#334155', cursor:'pointer' }}>
        <input type="checkbox" checked={form.published} onChange={change('published')} /> Chop etilgan (saytda ko'rinadi)
      </label>
      <div style={{ display:'flex', gap:10, marginTop:6 }}>
        <button type="submit" disabled={status==='loading'} className="btn-primary" style={{ opacity: status==='loading'?0.7:1 }}>
          {status==='loading' ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">Bekor qilish</button>
      </div>
    </form>
  );
}

export default function AdminCoursesPage(): React.ReactElement {
  const [courses, setCourses] = useState<Course[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [status, setStatus]   = useState<'loading' | 'ready' | 'error'>('loading');
  const [editing, setEditing] = useState<CourseFormState | null>(null);

  const load = (): void => {
    setStatus('loading');
    Promise.all([listCoursesAdmin(), listMentors()])
      .then(([c, m]: [Course[], Mentor[]]) => { setCourses(c); setMentors(m); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (course: Course): void => {
    const presetIdx = Math.max(0, PRESETS.findIndex((p) => p.color === course.color));
    setEditing({
      id: course.id, title: course.title, subtitle: course.subtitle || emptyLocalizedString(), description: course.description,
      iconKey: course.iconKey, preset: presetIdx === -1 ? 0 : presetIdx, price: Number(course.price) || 0,
      durationMonths: course.durationMonths, level: course.level, tags: (course.tags || []).join(', '),
      published: course.published, mentorId: course.mentorId || '',
    });
  };

  const remove = async (id: string): Promise<void> => {
    if (!window.confirm("Kursni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteCourse(id);
      load();
    } catch (err: unknown) {
      alert((err as Error).message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Kurslar" sub="Kurslarni yaratish, tahrirlash va dasturini boshqarish"
        actions={
          !editing ? (
            <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ fontSize:13 }}>
              <Plus size={15}/> Yangi kurs
            </button>
          ) : undefined
        } />

      {editing && (
        <CourseForm initial={editing} mentors={mentors} onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }} />
      )}

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {courses.map((c) => {
            const Icon = resolveIcon(c.iconKey);
            return (
              <div key={c.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:c.bg, border:`1.5px solid ${c.border}`, flexShrink:0 }}>
                  <Icon size={18} style={{ color:c.color }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{c.title.uz}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>
                    {c.mentor?.name || "Mentor yo'q"} · {c.isFree ? 'Bepul' : `${Number(c.price).toLocaleString('uz-UZ')} UZS`}
                  </p>
                </div>
                <span className="tag" style={{ background: c.published ? '#f0fdf4' : '#f8fafc', borderColor: c.published ? '#bbf7d0' : '#e2e8f0', color: c.published ? '#16a34a' : '#94a3b8' }}>
                  {c.published ? 'Chop etilgan' : 'Qoralama'}
                </span>
                <Link to={`/admin/courses/${c.id}/curriculum`} title="Kurs dasturi (modul/darslar)"
                  style={{ display:'flex', alignItems:'center', gap:6, height:32, padding:'0 10px', borderRadius:8, border:'1px solid #bae6fd', background:'#f0f9ff', color:'#0ea5e9', fontSize:12, fontWeight:700, textDecoration:'none' }}>
                  <ListTree size={14}/> Dastur
                </Link>
                <button onClick={() => startEdit(c)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>
                  <Pencil size={14}/>
                </button>
                <button onClick={() => remove(c.id)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
