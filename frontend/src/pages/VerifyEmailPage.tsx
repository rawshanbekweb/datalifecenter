import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MailCheck, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { verifyEmail } from '../api/auth';

export default function VerifyEmailPage(): React.ReactElement {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const requested = useRef(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg(t('auth.verifyEmail.noToken'));
      setStatus('error');
      return;
    }
    // StrictMode'da effekt ikki marta ishlaydi — token bir martalik, qayta yubormaymiz
    if (requested.current) return;
    requested.current = true;

    verifyEmail(token)
      .then(() => setStatus('done'))
      .catch((err: any) => {
        setErrorMsg(err.message || t('common.error'));
        setStatus('error');
      });
  }, [token, t]);

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '140px 24px 60px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420 }}>
        <div className="card" style={{ padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="icon-box"><MailCheck size={18} style={{ color: '#0ea5e9' }} /></div>
            <div>
              <p style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{t('auth.verifyEmail.title')}</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{t('auth.verifyEmail.subtitle')}</p>
            </div>
          </div>

          {status === 'loading' && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#64748b' }}>
              <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('auth.verifyEmail.verifying')}
            </p>
          )}

          {status === 'done' && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 12, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
              <CheckCircle2 size={17} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#166534' }}>
                {t('auth.verifyEmail.done')}
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
              <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#dc2626' }}>
                {errorMsg} {t('auth.verifyEmail.errorHint')}
              </p>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
            <Link to="/student/profile" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>{t('auth.verifyEmail.toProfile')}</Link>
            {' · '}
            <Link to="/" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>{t('nav.home')}</Link>
          </p>
        </div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}
