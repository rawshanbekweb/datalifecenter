import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { downloadCertificate, getMyEnrollments } from '../../api/enrollments';
import { resolveIcon } from '../../utils/iconMap';

interface CompletedEnrollment {
  id: string;
  status: string;
  enrolledAt: string;
  course: {
    iconKey: string;
    slug: string;
    title: string;
    bg: string;
    border: string;
    color: string;
  };
}

// Yakunlangan kurslar sertifikatlari
export default function StudentCertificatesPage(): React.ReactElement {
  const { t } = useTranslation();
  const [completed, setCompleted] = useState<CompletedEnrollment[]>([]);
  const [status, setStatus]       = useState<'loading' | 'ready' | 'error'>('loading');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getMyEnrollments()
      .then((data: CompletedEnrollment[]) => {
        if (!cancelled) {
          setCompleted(data.filter((e) => e.status === 'COMPLETED'));
          setStatus('ready');
        }
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const get = async (id: string): Promise<void> => {
    setDownloading(id);
    setError('');
    try {
      await downloadCertificate(id);
    } catch {
      setError(t('student.certificates.downloadError'));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          {t('student.certificates.titleStart')}<span className="accent">{t('student.certificates.titleAccent')}</span>
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b' }}>{t('student.certificates.subtitle')}</p>
      </div>

      {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {status === 'ready' && completed.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Award size={28} style={{ color: '#cbd5e1', marginBottom: 12 }} />
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
            {t('student.certificates.empty')}
          </p>
          <Link to="/student">
            <button className="btn-primary">{t('student.certificates.backToCourses')}</button>
          </Link>
        </div>
      )}

      {status === 'ready' && completed.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {completed.map((e) => {
            const Icon = resolveIcon(e.course.iconKey);
            return (
              <div key={e.id} className="card"
                style={{ padding: 20, background: e.course.bg, border: `1.5px solid ${e.course.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: `1.5px solid ${e.course.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} style={{ color: e.course.color }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{e.course.title}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>{t('student.certificates.completed')}</p>
                  </div>
                </div>
                <button onClick={() => get(e.id)} disabled={downloading === e.id} className="btn-primary"
                  style={{ fontSize: 12.5, justifyContent: 'center', opacity: downloading === e.id ? 0.7 : 1 }}>
                  <Download size={14} /> {downloading === e.id ? t('student.certificates.downloading') : t('student.certificates.download')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
