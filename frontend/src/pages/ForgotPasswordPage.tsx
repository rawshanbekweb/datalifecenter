import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { KeyRound, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordPage(): React.ReactElement {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await forgotPassword(email);
      setStatus('sent');
    } catch (err: any) {
      setErrorMsg(err.message || t('common.error'));
      setStatus('error');
    }
  };

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '140px 24px 60px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420 }}>
        <div className="card" style={{ padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="icon-box"><KeyRound size={18} style={{ color: '#0ea5e9' }} /></div>
            <div>
              <p style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{t('auth.forgot.title')}</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{t('auth.forgot.subtitle')}</p>
            </div>
          </div>

          {status === 'sent' ? (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 12, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
              <CheckCircle2 size={17} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, color: '#166534', fontWeight: 700 }}>{t('auth.forgot.sentTitle')}</p>
                <p style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
                  {t('auth.forgot.sentPrefix')} <b>{email}</b> {t('auth.forgot.sentSuffix')}
                </p>
              </div>
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
                <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>Email</label>
                <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={status === 'loading'} className="btn-primary"
                style={{ justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1, marginTop: 6 }}>
                {status === 'loading' ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('common.sending')}</> : t('auth.forgot.submit')}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
            {t('auth.forgot.remember')} <Link to="/login" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>{t('nav.login')}</Link>
          </p>
        </div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}
