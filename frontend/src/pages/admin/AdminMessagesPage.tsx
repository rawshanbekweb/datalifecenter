import { useCallback, useEffect, useState } from 'react';
import { Mail, Phone, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  deleteContactMessage,
  deleteContactMessages,
  listContactMessages,
  updateContactMessageStatus,
} from '../../api/contact';
import { formatDateTime } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import BulkActionBar from '../../components/admin/BulkActionBar';
import Pagination from '../../components/admin/Pagination';
import { useBulkSelection } from '../../components/admin/useBulkSelection';
import { useConfirm, useToast } from '../../components/common/Feedback';
import Loading from '../../components/common/Loading';

type MessageStatus = 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
}

interface StatusLabel {
  label: string;
  color: string;
  bg: string;
  border: string;
}

const STATUS_OPTIONS: MessageStatus[] = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];
const STATUS_LABELS: Record<MessageStatus, StatusLabel> = {
  NEW:      { label: 'admin.msgStatus.NEW',      color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  READ:     { label: 'admin.msgStatus.READ',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  REPLIED:  { label: 'admin.msgStatus.REPLIED',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  ARCHIVED: { label: 'admin.msgStatus.ARCHIVED', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const PAGE_SIZE = 20;

interface MessagesResponse {
  items: ContactMessage[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminMessagesPage(): React.ReactElement {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'error'>('loading');
  const [page, setPage]         = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal]       = useState<number>(0);
  const [filter, setFilter]     = useState<string>('');
  const [busy, setBusy]         = useState<boolean>(false);

  const confirm = useConfirm();
  const toast = useToast();
  const selection = useBulkSelection(messages.map((m) => m.id));

  // `reload` o'chirishdan keyin ham chaqiriladi, shuning uchun effektdan
  // ajratilgan. Sahifadagi oxirgi yozuv o'chsa bir sahifa orqaga qaytamiz —
  // aks holda admin bo'sh ro'yxatga qarab qolardi.
  const load = useCallback(async (): Promise<void> => {
    setStatus('loading');
    try {
      const data: MessagesResponse = await listContactMessages({ page, limit: PAGE_SIZE, status: filter || undefined });
      if (data.items.length === 0 && page > 1) {
        setPage((p) => p - 1);
        return;
      }
      setMessages(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [page, filter]);

  useEffect(() => { void load(); }, [load]);

  const removeOne = async (id: string): Promise<void> => {
    const ok = await confirm(t('admin.bulk.confirmDeleteOne'), { confirmLabel: t('admin.bulk.deleteOne'), danger: true });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteContactMessage(id);
      toast.success(t('admin.bulk.deletedOne'));
      selection.clear();
      await load();
    } catch {
      toast.error(t('admin.bulk.deleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  const removeSelected = async (): Promise<void> => {
    const ids = selection.selectedIds;
    const ok = await confirm(t('admin.bulk.confirmDelete', { n: ids.length }), { confirmLabel: t('admin.bulk.deleteSelected'), danger: true });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await deleteContactMessages(ids);
      toast.success(t('admin.bulk.deleted', { n: res.deleted }));
      selection.clear();
      await load();
    } catch {
      toast.error(t('admin.bulk.deleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (id: string, newStatus: string): Promise<void> => {
    const prev = messages;
    setMessages((ms) => ms.map((m) => m.id === id ? { ...m, status: newStatus as MessageStatus } : m));
    try {
      await updateContactMessageStatus(id, newStatus);
    } catch {
      setMessages(prev);
    }
  };

  const header = (
    <div>
      <AdminPageHeader title={t('admin.messages.title')} sub={total ? t('admin.messages.subCount', { n: total }) : t('admin.messages.sub')} />
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <select className="inp" style={{ width:'auto', padding:'7px 34px 7px 12px', fontSize:12.5, cursor:'pointer' }}
          value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">{t('admin.messages.allStatuses')}</option>
          {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{t(STATUS_LABELS[opt].label)}</option>)}
        </select>
      </div>
    </div>
  );

  if (status === 'loading') return <div>{header}<Loading /></div>;
  if (status === 'error') return <div>{header}<p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p></div>;
  if (messages.length === 0) {
    return (
      <div>
        {header}
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <p style={{ color:'#64748b', fontSize:14 }}>{filter ? t('admin.messages.emptyFiltered') : t('admin.messages.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <BulkActionBar
        count={selection.count}
        allSelected={selection.allVisibleSelected}
        onToggleAll={selection.toggleAllVisible}
        onDelete={removeSelected}
        onClear={selection.clear}
        busy={busy}
      />
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {messages.map((m) => {
        const s = STATUS_LABELS[m.status];
        return (
          <div key={m.id} className="card"
            style={{ padding:20, borderColor: selection.isSelected(m.id) ? '#7dd3fc' : undefined }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:10, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <input type="checkbox" checked={selection.isSelected(m.id)} onChange={() => selection.toggle(m.id)}
                  style={{ width:16, height:16, marginTop:3, cursor:'pointer', accentColor:'#0ea5e9', flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>{m.name}</p>
                  <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:4 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' }}><Mail size={12}/>{m.email}</span>
                    {m.phone && <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' }}><Phone size={12}/>{m.phone}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <select className="inp" style={{ width:'auto', padding:'6px 10px', fontSize:12, cursor:'pointer', background:s.bg, backgroundImage:'none', borderColor:s.border, color:s.color, fontWeight:700 }}
                  value={m.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeStatus(m.id, e.target.value)}>
                  {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{t(STATUS_LABELS[opt].label)}</option>)}
                </select>
                <button onClick={() => removeOne(m.id)} disabled={busy} title={t('admin.bulk.deleteOne')}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8,
                    background:'#fff', border:'1.5px solid #fecaca', color:'#dc2626', cursor: busy ? 'default' : 'pointer', flexShrink:0 }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
            {m.subject && <p style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>{t('admin.messages.subjectLabel', { subject: m.subject })}</p>}
            <p style={{ fontSize:13, color:'#334155', lineHeight:1.7 }}>{m.message}</p>
            <p style={{ fontSize:11, color:'#cbd5e1', marginTop:10 }}>{formatDateTime(m.createdAt)}</p>
          </div>
        );
      })}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
