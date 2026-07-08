import { useEffect, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { listContactMessages, updateContactMessageStatus } from '../../api/contact';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

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
  NEW:      { label: 'Yangi',            color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  READ:     { label: "O'qilgan",         color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  REPLIED:  { label: 'Javob berilgan',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  ARCHIVED: { label: 'Arxivlangan',      color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const PAGE_SIZE = 20;

interface MessagesResponse {
  items: ContactMessage[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function AdminMessagesPage(): React.ReactElement {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'error'>('loading');
  const [page, setPage]         = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal]       = useState<number>(0);
  const [filter, setFilter]     = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    listContactMessages({ page, limit: PAGE_SIZE, status: filter || undefined })
      .then((data: MessagesResponse) => {
        if (!cancelled) {
          setMessages(data.items);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
          setStatus('ready');
        }
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [page, filter]);

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
      <AdminPageHeader title="Xabarlar" sub={`Aloqa formasidan kelgan murojaatlar${total ? ` — jami ${total} ta` : ''}`} />
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <select className="inp" style={{ width:'auto', padding:'7px 12px', fontSize:12.5, cursor:'pointer' }}
          value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">Barcha holatlar</option>
          {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{STATUS_LABELS[opt].label}</option>)}
        </select>
      </div>
    </div>
  );

  if (status === 'loading') return <div>{header}<p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p></div>;
  if (status === 'error') return <div>{header}<p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p></div>;
  if (messages.length === 0) {
    return (
      <div>
        {header}
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <p style={{ color:'#64748b', fontSize:14 }}>{filter ? 'Bu holatda xabarlar yo\'q.' : 'Hozircha xabarlar yo\'q.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {messages.map((m) => {
        const s = STATUS_LABELS[m.status];
        return (
          <div key={m.id} className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:10, flexWrap:'wrap' }}>
              <div>
                <p style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>{m.name}</p>
                <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:4 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' }}><Mail size={12}/>{m.email}</span>
                  {m.phone && <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748b' }}><Phone size={12}/>{m.phone}</span>}
                </div>
              </div>
              <select className="inp" style={{ width:'auto', padding:'6px 10px', fontSize:12, cursor:'pointer', background:s.bg, borderColor:s.border, color:s.color, fontWeight:700 }}
                value={m.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeStatus(m.id, e.target.value)}>
                {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{STATUS_LABELS[opt].label}</option>)}
              </select>
            </div>
            {m.subject && <p style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>Mavzu: {m.subject}</p>}
            <p style={{ fontSize:13, color:'#334155', lineHeight:1.7 }}>{m.message}</p>
            <p style={{ fontSize:11, color:'#cbd5e1', marginTop:10 }}>{new Date(m.createdAt).toLocaleString('uz-UZ')}</p>
          </div>
        );
      })}
      </div>

      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:20 }}>
          <button className="btn-outline" style={{ fontSize:12.5, padding:'7px 14px', opacity: page <= 1 ? 0.5 : 1 }}
            disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Oldingi</button>
          <span style={{ fontSize:13, color:'#64748b', fontWeight:600 }}>{page} / {totalPages}</span>
          <button className="btn-outline" style={{ fontSize:12.5, padding:'7px 14px', opacity: page >= totalPages ? 0.5 : 1 }}
            disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Keyingi</button>
        </div>
      )}
    </div>
  );
}
