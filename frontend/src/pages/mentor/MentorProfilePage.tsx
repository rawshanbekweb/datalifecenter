import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, UserRound, Link2 } from 'lucide-react';
import { getMentorMe, updateMentorMe } from '../../api/mentors';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import FileUpload from '../../components/common/FileUpload';
import MentorNotLinked from './MentorNotLinked';

interface MentorProfile {
  name: string;
  bio: string;
  specialty: string;
  position: string;
  photoUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  telegramUrl: string;
}

const EMPTY: MentorProfile = {
  name: '', bio: '', specialty: '', position: '', photoUrl: '', linkedinUrl: '', githubUrl: '', telegramUrl: '',
};

const labelStyle: React.CSSProperties = { fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 };

// Mentor ommaviy profilini (saytdagi "Mentorlar" sahifasida ko'rinadigan) tahrirlaydi
export default function MentorProfilePage(): React.ReactElement {
  const [form, setForm]     = useState<MentorProfile>(EMPTY);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-linked' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getMentorMe()
      .then((m) => {
        if (cancelled) return;
        setForm({
          name: m.name || '', bio: m.bio || '', specialty: m.specialty || '', position: m.position || '',
          photoUrl: m.photoUrl || '', linkedinUrl: m.linkedinUrl || '', githubUrl: m.githubUrl || '', telegramUrl: m.telegramUrl || '',
        });
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        setStatus(err.code === 'MENTOR_NOT_LINKED' ? 'not-linked' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  const set = (key: keyof MentorProfile) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaveState('idle');
  };

  const save = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaveState('saving');
    try {
      await updateMentorMe(form);
      setSaveState('success');
    } catch (err: unknown) {
      setSaveError((err as Error).message || 'Xatolik yuz berdi');
      setSaveState('error');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Mentor profilim" sub="Saytdagi 'Mentorlar' sahifasida ko'rinadigan ma'lumotlaringiz" />

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}
      {status === 'not-linked' && <MentorNotLinked message={errorMsg} />}

      {status === 'ready' && (
        <form onSubmit={save} className="card" style={{ padding:24, maxWidth:640, display:'flex', flexDirection:'column', gap:14 }}>
          <p style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, color:'#0f172a' }}>
            <UserRound size={16} style={{ color:'#9333ea' }}/> Ommaviy profil
          </p>

          {saveState === 'success' && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, background:'#f0fdf4', border:'1.5px solid #bbf7d0' }}>
              <CheckCircle size={15} style={{ color:'#16a34a', flexShrink:0 }}/>
              <p style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>Profil saqlandi</p>
            </div>
          )}
          {saveState === 'error' && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca' }}>
              <AlertCircle size={15} style={{ color:'#dc2626', flexShrink:0 }}/>
              <p style={{ fontSize:13, color:'#dc2626', fontWeight:600 }}>{saveError}</p>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Ism *</label>
              <input className="inp" value={form.name} onChange={(e) => set('name')(e.target.value)} required minLength={2} />
            </div>
            <div>
              <label style={labelStyle}>Soha * (masalan: Frontend Development)</label>
              <input className="inp" value={form.specialty} onChange={(e) => set('specialty')(e.target.value)} required minLength={2} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Lavozim (masalan: Senior Engineer @ Kompaniya)</label>
            <input className="inp" value={form.position} onChange={(e) => set('position')(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Bio *</label>
            <textarea className="inp" rows={4} value={form.bio} onChange={(e) => set('bio')(e.target.value)}
              required minLength={5} style={{ resize:'vertical' }} />
          </div>
          <FileUpload kind="image" label="Profil surati" value={form.photoUrl} onChange={set('photoUrl')} />

          <p style={{ display:'flex', alignItems:'center', gap:8, fontSize:13.5, fontWeight:800, color:'#0f172a', marginTop:6 }}>
            <Link2 size={15} style={{ color:'#0ea5e9' }}/> Ijtimoiy havolalar
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>LinkedIn</label>
              <input className="inp" value={form.linkedinUrl} onChange={(e) => set('linkedinUrl')(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label style={labelStyle}>GitHub</label>
              <input className="inp" value={form.githubUrl} onChange={(e) => set('githubUrl')(e.target.value)} placeholder="https://github.com/..." />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Telegram</label>
            <input className="inp" value={form.telegramUrl} onChange={(e) => set('telegramUrl')(e.target.value)} placeholder="https://t.me/..." />
          </div>

          <button type="submit" disabled={saveState === 'saving'} className="btn-primary"
            style={{ alignSelf:'flex-start', opacity: saveState === 'saving' ? 0.7 : 1 }}>
            {saveState === 'saving' ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      )}
    </div>
  );
}
