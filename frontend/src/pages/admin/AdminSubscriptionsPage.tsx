import { useCallback, useEffect, useState } from 'react';
import { Search, CheckCircle, Ban, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listSubscriptionsAdmin, updateSubscriptionAdmin } from '../../api/subscriptions';
import { getSiteSettings, updateSiteSettingSection } from '../../api/siteSettings';
import { formatDate } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast, usePrompt } from '../../components/common/Feedback';
import ReceiptViewerModal from '../../components/admin/ReceiptViewerModal';

interface AdminSubscription {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  rejectionReason?: string | null;
  amountPaid?: string | number | null;
  hasReceipt?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const STATUS_META: Record<string, { labelKey: string; color: string; bg: string; border: string }> = {
  PENDING:   { labelKey: 'admin.subStatus.PENDING',   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ACTIVE:    { labelKey: 'admin.subStatus.ACTIVE',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  EXPIRED:   { labelKey: 'admin.subStatus.EXPIRED',   color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  CANCELLED: { labelKey: 'admin.subStatus.CANCELLED', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  REJECTED:  { labelKey: 'admin.subStatus.REJECTED',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const STATUS_FILTERS: { value: string; labelKey: string }[] = [
  { value: '',          labelKey: 'admin.common.all' },
  { value: 'PENDING',   labelKey: 'admin.subStatus.PENDING' },
  { value: 'ACTIVE',    labelKey: 'admin.subStatus.ACTIVE' },
  { value: 'EXPIRED',   labelKey: 'admin.subStatus.EXPIRED' },
  { value: 'REJECTED',  labelKey: 'admin.subStatus.REJECTED' },
  { value: 'CANCELLED', labelKey: 'admin.subStatus.CANCELLED' },
];

function PlanPriceCard(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('UZS');
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving'>('loading');

  useEffect(() => {
    getSiteSettings()
      .then((settings) => {
        const data = settings.subscription_plan as { price?: number; currency?: string } | undefined;
        setPrice(String(data?.price ?? 99000));
        setCurrency(data?.currency ?? 'UZS');
        setStatus('ready');
      })
      .catch(() => setStatus('ready'));
  }, []);

  const save = async () => {
    setStatus('saving');
    try {
      await updateSiteSettingSection('subscription_plan', { price: Number(price), currency });
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setStatus('ready');
    }
  };

  return (
    <div className="card" style={{ padding: 16, marginBottom: 18, display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
      <div>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>{t('admin.subscriptions.planPrice')}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="inp" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: 140 }} />
          <input className="inp" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 80 }} />
        </div>
      </div>
      <button onClick={save} disabled={status === 'loading' || status === 'saving'} className="btn-primary"
        style={{ fontSize: 12.5, padding: '9px 16px', opacity: status === 'saving' ? 0.6 : 1 }}>
        {status === 'saving' ? t('common.saving') : t('common.save')}
      </button>
    </div>
  );
}

export default function AdminSubscriptionsPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const promptText = usePrompt();
  const [items, setItems]   = useState<AdminSubscription[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [query, setQuery]   = useState<string>('');
  const [busyId, setBusyId] = useState<string>('');
  const [viewingReceiptId, setViewingReceiptId] = useState<string>('');

  const load = useCallback((): void => {
    setStatus('loading');
    listSubscriptionsAdmin({ status: filter || undefined, search: query || undefined, limit: 50 })
      .then((res: { items: AdminSubscription[] }) => { setItems(res.items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filter, query]);

  useEffect(load, [load]);

  const act = async (id: string, data: { status: 'ACTIVE' | 'REJECTED' | 'CANCELLED'; rejectionReason?: string }): Promise<void> => {
    setBusyId(id);
    try {
      const updated = await updateSubscriptionAdmin(id, data);
      setItems((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setBusyId('');
    }
  };

  const reject = async (id: string): Promise<void> => {
    const reason = await promptText(t('admin.rejectPrompt'), { multiline: true });
    if (!reason || !reason.trim()) return;
    act(id, { status: 'REJECTED', rejectionReason: reason.trim() });
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.subscriptions.title')} sub={t('admin.subscriptions.sub')} />

      <PlanPriceCard />

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
              placeholder={t('admin.subscriptions.searchPlaceholder')} style={{ paddingLeft:34, width:220 }} />
          </div>
          <button type="submit" className="btn-outline" style={{ fontSize:13 }}>{t('admin.common.search')}</button>
        </form>
      </div>

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && items.length === 0 && (
        <div className="card" style={{ padding:36, textAlign:'center' }}>
          <p style={{ color:'#64748b', fontSize:14 }}>{t('admin.subscriptions.empty')}</p>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {items.map((s) => {
            const meta = STATUS_META[s.status];
            const busy = busyId === s.id;
            return (
              <div key={s.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{s.user.name}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{s.user.email}</p>
                  {s.status === 'REJECTED' && s.rejectionReason && (
                    <p style={{ fontSize:11.5, color:'#dc2626', marginTop:2 }}>{t('admin.reasonLabel', { reason: s.rejectionReason })}</p>
                  )}
                  {s.status === 'ACTIVE' && s.expiresAt && (
                    <p style={{ fontSize:11.5, color:'#64748b', marginTop:2 }}>{t('admin.subscriptions.expiresLabel', { date: formatDate(s.expiresAt) })}</p>
                  )}
                </div>
                {s.hasReceipt && (
                  <button onClick={() => setViewingReceiptId(s.id)}
                    style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'#d97706', cursor:'pointer', flexShrink:0, padding:'6px 10px', borderRadius:8, background:'#fffbeb', border:'1px solid #fde68a' }}>
                    <Receipt size={13}/> {t('admin.subscriptions.viewReceipt')}
                  </button>
                )}
                <p style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{formatDate(s.createdAt)}</p>
                <span className="tag" style={{ background:meta.bg, borderColor:meta.border, color:meta.color, fontWeight:700, flexShrink:0 }}>{t(meta.labelKey)}</span>

                {s.status === 'PENDING' && (
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button onClick={() => act(s.id, { status: 'ACTIVE' })} disabled={busy}
                      className="btn-primary" style={{ fontSize:12, padding:'8px 12px', opacity: busy ? 0.6 : 1 }}>
                      <CheckCircle size={13}/> {t('admin.subscriptions.approvePayment')}
                    </button>
                    <button onClick={() => reject(s.id)} disabled={busy}
                      style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'8px 12px', borderRadius:10, border:'1px solid #fecaca', background:'#fff', color:'#dc2626', cursor:'pointer', opacity: busy ? 0.6 : 1 }}>
                      <Ban size={13}/> {t('admin.subscriptions.reject')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewingReceiptId && (
        <ReceiptViewerModal id={viewingReceiptId} kind="subscription" onClose={() => setViewingReceiptId('')} />
      )}
    </div>
  );
}
