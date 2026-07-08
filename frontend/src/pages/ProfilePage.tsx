import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, User, KeyRound, MailWarning } from 'lucide-react';
import { updateProfile, changePassword, resendVerification } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import FileUpload from '../components/common/FileUpload';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

interface NoticeProps {
  kind: 'success' | 'error';
  text: string;
}

function Notice({ kind, text }: NoticeProps): React.ReactElement {
  const ok = kind === 'success';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12,
      background: ok ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${ok ? '#bbf7d0' : '#fecaca'}` }}>
      {ok ? <CheckCircle size={15} style={{ color:'#16a34a', flexShrink:0 }}/> : <AlertCircle size={15} style={{ color:'#dc2626', flexShrink:0 }}/>}
      <p style={{ fontSize:13, color: ok ? '#16a34a' : '#dc2626', fontWeight:600 }}>{text}</p>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 };

export default function ProfilePage(): React.ReactElement {
  const { user, applyUser } = useAuth();

  const [name, setName]   = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>((user?.phone as string) || '');
  const [avatarUrl, setAvatarUrl] = useState<string>((user?.avatarUrl as string) || '');
  const [profileStatus, setProfileStatus] = useState<FormStatus>('idle');
  const [profileError, setProfileError]   = useState<string>('');

  const [resendStatus, setResendStatus] = useState<FormStatus>('idle');
  const [resendError, setResendError]   = useState<string>('');

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword]         = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passStatus, setPassStatus] = useState<FormStatus>('idle');
  const [passError, setPassError]   = useState<string>('');

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setProfileStatus('loading');
    try {
      const updated = await updateProfile({ name, phone: phone || null, avatarUrl: avatarUrl || null });
      applyUser(updated);
      setProfileStatus('success');
    } catch (err: unknown) {
      setProfileError((err as Error).message || 'Xatolik yuz berdi');
      setProfileStatus('error');
    }
  };

  const resend = async (): Promise<void> => {
    setResendStatus('loading');
    try {
      await resendVerification();
      setResendStatus('success');
    } catch (err: unknown) {
      setResendError((err as Error).message || 'Xatolik yuz berdi');
      setResendStatus('error');
    }
  };

  const savePassword = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassError('Yangi parol takrori mos kelmadi');
      setPassStatus('error');
      return;
    }
    setPassStatus('loading');
    try {
      await changePassword(currentPassword, newPassword);
      setPassStatus('success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: unknown) {
      setPassError((err as Error).message || 'Xatolik yuz berdi');
      setPassStatus('error');
    }
  };

  return (
    <div>
      <div style={{ maxWidth:640 }}>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:24 }}>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:4 }}>
            Profil <span className="accent">sozlamalari</span>
          </h1>
          <p style={{ fontSize:13.5, color:'#64748b' }}>Shaxsiy ma'lumotlar va parolni boshqarish</p>
        </motion.div>

        {user && user.emailVerified === false && (
          <div className="card" style={{ padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:12,
            background:'#fffbeb', border:'1.5px solid #fde68a' }}>
            <MailWarning size={18} style={{ color:'#d97706', flexShrink:0, marginTop:2 }}/>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13.5, fontWeight:700, color:'#92400e' }}>Emailingiz hali tasdiqlanmagan</p>
              <p style={{ fontSize:12.5, color:'#92400e', marginTop:2 }}>
                {resendStatus === 'success'
                  ? 'Tasdiqlash havolasi yuborildi — pochta qutingizni (spamni ham) tekshiring.'
                  : resendStatus === 'error'
                    ? resendError
                    : "Pochta qutingizga yuborilgan havolani bosing yoki qayta yuborishni so'rang."}
              </p>
            </div>
            {resendStatus !== 'success' && (
              <button type="button" onClick={resend} disabled={resendStatus === 'loading'} className="btn-outline"
                style={{ fontSize:12, padding:'7px 12px', flexShrink:0, opacity: resendStatus === 'loading' ? 0.7 : 1 }}>
                {resendStatus === 'loading' ? 'Yuborilmoqda...' : 'Qayta yuborish'}
              </button>
            )}
          </div>
        )}

        <form onSubmit={saveProfile} className="card" style={{ padding:24, marginBottom:20, display:'flex', flexDirection:'column', gap:14 }}>
          <p style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, color:'#0f172a' }}>
            <User size={16} style={{ color:'#0ea5e9' }}/> Shaxsiy ma'lumotlar
          </p>
          {profileStatus === 'success' && <Notice kind="success" text="Ma'lumotlar saqlandi" />}
          {profileStatus === 'error' && <Notice kind="error" text={profileError} />}
          <div>
            <label style={labelStyle}>Ism *</label>
            <input className="inp" value={name} onChange={(e) => { setName(e.target.value); setProfileStatus('idle'); }} required minLength={2} />
          </div>
          <div>
            <label style={labelStyle}>Telefon</label>
            <input className="inp" value={phone} onChange={(e) => { setPhone(e.target.value); setProfileStatus('idle'); }} placeholder="+998 90 123 45 67" />
          </div>
          <FileUpload kind="image" label="Profil rasmi" value={avatarUrl}
            onChange={(url) => { setAvatarUrl(url); setProfileStatus('idle'); }} />
          <div>
            <label style={labelStyle}>Email (o'zgartirib bo'lmaydi)</label>
            <input className="inp" value={user?.email || ''} disabled style={{ opacity:0.6, cursor:'not-allowed' }} />
          </div>
          <button type="submit" disabled={profileStatus === 'loading'} className="btn-primary"
            style={{ alignSelf:'flex-start', opacity: profileStatus === 'loading' ? 0.7 : 1 }}>
            {profileStatus === 'loading' ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>

        <form onSubmit={savePassword} className="card" style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
          <p style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, color:'#0f172a' }}>
            <KeyRound size={16} style={{ color:'#9333ea' }}/> Parolni o'zgartirish
          </p>
          {passStatus === 'success' && <Notice kind="success" text="Parol muvaffaqiyatli o'zgartirildi" />}
          {passStatus === 'error' && <Notice kind="error" text={passError} />}
          <div>
            <label style={labelStyle}>Joriy parol *</label>
            <input className="inp" type="password" value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPassStatus('idle'); }} required />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Yangi parol *</label>
              <input className="inp" type="password" value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPassStatus('idle'); }} required minLength={6} />
            </div>
            <div>
              <label style={labelStyle}>Yangi parol (takror) *</label>
              <input className="inp" type="password" value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPassStatus('idle'); }} required minLength={6} />
            </div>
          </div>
          <button type="submit" disabled={passStatus === 'loading'} className="btn-outline"
            style={{ alignSelf:'flex-start', opacity: passStatus === 'loading' ? 0.7 : 1 }}>
            {passStatus === 'loading' ? 'Saqlanmoqda...' : "Parolni o'zgartirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
