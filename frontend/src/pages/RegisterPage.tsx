import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export default function RegisterPage(): React.ReactElement {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState<RegisterForm>({ name: '', email: '', phone: '', password: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const change = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
      setStatus('error');
    }
  };

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '140px 24px 60px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420 }}>
        <div className="card" style={{ padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="icon-box"><UserPlus size={18} style={{ color: '#0ea5e9' }} /></div>
            <div>
              <p style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>Ro'yxatdan o'tish</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Yangi DATA LIFE hisobi yarating</p>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {status === 'error' && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#dc2626' }}>{errorMsg}</p>
              </motion.div>
            )}
            <div>
              <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>Ism Familiya</label>
              <input className="inp" name="name" value={form.name} onChange={change} required placeholder="Ism Familiya" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>Email</label>
              <input className="inp" type="email" name="email" value={form.email} onChange={change} required placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>Telefon</label>
              <input className="inp" name="phone" value={form.phone} onChange={change} placeholder="+998 90 ..." />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>Parol</label>
              <input className="inp" type="password" name="password" value={form.password} onChange={change} required minLength={6} placeholder="Kamida 6 ta belgi" />
            </div>
            <button type="submit" disabled={status === 'loading'} className="btn-primary"
              style={{ justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1, marginTop: 6 }}>
              {status === 'loading' ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Yaratilmoqda...</> : "Ro'yxatdan o'tish"}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
            Hisobingiz bormi? <Link to="/login" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>Kiring</Link>
          </p>
        </div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}
