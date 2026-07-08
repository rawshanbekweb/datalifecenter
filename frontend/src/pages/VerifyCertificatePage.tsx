import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, AlertCircle, Loader, Award } from 'lucide-react';
import { verifyCertificate, CertificateInfo } from '../api/enrollments';

// Ochiq sahifa: ish beruvchi sertifikat raqamini kiritib haqiqiyligini tekshiradi.
// PDF pastidagi havola shu sahifaga olib keladi.
export default function VerifyCertificatePage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const [no, setNo] = useState<string>(searchParams.get('no') || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [cert, setCert] = useState<CertificateInfo | null>(null);

  const check = async (value: string): Promise<void> => {
    if (!value.trim()) return;
    setStatus('loading');
    try {
      const data = await verifyCertificate(value.trim().toUpperCase());
      setCert(data);
      setStatus('found');
    } catch (err: any) {
      setErrorMsg(err.message || 'Xatolik yuz berdi');
      setStatus('error');
    }
  };

  // URL'da ?no= kelgan bo'lsa avtomatik tekshiramiz
  useEffect(() => {
    const initial = searchParams.get('no');
    if (initial) void check(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void check(no);
  };

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '140px 24px 60px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 460 }}>
        <div className="card" style={{ padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div className="icon-box"><BadgeCheck size={18} style={{ color: '#0ea5e9' }} /></div>
            <div>
              <p style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>Sertifikatni tekshirish</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>DATA LIFE sertifikati haqiqiyligini tasdiqlang</p>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <input className="inp" value={no} onChange={(e) => { setNo(e.target.value); setStatus('idle'); }}
              placeholder="DL-XXXXXXXX" required style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }} />
            <button type="submit" disabled={status === 'loading'} className="btn-primary"
              style={{ justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1, flexShrink: 0 }}>
              {status === 'loading' ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Tekshirish'}
            </button>
          </form>

          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
              <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#dc2626' }}>{errorMsg}</p>
            </div>
          )}

          {status === 'found' && cert && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '18px 20px', borderRadius: 12, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#166534', marginBottom: 12 }}>
                <Award size={16} /> Sertifikat haqiqiy
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#166534' }}>
                <p><b>Raqam:</b> {cert.certificateNo}</p>
                <p><b>Talaba:</b> {cert.studentName}</p>
                <p><b>Kurs:</b> {cert.courseTitle} ({cert.durationMonths} oylik dastur)</p>
                {cert.completedAt && <p><b>Yakunlangan sana:</b> {new Date(cert.completedAt).toLocaleDateString('uz-UZ')}</p>}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}
