import { useCallback, useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, RotateCcw, Receipt, Ban } from 'lucide-react';
import { listEnrollmentsAdmin, updateEnrollmentAdmin } from '../../api/enrollments';
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

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:   { label: 'Kutilmoqda',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ACTIVE:    { label: 'Faol',           color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  COMPLETED: { label: 'Yakunlangan',    color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  CANCELLED: { label: 'Bekor qilingan', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const PAYMENT_META: Record<string, { label: string; color: string }> = {
  FREE:     { label: 'Bepul',           color: '#16a34a' },
  UNPAID:   { label: "To'lanmagan",     color: '#dc2626' },
  PENDING:  { label: "To'lov kutilmoqda", color: '#d97706' },
  PAID:     { label: "To'langan",       color: '#16a34a' },
  REJECTED: { label: 'Rad etildi',      color: '#dc2626' },
  REFUNDED: { label: 'Qaytarilgan',     color: '#64748b' },
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '',          label: 'Barchasi' },
  { value: 'PENDING',   label: 'Kutilmoqda' },
  { value: 'ACTIVE',    label: 'Faol' },
  { value: 'COMPLETED', label: 'Yakunlangan' },
  { value: 'CANCELLED', label: 'Bekor qilingan' },
];

export default function AdminEnrollmentsPage(): React.ReactElement {
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
      alert((err as Error).message || 'Xatolik yuz berdi');
    } finally {
      setBusyId('');
    }
  };

  const reject = (id: string): void => {
    const reason = window.prompt("To'lovni rad etish sababini kiriting (talabaga ko'rsatiladi):");
    if (!reason || !reason.trim()) return;
    act(id, { paymentStatus: 'REJECTED', rejectionReason: reason.trim() });
  };

  return (
    <div>
      <AdminPageHeader title="Yozilishlar" sub="Kursga yozilishlar va to'lovlarni boshqarish" />

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
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); }}
          style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="inp" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Talaba yoki kurs..." style={{ paddingLeft:34, width:220 }} />
          </div>
          <button type="submit" className="btn-outline" style={{ fontSize:13 }}>Qidirish</button>
        </form>
      </div>

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && items.length === 0 && (
        <div className="card" style={{ padding:36, textAlign:'center' }}>
          <p style={{ color:'#64748b', fontSize:14 }}>Yozilishlar topilmadi.</p>
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
                    {p.label}{!e.course.isFree && e.course.price ? ` · ${Number(e.course.price).toLocaleString('uz-UZ')} ${e.course.currency}` : ''}
                  </p>
                  {e.paymentStatus === 'REJECTED' && e.rejectionReason && (
                    <p style={{ fontSize:11.5, color:'#dc2626', marginTop:2 }}>Sabab: {e.rejectionReason}</p>
                  )}
                </div>
                {e.hasReceipt && (
                  <button onClick={() => setViewingReceiptId(e.id)}
                    style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'#d97706', cursor:'pointer', flexShrink:0, padding:'6px 10px', borderRadius:8, background:'#fffbeb', border:'1px solid #fde68a' }}>
                    <Receipt size={13}/> Chekni ko'rish
                  </button>
                )}
                <p style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{new Date(e.enrolledAt).toLocaleDateString('uz-UZ')}</p>
                <span className="tag" style={{ background:s.bg, borderColor:s.border, color:s.color, fontWeight:700, flexShrink:0 }}>{s.label}</span>

                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  {needsApproval && (
                    <button onClick={() => act(e.id, { paymentStatus: 'PAID' })} disabled={busy}
                      className="btn-primary" style={{ fontSize:12, padding:'8px 12px', opacity: busy ? 0.6 : 1 }}>
                      <CheckCircle size={13}/> To'lovni tasdiqlash
                    </button>
                  )}
                  {canReject && (
                    <button onClick={() => reject(e.id)} disabled={busy}
                      style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'8px 12px', borderRadius:10, border:'1px solid #fecaca', background:'#fff', color:'#dc2626', cursor:'pointer', opacity: busy ? 0.6 : 1 }}>
                      <Ban size={13}/> Rad etish
                    </button>
                  )}
                  {e.status === 'ACTIVE' && (
                    <button onClick={() => act(e.id, { status: 'COMPLETED' })} disabled={busy}
                      className="btn-outline" style={{ fontSize:12, padding:'8px 12px', opacity: busy ? 0.6 : 1 }}>
                      <CheckCircle size={13}/> Yakunlash
                    </button>
                  )}
                  {e.status !== 'CANCELLED' && e.status !== 'COMPLETED' && (
                    <button onClick={() => act(e.id, { status: 'CANCELLED' })} disabled={busy}
                      style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'8px 12px', borderRadius:10, border:'1px solid #fecaca', background:'#fff', color:'#dc2626', cursor:'pointer', opacity: busy ? 0.6 : 1 }}>
                      <XCircle size={13}/> Bekor qilish
                    </button>
                  )}
                  {e.status === 'CANCELLED' && (
                    <button onClick={() => act(e.id, { status: e.paymentStatus === 'PAID' || e.paymentStatus === 'FREE' ? 'ACTIVE' : 'PENDING' })} disabled={busy}
                      className="btn-outline" style={{ fontSize:12, padding:'8px 12px', opacity: busy ? 0.6 : 1 }}>
                      <RotateCcw size={13}/> Tiklash
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingReceiptId && (
        <ReceiptViewerModal enrollmentId={viewingReceiptId} onClose={() => setViewingReceiptId('')} />
      )}
    </div>
  );
}
