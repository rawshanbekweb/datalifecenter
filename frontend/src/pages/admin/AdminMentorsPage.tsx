import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listMentorsAdmin, createMentor, updateMentor, deleteMentor } from '../../api/mentors';
import { listUsers, AdminUser } from '../../api/users';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import FileUpload from '../../components/common/FileUpload';
import LocalizedField from '../../components/admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';

interface MentorFormState {
  id?: string | number;
  name: string;
  bio: LocalizedString;
  specialty: LocalizedString;
  photoUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  telegramUrl: string;
  featured: boolean;
  userId: string;
}

interface Mentor {
  id: string | number;
  name: string;
  bio: LocalizedString;
  specialty: LocalizedString;
  photoUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  telegramUrl?: string | null;
  featured: boolean;
  userId?: string | null;
  courses?: { id: string | number }[];
  [key: string]: unknown;
}

type Status = 'loading' | 'ready' | 'error';

const emptyForm: MentorFormState = { name:'', bio: emptyLocalizedString(), specialty: emptyLocalizedString(), photoUrl:'', linkedinUrl:'', githubUrl:'', telegramUrl:'', featured:false, userId:'' };

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

interface MentorFormProps {
  initial: MentorFormState;
  users: AdminUser[];
  onCancel: () => void;
  onSaved: () => void;
}

function MentorForm({ initial, users, onCancel, onSaved }: MentorFormProps): React.ReactElement {
  const { t } = useTranslation();
  const [form, setForm]     = useState<MentorFormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError]   = useState<string>('');

  const change = (field: keyof MentorFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const val = target.type === 'checkbox' ? target.checked : target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    const payload = { ...form, userId: form.userId || null };
    try {
      if (form.id) {
        await updateMentor(form.id, payload);
      } else {
        await createMentor(payload);
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
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.mentors.fName')}</label>
          <input className="inp" value={form.name} onChange={change('name')} required />
        </div>
        <LocalizedField label={t('admin.mentors.fSpecialty')} required value={form.specialty} onChange={(next) => setForm((f) => ({ ...f, specialty: next }))} placeholder={t('admin.mentors.specialtyPlaceholder')} />
      </div>
      <LocalizedField label={t('admin.mentors.fBio')} required multiline value={form.bio} onChange={(next) => setForm((f) => ({ ...f, bio: next }))} />
      <FileUpload kind="image" label={t('admin.mentors.fPhoto')} value={form.photoUrl}
        onChange={(url) => setForm((f: MentorFormState) => ({ ...f, photoUrl: url }))} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>LinkedIn</label>
          <input className="inp" value={form.linkedinUrl} onChange={change('linkedinUrl')} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>GitHub</label>
          <input className="inp" value={form.githubUrl} onChange={change('githubUrl')} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Telegram</label>
          <input className="inp" value={form.telegramUrl} onChange={change('telegramUrl')} />
        </div>
      </div>
      <div>
        <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>
          {t('admin.mentors.fAccount')}
        </label>
        <select className="inp" value={form.userId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((f) => ({ ...f, userId: e.target.value }))}>
          <option value="">{t('admin.mentors.accountNone')}</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
        </select>
        <p style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>
          {t('admin.mentors.accountHint')}
        </p>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#334155', cursor:'pointer' }}>
        <input type="checkbox" checked={form.featured} onChange={change('featured')} /> {t('admin.form.featuredCheck')}
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

export default function AdminMentorsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [status, setStatus]   = useState<Status>('loading');
  const [editing, setEditing] = useState<MentorFormState | null>(null);

  const load = (): void => {
    setStatus('loading');
    Promise.all([listMentorsAdmin(), listUsers({ limit: 100 })])
      .then(([m, u]) => { setMentors(m as Mentor[]); setUsers(u.items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (m: Mentor): void => setEditing({
    id: m.id, name: m.name, bio: m.bio, specialty: m.specialty,
    photoUrl: m.photoUrl || '', linkedinUrl: m.linkedinUrl || '', githubUrl: m.githubUrl || '', telegramUrl: m.telegramUrl || '',
    featured: m.featured, userId: m.userId || '',
  });

  const remove = async (id: string | number): Promise<void> => {
    if (!window.confirm(t('admin.mentors.confirmDelete'))) return;
    try {
      await deleteMentor(id);
      load();
    } catch (err: any) {
      alert(err.message || t('common.error'));
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.mentors.title')} sub={t('admin.mentors.sub')}
        actions={
          !editing ? (
            <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ fontSize:13 }}>
              <Plus size={15}/> {t('admin.mentors.newBtn')}
            </button>
          ) : undefined
        } />

      {editing && <MentorForm initial={editing} users={users} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {mentors.map((m) => (
            <div key={m.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f9ff', border:'1.5px solid #bae6fd', flexShrink:0, fontSize:13, fontWeight:800, color:'#0ea5e9' }}>
                {initials(m.name)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{m.name}</p>
                <p style={{ fontSize:12, color:'#94a3b8' }}>{m.specialty.uz} · {t('admin.mentors.courseCount', { n: m.courses?.length || 0 })}</p>
              </div>
              {m.userId && (
                <span className="tag" style={{ display:'flex', alignItems:'center', gap:5, background:'#f0fdf4', borderColor:'#bbf7d0', color:'#16a34a' }}>
                  <UserCheck size={11}/> {t('admin.tags.accountLinked')}
                </span>
              )}
              {m.featured && <span className="tag" style={{ background:'#faf5ff', borderColor:'#e9d5ff', color:'#9333ea' }}>{t('admin.tags.featured')}</span>}
              <button onClick={() => startEdit(m)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>
                <Pencil size={14}/>
              </button>
              <button onClick={() => remove(m.id)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
