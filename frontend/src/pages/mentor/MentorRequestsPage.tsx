import { useEffect, useState } from 'react';
import { Inbox, Plus, CornerDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MentorRequest, createMentorRequest, getMyMentorRequests } from '../../api/questions';
import { formatDate } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import MentorNotLinked from './MentorNotLinked';

const STATUS_META: Record<MentorRequest['status'], { labelKey: string; color: string; bg: string; border: string }> = {
  OPEN:     { labelKey: 'mentor.requests.status.OPEN',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ANSWERED: { labelKey: 'mentor.requests.status.ANSWERED', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  CLOSED:   { labelKey: 'mentor.requests.status.CLOSED',   color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

// Mentor ↔ admin aloqa kanali: rasmiy so'rovlar
export default function MentorRequestsPage(): React.ReactElement {
  const { t } = useTranslation();
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
      setSendError((err as Error).message || t('mentor.requests.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('mentor.requests.title')} sub={t('mentor.requests.sub')}
        actions={
          !formOpen && status === 'ready' ? (
            <button onClick={() => setFormOpen(true)} className="btn-primary" style={{ fontSize:13 }}>
              <Plus size={15}/> {t('mentor.requests.newRequest')}
            </button>
          ) : undefined
        } />

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}
      {status === 'not-linked' && <MentorNotLinked message={errorMsg} />}

      {formOpen && (
        <form onSubmit={submit} className="card" style={{ padding:18, marginBottom:18, display:'flex', flexDirection:'column', gap:10 }}>
          <p style={{ fontSize:13.5, fontWeight:800, color:'#0f172a' }}>{t('mentor.requests.newRequest')}</p>
          {sendError && <p style={{ fontSize:12.5, color:'#dc2626' }}>{sendError}</p>}
          <input className="inp" value={subject} required minLength={3} placeholder={t('mentor.requests.subjectPlaceholder')}
            onChange={(e) => setSubject(e.target.value)} />
          <textarea className="inp" rows={4} value={body} required minLength={5} placeholder={t('mentor.requests.bodyPlaceholder')}
            onChange={(e) => setBody(e.target.value)} style={{ resize:'vertical' }} />
          <div style={{ display:'flex', gap:8 }}>
            <button type="submit" disabled={sending} className="btn-primary" style={{ fontSize:12.5, padding:'8px 14px', opacity: sending ? 0.6 : 1 }}>
              {sending ? t('common.sending') : t('mentor.requests.send')}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-outline" style={{ fontSize:12.5, padding:'8px 14px' }}>{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {status === 'ready' && requests.length === 0 && !formOpen && (
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <Inbox size={28} style={{ color:'#cbd5e1', marginBottom:12 }} />
          <p style={{ color:'#64748b', fontSize:14 }}>
            {t('mentor.requests.empty')}
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
                  <span style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{formatDate(r.createdAt)}</span>
                  <span className="tag" style={{ background:meta.bg, borderColor:meta.border, color:meta.color, fontWeight:700, flexShrink:0 }}>{t(meta.labelKey)}</span>
                </div>
                <p style={{ fontSize:13.5, color:'#334155', lineHeight:1.7 }}>{r.body}</p>
                {r.reply && (
                  <div style={{ display:'flex', gap:8, marginTop:10, padding:'10px 12px', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                    <CornerDownRight size={14} style={{ color:'#16a34a', flexShrink:0, marginTop:2 }}/>
                    <div>
                      <p style={{ fontSize:11.5, fontWeight:800, color:'#16a34a', marginBottom:3 }}>{t('mentor.requests.adminReply')}</p>
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
