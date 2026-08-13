import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Camera, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listMomentsAdmin, createMoment, updateMoment, deleteMoment } from '../../api/moments';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast, useConfirm } from '../../components/common/Feedback';
import FileUpload from '../../components/common/FileUpload';
import ImageFocusPicker from '../../components/common/ImageFocusPicker';
import LocalizedField from '../../components/admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';
import { DEFAULT_FOCUS } from '../../utils/imageFocus';
import Loading from '../../components/common/Loading';

interface MomentFormState {
  id?: string;
  imageUrl: string;
  focusX: number;
  focusY: number;
  title: LocalizedString;
  caption: LocalizedString;
  happenedAt: string;
  order: number;
  published: boolean;
}

interface Moment {
  id: string;
  imageUrl: string;
  focusX: number;
  focusY: number;
  title: LocalizedString;
  caption?: LocalizedString | null;
  happenedAt?: string | null;
  order: number;
  published: boolean;
}

type Status = 'loading' | 'ready' | 'error';

const emptyForm: MomentFormState = {
  imageUrl: '', focusX: DEFAULT_FOCUS, focusY: DEFAULT_FOCUS,
  title: emptyLocalizedString(), caption: emptyLocalizedString(),
  happenedAt: '', order: 0, published: true,
};

// `happenedAt` bazada to'liq ISO vaqt, formada esa <input type="date"> —
// shuning uchun kun qismigacha qirqiladi
const toDateInput = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : '');

// Bo'sh tarjima obyektini yubormaslik uchun: hech bir tilda matn bo'lmasa null
const captionOrNull = (c: LocalizedString): LocalizedString | null =>
  Object.values(c).some((v) => typeof v === 'string' && v.trim() !== '') ? c : null;

interface MomentFormProps {
  initial: MomentFormState;
  onCancel: () => void;
  onSaved: () => void;
}

function MomentForm({ initial, onCancel, onSaved }: MomentFormProps): React.ReactElement {
  const { t } = useTranslation();
  const [form, setForm] = useState<MomentFormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    const payload = {
      imageUrl: form.imageUrl,
      focusX: form.focusX,
      focusY: form.focusY,
      title: form.title,
      caption: captionOrNull(form.caption),
      happenedAt: form.happenedAt || null,
      order: Number(form.order) || 0,
      published: form.published,
    };
    try {
      if (form.id) {
        await updateMoment(form.id, payload);
      } else {
        await createMoment(payload);
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

      <FileUpload kind="image" label={t('admin.moments.fImage')} required value={form.imageUrl}
        onChange={(url) => setForm((f: MomentFormState) => ({ ...f, imageUrl: url }))} />
      <ImageFocusPicker url={form.imageUrl} focusX={form.focusX} focusY={form.focusY}
        onChange={(focusX, focusY) => setForm((f) => ({ ...f, focusX, focusY }))} />

      <LocalizedField label={t('admin.form.titleField')} required value={form.title}
        onChange={(next) => setForm((f) => ({ ...f, title: next }))} />
      <LocalizedField label={t('admin.moments.fCaption')} multiline value={form.caption}
        onChange={(next) => setForm((f) => ({ ...f, caption: next }))} />

      <div className="form-row">
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>{t('admin.moments.fDate')}</label>
          <input className="inp" type="date" value={form.happenedAt}
            onChange={(e) => setForm((f) => ({ ...f, happenedAt: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>{t('admin.moments.fOrder')}</label>
          <input className="inp" type="number" value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.published}
          onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
        {t('admin.moments.publishedCheck')}
      </label>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button type="submit" disabled={status === 'loading' || !form.imageUrl} className="btn-primary"
          style={{ opacity: status === 'loading' || !form.imageUrl ? 0.7 : 1 }}>
          {status === 'loading' ? t('common.saving') : t('common.save')}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">{t('common.cancel')}</button>
      </div>
    </form>
  );
}

export default function AdminMomentsPage(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [editing, setEditing] = useState<MomentFormState | null>(null);

  const load = (): void => {
    setStatus('loading');
    listMomentsAdmin()
      .then((data) => { setMoments(data as Moment[]); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (m: Moment): void => setEditing({
    id: m.id, imageUrl: m.imageUrl, focusX: m.focusX, focusY: m.focusY,
    title: m.title, caption: m.caption ?? emptyLocalizedString(),
    happenedAt: toDateInput(m.happenedAt), order: m.order, published: m.published,
  });

  const remove = async (id: string): Promise<void> => {
    if (!(await confirm(t('admin.moments.confirmDelete'), { danger: true }))) return;
    try {
      await deleteMoment(id);
      load();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.moments.title')} sub={t('admin.moments.sub')}
        actions={
          !editing ? (
            <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ fontSize: 13 }}>
              <Plus size={15} /> {t('admin.moments.newBtn')}
            </button>
          ) : undefined
        } />

      {editing && <MomentForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && moments.length === 0 && !editing && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <Camera size={26} style={{ color: '#94a3b8', marginBottom: 10 }} />
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{t('admin.moments.empty')}</p>
        </div>
      )}

      {status === 'ready' && moments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 16 }}>
          {moments.map((m: Moment) => (
            <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: m.published ? 1 : 0.6 }}>
              <div style={{ position: 'relative', aspectRatio: '4 / 5', background: '#f1f5f9' }}>
                <img src={m.imageUrl} alt="" style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  objectPosition: `${m.focusX}% ${m.focusY}%`, display: 'block',
                }} />
                {!m.published && (
                  <span style={{
                    position: 'absolute', top: 8, left: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 9px', borderRadius: 999, background: 'rgba(15,23,42,0.65)', color: '#fff', fontSize: 11,
                  }}>
                    <EyeOff size={11} /> {t('admin.moments.hidden')}
                  </span>
                )}
              </div>
              <div style={{ padding: 14 }}>
                {m.happenedAt && (
                  <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>
                    {new Date(m.happenedAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{m.title.uz}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => startEdit(m)} className="btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}>
                    <Pencil size={13} /> {t('common.edit')}
                  </button>
                  <button onClick={() => remove(m.id)} className="btn-outline"
                    style={{ fontSize: 12, padding: '6px 12px', color: '#dc2626', borderColor: '#fecaca' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
