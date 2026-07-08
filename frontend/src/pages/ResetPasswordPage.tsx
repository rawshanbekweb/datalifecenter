import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LockKeyhole, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { resetPassword } from '../api/auth';

export default function ResetPasswordPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg('Parollar bir xil emas');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      await resetPassword(token, password);
      setStatus('done');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Xatolik yuz berdi');
      setStatus('error');
    }
  };

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '140px 24px 60px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420 }}>
        <div className="card" style={{ padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="icon-box"><LockKeyhole size={18} style={{ color: '#0ea5e9' }} /></div>
            <div>
              <p style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>Yangi parol o'rnatish</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Hisobingiz uchun yangi parol kiriting</p>
            </div>
          </div>

          {!token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
              <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#dc2626' }}>
                Havola noto'g'ri. <Link to="/forgot-password" style={{ color: '#0ea5e9', fontWeight: 700 }}>Parol tiklashni qaytadan so'rang</Link>.
              </p>
            </div>
          ) : status === 'done' ? (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 12, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
              <CheckCircle2 size={17} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#166534' }}>
                Parol yangilandi! Endi yangi parol bilan kirishingiz mumkin. Kirish sahifasiga yo'naltirilmoqdasiz...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {status === 'error' && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                  <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#dc2626' }}>{errorMsg}</p>
                </motion.div>
              )}
              <div>
                <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>Yangi parol</label>
                <input className="inp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Kamida 6 ta belgi" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>Parolni tasdiqlang</label>
                <input className="inp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} placeholder="Parolni qayta kiriting" />
              </div>
              <button type="submit" disabled={status === 'loading'} className="btn-primary"
                style={{ justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1, marginTop: 6 }}>
                {status === 'loading' ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saqlanmoqda...</> : 'Parolni yangilash'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
            <Link to="/login" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>Kirish sahifasiga qaytish</Link>
          </p>
        </div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}
