import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Star, EyeOff } from 'lucide-react';
import { listTestimonialsAdmin, createTestimonial, updateTestimonial, deleteTestimonial } from '../../api/testimonials';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import FileUpload from '../../components/common/FileUpload';

interface TestimonialFormState {
  id?: string;
  name: string;
  role: string;
  avatarUrl: string;
  text: string;
  rating: number;
  published: boolean;
  order: number;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  text: string;
  rating: number;
  published: boolean;
  order: number;
  [key: string]: unknown;
}

type Status = 'loading' | 'ready' | 'error';

const emptyForm: TestimonialFormState = { name:'', role:'', avatarUrl:'', text:'', rating:5, published:true, order:0 };

interface TestimonialFormProps {
  initial: TestimonialFormState;
  onCancel: () => void;
  onSaved: () => void;
}

function TestimonialForm({ initial, onCancel, onSaved }: TestimonialFormProps): React.ReactElement {
  const [form, setForm]     = useState<TestimonialFormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError]   = useState<string>('');

  const change = (field: keyof TestimonialFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked
      : e.target.type === 'number' ? Number(e.target.value)
      : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    try {
      if (form.id) {
        await updateTestimonial(form.id, form);
      } else {
        await createTestimonial(form);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
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
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Ism *</label>
          <input className="inp" value={form.name} onChange={change('name')} required />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Lavozim / tavsif *</label>
          <input className="inp" value={form.role} onChange={change('role')} required placeholder="Frontend dasturchi, ... bitiruvchisi" />
        </div>
      </div>
      <div>
        <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Sharh matni *</label>
        <textarea className="inp" value={form.text} onChange={change('text')} required rows={3} style={{ resize:'none' }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <FileUpload kind="image" label="Rasm (ixtiyoriy)" value={form.avatarUrl}
          onChange={(url) => setForm((f: TestimonialFormState) => ({ ...f, avatarUrl: url }))} />
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Reyting (1-5)</label>
          <input className="inp" type="number" min={1} max={5} value={form.rating} onChange={change('rating')} />
        </div>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#334155', cursor:'pointer' }}>
        <input type="checkbox" checked={form.published} onChange={change('published')} /> Saytda ko'rsatilsin (nashr qilingan)
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

export default function AdminTestimonialsPage(): React.ReactElement {
  const [items, setItems]     = useState<Testimonial[]>([]);
  const [status, setStatus]   = useState<Status>('loading');
  const [editing, setEditing] = useState<TestimonialFormState | null>(null);

  const load = (): void => {
    setStatus('loading');
    listTestimonialsAdmin().then((data) => { setItems(data as Testimonial[]); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (t: Testimonial): void => setEditing({
    id: t.id, name: t.name, role: t.role, avatarUrl: t.avatarUrl || '', text: t.text, rating: t.rating, published: t.published, order: t.order,
  });

  const remove = async (id: string): Promise<void> => {
    if (!window.confirm("Sharhni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteTestimonial(id);
      load();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const togglePublished = async (t: Testimonial): Promise<void> => {
    try {
      await updateTestimonial(t.id, { published: !t.published });
      load();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Sharhlar" sub="Bosh sahifadagi talaba sharhlarini boshqarish"
        actions={
          !editing ? (
            <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ fontSize:13 }}>
              <Plus size={15}/> Yangi sharh
            </button>
          ) : undefined
        } />

      {editing && <TestimonialForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {items.map((t) => (
            <div key={t.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f9ff', border:'1.5px solid #bae6fd', flexShrink:0, fontWeight:800, color:'#0ea5e9' }}>
                {t.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{t.name}</p>
                <p style={{ fontSize:12, color:'#94a3b8' }}>{t.role}</p>
              </div>
              <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={13} fill={idx < t.rating ? '#f59e0b' : 'none'} style={{ color:'#f59e0b' }} />
                ))}
              </div>
              {!t.published && (
                <span className="tag" style={{ background:'#f8fafc', borderColor:'#e2e8f0', color:'#64748b', display:'flex', alignItems:'center', gap:4 }}>
                  <EyeOff size={11}/> Nashr qilinmagan
                </span>
              )}
              <button onClick={() => togglePublished(t)} className="btn-outline" style={{ fontSize:12, padding:'8px 12px' }}>
                {t.published ? 'Yashirish' : "Nashr qilish"}
              </button>
              <button onClick={() => startEdit(t)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>
                <Pencil size={14}/>
              </button>
              <button onClick={() => remove(t.id)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="card" style={{ padding:36, textAlign:'center' }}>
              <p style={{ color:'#64748b', fontSize:14 }}>Sharhlar topilmadi.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
