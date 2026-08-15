import React, { useCallback, useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, RotateCcw, Receipt, Ban, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listEnrollmentsAdmin, updateEnrollmentAdmin } from '../../api/enrollments';
import { formatDate, formatMoney } from '../../utils/format';
import EnrollmentPaymentsPanel from '../../components/payments/EnrollmentPaymentsPanel';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import CourseFormatBadge from '../../components/courses/CourseFormatBadge';
import Pagination from '../../components/admin/Pagination';
import { useDebounced } from '../../hooks/useDebounced';
import { useToast, usePrompt } from '../../components/common/Feedback';
import ReceiptViewerModal from '../../components/admin/ReceiptViewerModal';
import Loading from '../../components/common/Loading';

interface AdminEnrollment {
  id: string;
  /** Onlayn guruhmi yoki markazdagi offline guruhmi */
  format?: 'ONLINE' | 'OFFLINE';
  /** Aniq o'quv guruhi (jadval, xona) — biriktirilmagan bo'lishi mumkin */
  group?: { id: string; name: string } | null;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'FREE' | 'UNPAID' | 'PARTIAL' | 'PENDING' | 'PAID' | 'REJECTED' | 'REFUNDED';
  rejectionReason?: string | null;
  enrolledAt: string;
  /** Kelishilgan summa — kurs narxidan farq qilishi mumkin (chegirma) */
  priceAgreed?: string | number | null;
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
  PARTIAL:  { labelKey: 'admin.payStatus.PARTIAL',  color: '#d97706' },
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

// Guruhni ajratib ko'rish uchun: markazda o'qiydiganlar ro'yxati ko'pincha
// alohida kerak bo'ladi (davomat, jadval, to'lov bo'yicha gaplashish)
const FORMAT_FILTERS: { value: string; labelKey: string }[] = [
  { value: '',        labelKey: 'admin.enrollments.formatAll' },
  { value: 'ONLINE',  labelKey: 'courseFormat.ONLINE' },
  { value: 'OFFLINE', labelKey: 'courseFormat.OFFLINE' },
];

export default function AdminEnrollmentsPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const promptText = usePrompt();
  const [items, setItems]           = useState<AdminEnrollment[]>([]);
  const [status, setStatus]         = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter]         = useState<string>('');
  const [format, setFormat]         = useState<string>('');
  const [search, setSearch]         = useState<string>('');
  // Qidiruv jonli: "Qidirish" tugmasini bosish shart emas
  const query                       = useDebounced(search);
  const [busyId, setBusyId]         = useState<string>('');
  const [viewingReceiptId, setViewingReceiptId] = useState<string>('');
  const [openPaymentsId, setOpenPaymentsId] = useState<string>('');
  const [page, setPage]             = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const load = useCallback((): void => {
    setStatus('loading');
    listEnrollmentsAdmin({ status: filter || undefined, format: format || undefined, search: query || undefined, page, limit: 50 })
      .then((res: { items: AdminEnrollment[]; pagination?: { totalPages: number } }) => {
        setItems(res.items);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [filter, format, query, page]);

  useEffect(load, [load]);

  // Filtr almashganda birinchi sahifaga qaytamiz
  const applyFilter = (apply: () => void): void => { apply(); setPage(1); };

  const act = async (id: string, data: { status?: string; paymentStatus?: string; rejectionReason?: string }): Promise<void> => {
    setBusyId(id);
    try {
      const updated = await updateEnrollmentAdmin(id, data);
      setItems((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setBusyId('');
    }
  };

  const reject = async (id: string): Promise<void> => {
    const reason = await promptText(t('admin.rejectPrompt'), { multiline: true });
    if (!reason || !reason.trim()) return;
    act(id, { paymentStatus: 'REJECTED', rejectionReason: reason.trim() });
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.enrollments.title')} sub={t('admin.enrollments.sub')} />

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => applyFilter(() => setFilter(f.value))}
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
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {FORMAT_FILTERS.map((f) => (
            <button key={f.value} onClick={() => applyFilter(() => setFormat(f.value))}
              style={{
                padding:'8px 14px', borderRadius:10, fontSize:12.5, fontWeight:700, cursor:'pointer',
                border: format === f.value ? '1.5px solid #c2410c' : '1.5px solid #e2e8f0',
                background: format === f.value ? '#fff7ed' : '#fff',
                color: format === f.value ? '#c2410c' : '#64748b',
              }}>
              {t(f.labelKey)}
            </button>
          ))}
        </div>
        {/* Enter bosilsa sahifa qayta yuklanmasin — qidiruv o'zi jonli ishlaydi */}
        <form onSubmit={(e) => e.preventDefault()}
          style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="inp" value={search} onChange={(e) => applyFilter(() => setSearch(e.target.value))}
              placeholder={t('admin.enrollments.searchPlaceholder')} style={{ paddingLeft:34, width:220 }} />
          </div>
        </form>
      </div>

      {status === 'loading' && <Loading />}
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
              <React.Fragment key={e.id}>
              <div className="card admin-row">
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{e.user.name}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{e.user.email}</p>
                </div>
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#334155' }}>{e.course.title}</p>
                    {e.group && <span className="tag" style={{ fontWeight:700 }}>{e.group.name}</span>}
                    {e.format === 'OFFLINE' && <CourseFormatBadge format="OFFLINE" />}
                  </div>
                  <p style={{ fontSize:12, color: p.color, fontWeight:600 }}>
                    {/* Kelishilgan summadan qancha to'langani: offline guruh
                        narxi onlaynnikidan farq qiladi (Course.offlinePrice) */}
                    {t(p.labelKey)}
                    {!e.course.isFree && (e.priceAgreed ?? e.course.price)
                      ? ` · ${formatMoney(e.amountPaid ?? 0)}/${formatMoney(e.priceAgreed ?? e.course.price, e.course.currency)}`
                      : ''}
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
                  {/* Bepul kursda daftar ma'nosiz — pul harakati yo'q */}
                  {!e.course.isFree && (
                    <button onClick={() => setOpenPaymentsId((prev) => (prev === e.id ? '' : e.id))}
                      className="btn-outline" style={{ fontSize:12, padding:'8px 12px' }}>
                      <Wallet size={13}/> {t('admin.enrollments.payments')}
                    </button>
                  )}
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

              {openPaymentsId === e.id && (
                <div className="card" style={{ padding:16 }}>
                  <EnrollmentPaymentsPanel enrollmentId={e.id} canEdit onChanged={load} />
                </div>
              )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {status === 'ready' && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

      {viewingReceiptId && (
        <ReceiptViewerModal id={viewingReceiptId} kind="enrollment" onClose={() => setViewingReceiptId('')} />
      )}
    </div>
  );
}
