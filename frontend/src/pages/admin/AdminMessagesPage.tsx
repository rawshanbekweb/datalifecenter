import { useEffect, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { listContactMessages, updateContactMessageStatus } from '../../api/contact';

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

export default function AdminMessagesPage(): React.ReactElement {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    listContactMessages()
      .then((data: ContactMessage[]) => { if (!cancelled) { setMessages(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const changeStatus = async (id: string, newStatus: string): Promise<void> => {
    const prev = messages;
    setMessages((ms) => ms.map((m) => m.id === id ? { ...m, status: newStatus as MessageStatus } : m));
    try {
      await updateContactMessageStatus(id, newStatus);
    } catch {
      setMessages(prev);
    }
  };

  if (status === 'loading') return <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>;
  if (status === 'error') return <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>;
  if (messages.length === 0) {
    return (
      <div className="card" style={{ padding:40, textAlign:'center' }}>
        <p style={{ color:'#64748b', fontSize:14 }}>Hozircha xabarlar yo'q.</p>
      </div>
    );
  }

  return (
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
  );
}
