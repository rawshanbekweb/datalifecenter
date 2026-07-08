import { useEffect, useState } from 'react';
import { Inbox, Plus, CornerDownRight } from 'lucide-react';
import { MentorRequest, createMentorRequest, getMyMentorRequests } from '../../api/questions';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import MentorNotLinked from './MentorNotLinked';

const STATUS_META: Record<MentorRequest['status'], { label: string; color: string; bg: string; border: string }> = {
  OPEN:     { label: 'Ochiq',          color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ANSWERED: { label: 'Javob berilgan', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  CLOSED:   { label: 'Yopilgan',       color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

// Mentor ↔ admin aloqa kanali: rasmiy so'rovlar
export default function MentorRequestsPage(): React.ReactElement {
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'not-linked' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [subject, setSubject]   = useState<string>('');
  const [body, setBody]         = useState<string>('');
  const [sending, setSending]   = useState<boolean>(false);
  const [sendError, setSendError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getMyMentorRequests()
      .then((data) => { if (!cancelled) { setRequests(data); setStatus('ready'); } })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        setStatus(err.code === 'MENTOR_NOT_LINKED' ? 'not-linked' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setSendError('');
    try {
      const created = await createMentorRequest(subject.trim(), body.trim());
      setRequests((prev) => [created, ...prev]);
      setSubject(''); setBody(''); setFormOpen(false);
    } catch (err: unknown) {
      setSendError((err as Error).message || "So'rovni yuborib bo'lmadi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Admin bilan aloqa" sub="Kurs, dastur yoki tashkiliy masalalar bo'yicha so'rov yuboring"
        actions={
          !formOpen && status === 'ready' ? (
            <button onClick={() => setFormOpen(true)} className="btn-primary" style={{ fontSize:13 }}>
              <Plus size={15}/> Yangi so'rov
            </button>
          ) : undefined
        } />

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}
      {status === 'not-linked' && <MentorNotLinked message={errorMsg} />}

      {formOpen && (
        <form onSubmit={submit} className="card" style={{ padding:18, marginBottom:18, display:'flex', flexDirection:'column', gap:10 }}>
          <p style={{ fontSize:13.5, fontWeight:800, color:'#0f172a' }}>Yangi so'rov</p>
          {sendError && <p style={{ fontSize:12.5, color:'#dc2626' }}>{sendError}</p>}
          <input className="inp" value={subject} required minLength={3} placeholder="Mavzu * (masalan: Yangi modul qo'shish kerak)"
            onChange={(e) => setSubject(e.target.value)} />
          <textarea className="inp" rows={4} value={body} required minLength={5} placeholder="So'rov tafsilotlari *"
            onChange={(e) => setBody(e.target.value)} style={{ resize:'vertical' }} />
          <div style={{ display:'flex', gap:8 }}>
            <button type="submit" disabled={sending} className="btn-primary" style={{ fontSize:12.5, padding:'8px 14px', opacity: sending ? 0.6 : 1 }}>
              {sending ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-outline" style={{ fontSize:12.5, padding:'8px 14px' }}>Bekor qilish</button>
          </div>
        </form>
      )}

      {status === 'ready' && requests.length === 0 && !formOpen && (
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <Inbox size={28} style={{ color:'#cbd5e1', marginBottom:12 }} />
          <p style={{ color:'#64748b', fontSize:14 }}>
            Hozircha so'rovlar yo'q. Administratorga murojaat qilish uchun "Yangi so'rov" tugmasini bosing.
          </p>
        </div>
      )}

      {status === 'ready' && requests.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {requests.map((r) => {
            const meta = STATUS_META[r.status];
            return (
              <div key={r.id} className="card" style={{ padding:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
                  <p style={{ flex:1, minWidth:160, fontSize:14.5, fontWeight:800, color:'#0f172a' }}>{r.subject}</p>
                  <span style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{new Date(r.createdAt).toLocaleDateString('uz-UZ')}</span>
                  <span className="tag" style={{ background:meta.bg, borderColor:meta.border, color:meta.color, fontWeight:700, flexShrink:0 }}>{meta.label}</span>
                </div>
                <p style={{ fontSize:13.5, color:'#334155', lineHeight:1.7 }}>{r.body}</p>
                {r.reply && (
                  <div style={{ display:'flex', gap:8, marginTop:10, padding:'10px 12px', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                    <CornerDownRight size={14} style={{ color:'#16a34a', flexShrink:0, marginTop:2 }}/>
                    <div>
                      <p style={{ fontSize:11.5, fontWeight:800, color:'#16a34a', marginBottom:3 }}>Admin javobi</p>
                      <p style={{ fontSize:13, color:'#334155', lineHeight:1.7 }}>{r.reply}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
