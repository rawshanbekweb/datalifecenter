import { useEffect, useState } from 'react';
import { Inbox, Send, CornerDownRight, CheckCircle2 } from 'lucide-react';
import { MentorRequest, getAllMentorRequests, updateMentorRequest } from '../../api/questions';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const STATUS_META: Record<MentorRequest['status'], { label: string; color: string; bg: string; border: string }> = {
  OPEN:     { label: 'Ochiq',          color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ANSWERED: { label: 'Javob berilgan', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  CLOSED:   { label: 'Yopilgan',       color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

// Admin: mentorlardan kelgan so'rovlar — javob berish va yopish
export default function AdminMentorRequestsPage(): React.ReactElement {
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'error'>('loading');
  const [drafts, setDrafts]     = useState<Record<string, string>>({});
  const [busyId, setBusyId]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllMentorRequests()
      .then((data) => { if (!cancelled) { setRequests(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const apply = (updated: MentorRequest): void =>
    setRequests((prev) => prev.map((r) => r.id === updated.id ? updated : r));

  const reply = async (id: string): Promise<void> => {
    const draft = (drafts[id] || '').trim();
    if (!draft || busyId) return;
    setBusyId(id);
    try {
      apply(await updateMentorRequest(id, { reply: draft }));
      setDrafts((prev) => ({ ...prev, [id]: '' }));
    } catch (err: unknown) {
      alert((err as Error).message || 'Xatolik yuz berdi');
    } finally {
      setBusyId(null);
    }
  };

  const close = async (id: string): Promise<void> => {
    if (busyId) return;
    setBusyId(id);
    try {
      apply(await updateMentorRequest(id, { status: 'CLOSED' }));
    } catch (err: unknown) {
      alert((err as Error).message || 'Xatolik yuz berdi');
    } finally {
      setBusyId(null);
    }
  };

  const open = requests.filter((r) => r.status === 'OPEN').length;

  return (
    <div>
      <AdminPageHeader title="Mentor so'rovlari"
        sub={open > 0 ? `${open} ta so'rov javob kutmoqda` : 'Mentorlardan kelgan murojaatlar'} />

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && requests.length === 0 && (
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <Inbox size={28} style={{ color:'#cbd5e1', marginBottom:12 }} />
          <p style={{ color:'#64748b', fontSize:14 }}>Hozircha mentorlardan so'rovlar kelmagan.</p>
        </div>
      )}

      {status === 'ready' && requests.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {requests.map((r) => {
            const meta = STATUS_META[r.status];
            return (
              <div key={r.id} className="card" style={{ padding:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:'#9333ea', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }}>
                    {(r.mentor?.name || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:160 }}>
                    <p style={{ fontSize:13.5, fontWeight:800, color:'#0f172a' }}>{r.subject}</p>
                    <p style={{ fontSize:11.5, color:'#94a3b8' }}>
                      {r.mentor?.name}{r.mentor?.user?.email ? ` · ${r.mentor.user.email}` : ''} · {new Date(r.createdAt).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                  <span className="tag" style={{ background:meta.bg, borderColor:meta.border, color:meta.color, fontWeight:700, flexShrink:0 }}>{meta.label}</span>
                  {r.status !== 'CLOSED' && (
                    <button onClick={() => close(r.id)} disabled={busyId === r.id} className="btn-outline"
                      style={{ fontSize:11.5, padding:'6px 12px', flexShrink:0, opacity: busyId === r.id ? 0.6 : 1 }}>
                      <CheckCircle2 size={12}/> Yopish
                    </button>
                  )}
                </div>

                <p style={{ fontSize:13.5, color:'#334155', lineHeight:1.7, marginBottom:10 }}>{r.body}</p>

                {r.reply && (
                  <div style={{ display:'flex', gap:8, marginBottom:10, padding:'10px 12px', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                    <CornerDownRight size={14} style={{ color:'#16a34a', flexShrink:0, marginTop:2 }}/>
                    <div>
                      <p style={{ fontSize:11.5, fontWeight:800, color:'#16a34a', marginBottom:3 }}>Sizning javobingiz</p>
                      <p style={{ fontSize:13, color:'#334155', lineHeight:1.7 }}>{r.reply}</p>
                    </div>
                  </div>
                )}

                {r.status !== 'CLOSED' && (
                  <div style={{ display:'flex', gap:8 }}>
                    <input className="inp" value={drafts[r.id] || ''} style={{ flex:1, fontSize:13 }}
                      placeholder={r.reply ? 'Javobni yangilash...' : 'Javob yozing...'}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))} />
                    <button onClick={() => reply(r.id)} disabled={!(drafts[r.id] || '').trim() || busyId === r.id}
                      className="btn-primary" style={{ fontSize:12.5, padding:'9px 16px', flexShrink:0, opacity: !(drafts[r.id] || '').trim() || busyId === r.id ? 0.6 : 1 }}>
                      <Send size={13}/> {busyId === r.id ? '...' : 'Javob berish'}
                    </button>
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
