import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, LayoutGrid, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listProjectsAdmin, createProject, updateProject, deleteProject } from '../../api/projects';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import FileUpload from '../../components/common/FileUpload';
import LocalizedField from '../../components/admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';

interface ProjectFormState {
  id?: string;
  title: LocalizedString;
  category: string;
  description: LocalizedString;
  techStackText: string;
  screenshotUrl: string;
  liveUrl: string;
  repoUrl: string;
  liveEmbed: boolean;
  featured: boolean;
  published: boolean;
}

interface Project {
  id: string;
  title: LocalizedString;
  category: string;
  description: LocalizedString;
  techStack: string[];
  screenshotUrl: string;
  liveUrl?: string | null;
  repoUrl?: string | null;
  liveEmbed: boolean;
  featured: boolean;
  published: boolean;
  [key: string]: unknown;
}

type Status = 'loading' | 'ready' | 'error';

const emptyForm: ProjectFormState = {
  title: emptyLocalizedString(), category: '', description: emptyLocalizedString(), techStackText: '',
  screenshotUrl: '/projects/placeholder-screenshot.svg', liveUrl: '', repoUrl: '', liveEmbed: false, featured: false, published: true,
};

interface ProjectFormProps {
  initial: ProjectFormState;
  onCancel: () => void;
  onSaved: () => void;
}

function ProjectForm({ initial, onCancel, onSaved }: ProjectFormProps): React.ReactElement {
  const { t } = useTranslation();
  const [form, setForm]     = useState<ProjectFormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError]   = useState<string>('');

  const change = (field: keyof ProjectFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description,
      techStack: form.techStackText.split(',').map((t) => t.trim()).filter(Boolean),
      screenshotUrl: form.screenshotUrl,
      liveUrl: form.liveUrl || undefined,
      repoUrl: form.repoUrl || undefined,
      liveEmbed: !!form.liveUrl && form.liveEmbed,
      featured: form.featured,
      published: form.published,
    };
    try {
      if (form.id) {
        await updateProject(form.id, payload);
      } else {
        await createProject(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || t('common.error'));
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ padding: 24, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
          <AlertCircle size={15} style={{ color: '#dc2626' }} />
          <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <LocalizedField label={t('admin.form.titleField')} required value={form.title} onChange={(next) => setForm((f) => ({ ...f, title: next }))} />
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>{t('admin.form.categoryReq')}</label>
          <input className="inp" value={form.category} onChange={change('category')} required placeholder={t('admin.projects.categoryPlaceholder')} />
        </div>
      </div>
      <LocalizedField label={t('admin.form.descField')} required multiline value={form.description} onChange={(next) => setForm((f) => ({ ...f, description: next }))} />
      <div>
        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>{t('admin.projects.fTech')}</label>
        <input className="inp" value={form.techStackText} onChange={change('techStackText')} required placeholder={t('admin.projects.techPlaceholder')} />
      </div>
      <FileUpload kind="image" label={t('admin.projects.fScreenshot')} required value={form.screenshotUrl}
        onChange={(url) => setForm((f: ProjectFormState) => ({ ...f, screenshotUrl: url }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>{t('admin.projects.fLiveUrl')}</label>
          <input className="inp" value={form.liveUrl} onChange={change('liveUrl')} placeholder="https://..." />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>{t('admin.projects.fRepoUrl')}</label>
          <input className="inp" value={form.repoUrl} onChange={change('repoUrl')} placeholder="https://github.com/..." />
        </div>
      </div>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: form.liveUrl ? 'pointer' : 'not-allowed', opacity: form.liveUrl ? 1 : 0.5 }}>
          <input type="checkbox" checked={form.liveEmbed} disabled={!form.liveUrl} onChange={change('liveEmbed')} />
          {t('admin.projects.liveEmbedCheck')}
        </label>
        <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>
          {t('admin.projects.liveEmbedHint')}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.featured} onChange={change('featured')} /> {t('admin.projects.featuredCheck')}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.published} onChange={change('published')} /> {t('admin.projects.publishedCheck')}
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button type="submit" disabled={status === 'loading'} className="btn-primary" style={{ opacity: status === 'loading' ? 0.7 : 1 }}>
          {status === 'loading' ? t('common.saving') : t('common.save')}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">{t('common.cancel')}</button>
      </div>
    </form>
  );
}

export default function AdminProjectsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus]     = useState<Status>('loading');
  const [editing, setEditing]   = useState<ProjectFormState | null>(null);

  const load = (): void => {
    setStatus('loading');
    listProjectsAdmin().then((data) => { setProjects(data as Project[]); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (p: Project): void => setEditing({
    id: p.id, title: p.title, category: p.category, description: p.description,
    techStackText: p.techStack.join(', '), screenshotUrl: p.screenshotUrl,
    liveUrl: p.liveUrl || '', repoUrl: p.repoUrl || '', liveEmbed: p.liveEmbed, featured: p.featured, published: p.published,
  });

  const remove = async (id: string): Promise<void> => {
    if (!window.confirm(t('admin.projects.confirmDelete'))) return;
    try {
      await deleteProject(id);
      load();
    } catch (err: any) {
      alert(err.message || t('common.error'));
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.projects.title')} sub={t('admin.projects.sub')}
        actions={
          !editing ? (
            <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ fontSize: 13 }}>
              <Plus size={15} /> {t('admin.projects.newBtn')}
            </button>
          ) : undefined
        } />

      {editing && <ProjectForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map((p) => (
            <div key={p.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <img src={p.screenshotUrl} alt={p.title.uz} style={{ width: 64, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{p.title.uz}</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{p.category}</p>
              </div>
              {p.featured && <span className="tag" style={{ background: '#faf5ff', borderColor: '#e9d5ff', color: '#9333ea' }}>{t('admin.tags.featured')}</span>}
              {p.liveEmbed && <span className="tag" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>{t('admin.tags.live')}</span>}
              {!p.published && (
                <span className="tag" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EyeOff size={11} /> {t('admin.tags.hidden')}
                </span>
              )}
              <button onClick={() => startEdit(p)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(p.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="card" style={{ padding: 36, textAlign: 'center' }}>
              <LayoutGrid size={28} style={{ color: '#cbd5e1', marginBottom: 10 }} />
              <p style={{ color: '#64748b', fontSize: 14 }}>{t('admin.projects.empty')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
