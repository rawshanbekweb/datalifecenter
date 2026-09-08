import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Gamepad2, EyeOff, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listGamesAdmin, createGame, updateGame, deleteGame } from '../../api/games';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast, useConfirm } from '../../components/common/Feedback';
import FileUpload from '../../components/common/FileUpload';
import LocalizedField from '../../components/admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';
import Loading from '../../components/common/Loading';

interface GameFormState {
  id?: string;
  title: LocalizedString;
  description: LocalizedString;
  logoUrl: string;
  apkUrl: string;
  version: string;
  featured: boolean;
  published: boolean;
}

interface Game {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  logoUrl: string;
  apkUrl: string;
  version: string;
  downloadsCount: number;
  featured: boolean;
  published: boolean;
  [key: string]: unknown;
}

type Status = 'loading' | 'ready' | 'error';

const emptyForm: GameFormState = {
  title: emptyLocalizedString(), description: emptyLocalizedString(),
  logoUrl: '', apkUrl: '', version: '', featured: false, published: true,
};

interface GameFormProps {
  initial: GameFormState;
  onCancel: () => void;
  onSaved: () => void;
}

function GameForm({ initial, onCancel, onSaved }: GameFormProps): React.ReactElement {
  const { t } = useTranslation();
  const [form, setForm]     = useState<GameFormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError]   = useState<string>('');

  const change = (field: keyof GameFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    const payload = {
      title: form.title,
      description: form.description,
      logoUrl: form.logoUrl,
      apkUrl: form.apkUrl,
      version: form.version,
      featured: form.featured,
      published: form.published,
    };
    try {
      if (form.id) {
        await updateGame(form.id, payload);
      } else {
        await createGame(payload);
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
      <div className="form-row">
        <LocalizedField label={t('admin.form.titleField')} required value={form.title} onChange={(next) => setForm((f) => ({ ...f, title: next }))} />
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>{t('admin.games.fVersion')}</label>
          <input className="inp" value={form.version} onChange={change('version')} required placeholder="1.0.0" />
        </div>
      </div>
      <LocalizedField label={t('admin.form.descField')} required multiline value={form.description} onChange={(next) => setForm((f) => ({ ...f, description: next }))} />
      <FileUpload kind="image" label={t('admin.games.fLogo')} required value={form.logoUrl}
        onChange={(url) => setForm((f: GameFormState) => ({ ...f, logoUrl: url }))} />
      <FileUpload kind="apk" label={t('admin.games.fApk')} required value={form.apkUrl}
        onChange={(url) => setForm((f: GameFormState) => ({ ...f, apkUrl: url }))} />
      <div style={{ display: 'flex', gap: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.featured} onChange={change('featured')} /> {t('admin.games.featuredCheck')}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.published} onChange={change('published')} /> {t('admin.games.publishedCheck')}
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

export default function AdminGamesPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const [games, setGames]     = useState<Game[]>([]);
  const [status, setStatus]   = useState<Status>('loading');
  const [editing, setEditing] = useState<GameFormState | null>(null);

  const load = (): void => {
    setStatus('loading');
    listGamesAdmin().then((data) => { setGames(data as Game[]); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (g: Game): void => setEditing({
    id: g.id, title: g.title, description: g.description,
    logoUrl: g.logoUrl, apkUrl: g.apkUrl, version: g.version,
    featured: g.featured, published: g.published,
  });

  const remove = async (id: string): Promise<void> => {
    if (!(await confirm(t('admin.games.confirmDelete'), { danger: true }))) return;
    try {
      await deleteGame(id);
      load();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.games.title')} sub={t('admin.games.sub')}
        actions={
          !editing ? (
            <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ fontSize: 13 }}>
              <Plus size={15} /> {t('admin.games.newBtn')}
            </button>
          ) : undefined
        } />

      {editing && <GameForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {games.map((g) => (
            <div key={g.id} className="card admin-row">
              {g.logoUrl ? (
                <img src={g.logoUrl} alt={g.title.uz} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Gamepad2 size={18} style={{ color: '#0ea5e9' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{g.title.uz}</p>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>v{g.version}</p>
              </div>
              <span className="tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={11} /> {g.downloadsCount}
              </span>
              {g.featured && <span className="tag" style={{ background: '#faf5ff', borderColor: '#e9d5ff', color: '#9333ea' }}>{t('admin.tags.featured')}</span>}
              {!g.published && (
                <span className="tag" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EyeOff size={11} /> {t('admin.tags.hidden')}
                </span>
              )}
              <button onClick={() => startEdit(g)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(g.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {games.length === 0 && (
            <div className="card" style={{ padding: 36, textAlign: 'center' }}>
              <Gamepad2 size={28} style={{ color: '#cbd5e1', marginBottom: 10 }} />
              <p style={{ color: '#64748b', fontSize: 14 }}>{t('admin.games.empty')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
