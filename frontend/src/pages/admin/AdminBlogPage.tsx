import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listBlogPostsAdmin, createBlogPost, updateBlogPost, deleteBlogPost } from '../../api/blog';
import { resolveIcon } from '../../utils/iconMap';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import LocalizedField from '../../components/admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';

const ICON_KEYS: string[] = ['BookOpen', 'Shield', 'Map', 'Monitor', 'Server', 'Database', 'Cloud'];
// nameKey — rang nomi til bo'yicha t() bilan chiqadi; color/bg/border DB'ga yoziladi
const PRESETS: { nameKey: string; color: string; bg: string; border: string }[] = [
  { nameKey: 'admin.colors.blue',   color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd' },
  { nameKey: 'admin.colors.purple', color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff' },
  { nameKey: 'admin.colors.green',  color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  { nameKey: 'admin.colors.amber',  color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  { nameKey: 'admin.colors.pink',   color:'#db2777', bg:'#fdf2f8', border:'#fbcfe8' },
];

interface BlogFormState {
  id?: string | number;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: LocalizedString;
  category: string;
  iconKey: string;
  preset: number;
  readMinutes: number | string;
  tags: string;
  published: boolean;
}

interface BlogPost {
  id: string | number;
  title: LocalizedString;
  excerpt: LocalizedString;
  content: LocalizedString;
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
  title: emptyLocalizedString(), excerpt: emptyLocalizedString(), content: emptyLocalizedString(), category:'', iconKey:'BookOpen', preset:0,
  readMinutes:5, tags:'', published:false,
};

interface BlogFormProps {
  initial: BlogFormState;
  onCancel: () => void;
  onSaved: () => void;
}

function BlogForm({ initial, onCancel, onSaved }: BlogFormProps): React.ReactElement {
  const { t } = useTranslation();
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
      setError(err.message || t('common.error'));
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
      <LocalizedField label={t('admin.form.titleField')} required value={form.title} onChange={(next) => setForm((f) => ({ ...f, title: next }))} />
      <LocalizedField label={t('admin.blog.fExcerpt')} required multiline rows={2} value={form.excerpt} onChange={(next) => setForm((f) => ({ ...f, excerpt: next }))} />
      <LocalizedField label={t('admin.blog.fContent')} required multiline rows={6} value={form.content} onChange={(next) => setForm((f) => ({ ...f, content: next }))} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.form.categoryReq')}</label>
          <input className="inp" value={form.category} onChange={change('category')} required placeholder={t('admin.blog.categoryPlaceholder')} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.form.iconLabel')}</label>
          <select className="inp" value={form.iconKey} onChange={change('iconKey')}>
            {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.form.colorLabel')}</label>
          <select className="inp" value={form.preset} onChange={(e) => setForm((f) => ({ ...f, preset: Number(e.target.value) }))}>
            {PRESETS.map((p, i) => <option key={p.nameKey} value={i}>{t(p.nameKey)}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.blog.fReadTime')}</label>
          <input className="inp" type="number" min="1" value={form.readMinutes} onChange={change('readMinutes')} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.blog.fTags')}</label>
          <input className="inp" value={form.tags} onChange={change('tags')} placeholder={t('admin.blog.tagsPlaceholder')} />
        </div>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#334155', cursor:'pointer' }}>
        <input type="checkbox" checked={form.published} onChange={change('published')} /> {t('admin.blog.published')}
      </label>
      <div style={{ display:'flex', gap:10, marginTop:6 }}>
        <button type="submit" disabled={status==='loading'} className="btn-primary" style={{ opacity: status==='loading'?0.7:1 }}>
          {status==='loading' ? t('common.saving') : t('common.save')}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">{t('common.cancel')}</button>
      </div>
    </form>
  );
}

export default function AdminBlogPage(): React.ReactElement {
  const { t } = useTranslation();
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
    if (!window.confirm(t('admin.blog.confirmDelete'))) return;
    try {
      await deleteBlogPost(id);
      load();
    } catch (err: any) {
      alert(err.message || t('common.error'));
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.blog.title')} sub={t('admin.blog.sub')}
        actions={
          !editing ? (
            <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ fontSize:13 }}>
              <Plus size={15}/> {t('admin.blog.newBtn')}
            </button>
          ) : undefined
        } />

      {editing && <BlogForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

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
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{p.title.uz}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{p.category} · {t('admin.blog.viewsCount', { n: p.views })}</p>
                </div>
                <span className="tag" style={{ background: p.published ? '#f0fdf4' : '#f8fafc', borderColor: p.published ? '#bbf7d0' : '#e2e8f0', color: p.published ? '#16a34a' : '#94a3b8' }}>
                  {p.published ? t('admin.tags.published') : t('admin.tags.draft')}
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
