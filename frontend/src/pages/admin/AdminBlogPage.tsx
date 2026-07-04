import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { listBlogPostsAdmin, createBlogPost, updateBlogPost, deleteBlogPost } from '../../api/blog';
import { resolveIcon } from '../../utils/iconMap';

const ICON_KEYS: string[] = ['BookOpen', 'Shield', 'Map', 'Monitor', 'Server', 'Database', 'Cloud'];
const PRESETS: { name: string; color: string; bg: string; border: string }[] = [
  { name: "Ko'k",      color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd' },
  { name: 'Binafsha',  color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff' },
  { name: 'Yashil',    color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  { name: 'Amber',     color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  { name: 'Pushti',    color:'#db2777', bg:'#fdf2f8', border:'#fbcfe8' },
];

interface BlogFormState {
  id?: string | number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  iconKey: string;
  preset: number;
  readMinutes: number | string;
  tags: string;
  published: boolean;
}

interface BlogPost {
  id: string | number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  readMinutes: number;
  tags?: string[];
  published: boolean;
  views: number;
  [key: string]: unknown;
}

type Status = 'loading' | 'ready' | 'error';

const emptyForm: BlogFormState = {
  title:'', excerpt:'', content:'', category:'', iconKey:'BookOpen', preset:0,
  readMinutes:5, tags:'', published:false,
};

interface BlogFormProps {
  initial: BlogFormState;
  onCancel: () => void;
  onSaved: () => void;
}

function BlogForm({ initial, onCancel, onSaved }: BlogFormProps): React.ReactElement {
  const [form, setForm]     = useState<BlogFormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError]   = useState<string>('');

  const change = (field: keyof BlogFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const val = target.type === 'checkbox' ? target.checked : target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    const preset = PRESETS[form.preset] || PRESETS[0];
    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      category: form.category,
      iconKey: form.iconKey,
      color: preset.color, bg: preset.bg, border: preset.border,
      readMinutes: Number(form.readMinutes) || 5,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      published: form.published,
    };
    try {
      if (form.id) {
        await updateBlogPost(form.id, payload);
      } else {
        await createBlogPost(payload);
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
      <div>
        <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Sarlavha *</label>
        <input className="inp" value={form.title} onChange={change('title')} required />
      </div>
      <div>
        <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Qisqacha mazmun *</label>
        <textarea className="inp" rows={2} value={form.excerpt} onChange={change('excerpt')} required style={{ resize:'none' }} />
      </div>
      <div>
        <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Matn *</label>
        <textarea className="inp" rows={6} value={form.content} onChange={change('content')} required style={{ resize:'none' }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Kategoriya *</label>
          <input className="inp" value={form.category} onChange={change('category')} required placeholder="Tutorial" />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Ikonka</label>
          <select className="inp" value={form.iconKey} onChange={change('iconKey')}>
            {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Rang</label>
          <select className="inp" value={form.preset} onChange={(e) => setForm((f) => ({ ...f, preset: Number(e.target.value) }))}>
            {PRESETS.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>O'qish vaqti (daqiqa)</label>
          <input className="inp" type="number" min="1" value={form.readMinutes} onChange={change('readMinutes')} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Teglar (vergul bilan)</label>
          <input className="inp" value={form.tags} onChange={change('tags')} placeholder="React, JavaScript" />
        </div>
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

export default function AdminBlogPage(): React.ReactElement {
  const [posts, setPosts]     = useState<BlogPost[]>([]);
  const [status, setStatus]   = useState<Status>('loading');
  const [editing, setEditing] = useState<BlogFormState | null>(null);

  const load = (): void => {
    setStatus('loading');
    listBlogPostsAdmin().then((data) => { setPosts(data as BlogPost[]); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (p: BlogPost): void => {
    const presetIdx = Math.max(0, PRESETS.findIndex((preset) => preset.color === p.color));
    setEditing({
      id: p.id, title: p.title, excerpt: p.excerpt, content: p.content, category: p.category,
      iconKey: p.iconKey, preset: presetIdx === -1 ? 0 : presetIdx, readMinutes: p.readMinutes,
      tags: (p.tags || []).join(', '), published: p.published,
    });
  };

  const remove = async (id: string | number): Promise<void> => {
    if (!window.confirm("Maqolani o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteBlogPost(id);
      load();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div>
      {!editing && (
        <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ marginBottom:20 }}>
          <Plus size={15}/> Yangi maqola
        </button>
      )}

      {editing && <BlogForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {posts.map((p) => {
            const Icon = resolveIcon(p.iconKey);
            return (
              <div key={p.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:p.bg, border:`1.5px solid ${p.border}`, flexShrink:0 }}>
                  <Icon size={18} style={{ color:p.color }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{p.title}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{p.category} · {p.views} ko'rish</p>
                </div>
                <span className="tag" style={{ background: p.published ? '#f0fdf4' : '#f8fafc', borderColor: p.published ? '#bbf7d0' : '#e2e8f0', color: p.published ? '#16a34a' : '#94a3b8' }}>
                  {p.published ? 'Chop etilgan' : 'Qoralama'}
                </span>
                <button onClick={() => startEdit(p)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>
                  <Pencil size={14}/>
                </button>
                <button onClick={() => remove(p.id)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }}>
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
