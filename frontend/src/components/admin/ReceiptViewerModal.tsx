import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { getReceiptImageUrl } from '../../api/enrollments';

interface ReceiptViewerModalProps {
  enrollmentId: string;
  onClose: () => void;
}

export default function ReceiptViewerModal({ enrollmentId, onClose }: ReceiptViewerModalProps): React.ReactElement {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [status, setStatus]     = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    getReceiptImageUrl(enrollmentId)
      .then((url) => {
        if (cancelled) { URL.revokeObjectURL(url); return; }
        objectUrl = url;
        setImageUrl(url);
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [enrollmentId]);

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, padding: 20, maxWidth: 560, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>To'lov cheki</p>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b' }}>
            <X size={15} />
          </button>
        </div>

        {status === 'loading' && <p style={{ fontSize: 13, color: '#94a3b8', padding: '30px 0', textAlign: 'center' }}>Yuklanmoqda...</p>}
        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '30px 0' }}>
            <AlertTriangle size={22} style={{ color: '#dc2626' }} />
            <p style={{ fontSize: 13, color: '#dc2626' }}>Chekni yuklab bo'lmadi.</p>
          </div>
        )}
        {status === 'ready' && (
          <img src={imageUrl} alt="To'lov cheki" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 10, margin: '0 auto' }} />
        )}
      </div>
    </div>
  );
}
