import { useCallback, useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, RotateCcw, Receipt, Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listEnrollmentsAdmin, updateEnrollmentAdmin } from '../../api/enrollments';
import { formatDate, formatNumber } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ReceiptViewerModal from '../../components/admin/ReceiptViewerModal';

interface AdminEnrollment {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'FREE' | 'UNPAID' | 'PENDING' | 'PAID' | 'REJECTED' | 'REFUNDED';
  rejectionReason?: string | null;
  enrolledAt: string;
  amountPaid?: string | number | null;
  hasReceipt?: boolean;
  user: { id: string; name: string; email: string };
  course: { id: string; title: string; slug: string; isFree: boolean; price?: string | number | null; currency: string };
}

const STATUS_META: Record<string, { labelKey: string; color: string; bg: string; border: string }> = {
  PENDING:   { labelKey: 'admin.enrollStatus.PENDING',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ACTIVE:    { labelKey: 'admin.enrollStatus.ACTIVE',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  COMPLETED: { labelKey: 'admin.enrollStatus.COMPLETED', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  CANCELLED: { labelKey: 'admin.enrollStatus.CANCELLED', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const PAYMENT_META: Record<string, { labelKey: string; color: string }> = {
  FREE:     { labelKey: 'admin.payStatus.FREE',     color: '#16a34a' },
  UNPAID:   { labelKey: 'admin.payStatus.UNPAID',   color: '#dc2626' },
  PENDING:  { labelKey: 'admin.payStatus.PENDING',  color: '#d97706' },
  PAID:     { labelKey: 'admin.payStatus.PAID',     color: '#16a34a' },
  REJECTED: { labelKey: 'admin.payStatus.REJECTED', color: '#dc2626' },
  REFUNDED: { labelKey: 'admin.payStatus.REFUNDED', color: '#64748b' },
};

const STATUS_FILTERS: { value: string; labelKey: string }[] = [
  { value: '',          labelKey: 'admin.common.all' },
  { value: 'PENDING',   labelKey: 'admin.enrollStatus.PENDING' },
  { value: 'ACTIVE',    labelKey: 'admin.enrollStatus.ACTIVE' },
  { value: 'COMPLETED', labelKey: 'admin.enrollStatus.COMPLETED' },
  { value: 'CANCELLED', labelKey: 'admin.enrollStatus.CANCELLED' },
];

export default function AdminEnrollmentsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [items, setItems]           = useState<AdminEnrollment[]>([]);
  const [status, setStatus]         = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter]         = useState<string>('');
  const [search, setSearch]         = useState<string>('');
  const [query, setQuery]           = useState<string>('');
  const [busyId, setBusyId]         = useState<string>('');
  const [viewingReceiptId, setViewingReceiptId] = useState<string>('');

  const load = useCallback((): void => {
    setStatus('loading');
    listEnrollmentsAdmin({ status: filter || undefined, search: query || undefined, limit: 50 })
      .then((res: { items: AdminEnrollment[] }) => { setItems(res.items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filter, query]);

  useEffect(load, [load]);

  const act = async (id: string, data: { status?: string; paymentStatus?: string; rejectionReason?: string }): Promise<void> => {
    setBusyId(id);
    try {
      const updated = await updateEnrollmentAdmin(id, data);
      setItems((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err: unknown) {
      alert((err as Error).message || t('common.error'));
    } finally {
      setBusyId('');
    }
  };

  const reject = (id: string): void => {
    const reason = window.prompt(t('admin.rejectPrompt'));
    if (!reason || !reason.trim()) return;
    act(id, { paymentStatus: 'REJECTED', rejectionReason: reason.trim() });
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.enrollments.title')} sub={t('admin.enrollments.sub')} />

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{
                padding:'8px 14px', borderRadius:10, fontSize:12.5, fontWeight:700, cursor:'pointer',
                border: filter === f.value ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0',
                background: filter === f.value ? '#f0f9ff' : '#fff',
                color: filter === f.value ? '#0ea5e9' : '#64748b',
              }}>
              {t(f.labelKey)}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); }}
          style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="inp" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.enrollments.searchPlaceholder')} style={{ paddingLeft:34, width:220 }} />
          </div>
          <button type="submit" className="btn-outline" style={{ fontSize:13 }}>{t('admin.common.search')}</button>
        </form>
      </div>

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && items.length === 0 && (
        <div className="card" style={{ padding:36, textAlign:'center' }}>
          <p style={{ color:'#64748b', fontSize:14 }}>{t('admin.enrollments.empty')}</p>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {items.map((e) => {
            const s = STATUS_META[e.status];
            const p = PAYMENT_META[e.paymentStatus];
            const busy = busyId === e.id;
            const needsApproval = e.status === 'PENDING' && (e.paymentStatus === 'UNPAID' || e.paymentStatus === 'PENDING');
            const canReject = e.paymentStatus === 'PENDING';
            return (
              <div key={e.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{e.user.name}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{e.user.email}</p>
                </div>
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:'#334155' }}>{e.course.title}</p>
                  <p style={{ fontSize:12, color: p.color, fontWeight:600 }}>
                    {t(p.labelKey)}{!e.course.isFree && e.course.price ? ` · ${formatNumber(Number(e.course.price))} ${e.course.currency}` : ''}
                  </p>
                  {e.paymentStatus === 'REJECTED' && e.rejectionReason && (
                    <p style={{ fontSize:11.5, color:'#dc2626', marginTop:2 }}>{t('admin.reasonLabel', { reason: e.rejectionReason })}</p>
                  )}
                </div>
                {e.hasReceipt && (
                  <button onClick={() => setViewingReceiptId(e.id)}
                    style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'#d97706', cursor:'pointer', flexShrink:0, padding:'6px 10px', borderRadius:8, background:'#fffbeb', border:'1px solid #fde68a' }}>
                    <Receipt size={13}/> {t('admin.enrollments.viewReceipt')}
                  </button>
                )}
                <p style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{formatDate(e.enrolledAt)}</p>
                <span className="tag" style={{ background:s.bg, borderColor:s.border, color:s.color, fontWeight:700, flexShrink:0 }}>{t(s.labelKey)}</span>

                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  {needsApproval && (
                    <button onClick={() => act(e.id, { paymentStatus: 'PAID' })} disabled={busy}
                      className="btn-primary" style={{ fontSize:12, padding:'8px 12px', opacity: busy ? 0.6 : 1 }}>
                      <CheckCircle size={13}/> {t('admin.enrollments.approvePayment')}
                    </button>
                  )}
                  {canReject && (
                    <button onClick={() => reject(e.id)} disabled={busy}
                      style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'8px 12px', borderRadius:10, border:'1px solid #fecaca', background:'#fff', color:'#dc2626', cursor:'pointer', opacity: busy ? 0.6 : 1 }}>
                      <Ban size={13}/> {t('admin.enrollments.reject')}
                    </button>
                  )}
                  {e.status === 'ACTIVE' && (
                    <button onClick={() => act(e.id, { status: 'COMPLETED' })} disabled={busy}
                      className="btn-outline" style={{ fontSize:12, padding:'8px 12px', opacity: busy ? 0.6 : 1 }}>
                      <CheckCircle size={13}/> {t('admin.enrollments.complete')}
                    </button>
                  )}
                  {e.status !== 'CANCELLED' && e.status !== 'COMPLETED' && (
                    <button onClick={() => act(e.id, { status: 'CANCELLED' })} disabled={busy}
                      style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'8px 12px', borderRadius:10, border:'1px solid #fecaca', background:'#fff', color:'#dc2626', cursor:'pointer', opacity: busy ? 0.6 : 1 }}>
                      <XCircle size={13}/> {t('admin.enrollments.cancel')}
                    </button>
                  )}
                  {e.status === 'CANCELLED' && (
                    <button onClick={() => act(e.id, { status: e.paymentStatus === 'PAID' || e.paymentStatus === 'FREE' ? 'ACTIVE' : 'PENDING' })} disabled={busy}
                      className="btn-outline" style={{ fontSize:12, padding:'8px 12px', opacity: busy ? 0.6 : 1 }}>
                      <RotateCcw size={13}/> {t('admin.enrollments.restore')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingReceiptId && (
        <ReceiptViewerModal id={viewingReceiptId} kind="enrollment" onClose={() => setViewingReceiptId('')} />
      )}
    </div>
  );
}
