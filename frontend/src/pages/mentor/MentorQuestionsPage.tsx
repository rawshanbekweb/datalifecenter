import { useEffect, useState } from 'react';
import { MessageCircleQuestion, Send, CornerDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LessonQuestion, answerQuestion, getMentorQuestions } from '../../api/questions';
import { formatDate } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import MentorNotLinked from './MentorNotLinked';
import { useToast } from '../../components/common/Feedback';

// Mentor kurslaridagi o'quvchi savollari — javob berish shu yerdan
export default function MentorQuestionsPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [status, setStatus]       = useState<'loading' | 'ready' | 'not-linked' | 'error'>('loading');
  const [errorMsg, setErrorMsg]   = useState<string>('');
  const [drafts, setDrafts]       = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMentorQuestions()
      .then((data) => { if (!cancelled) { setQuestions(data); setStatus('ready'); } })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        setStatus(err.code === 'MENTOR_NOT_LINKED' ? 'not-linked' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  const sendAnswer = async (id: string): Promise<void> => {
    const draft = (drafts[id] || '').trim();
    if (!draft || sendingId) return;
    setSendingId(id);
    try {
      const updated = await answerQuestion(id, draft);
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answer: updated.answer, answeredAt: updated.answeredAt } : q));
      setDrafts((prev) => ({ ...prev, [id]: '' }));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('mentor.questions.sendError'));
    } finally {
      setSendingId(null);
    }
  };

  const unanswered = questions.filter((q) => !q.answer).length;

  return (
    <div>
      <AdminPageHeader title={t('mentor.questions.title')}
        sub={unanswered > 0 ? t('mentor.questions.subWaiting', { n: unanswered }) : t('mentor.questions.subDefault')} />

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}
      {status === 'not-linked' && <MentorNotLinked message={errorMsg} />}

      {status === 'ready' && questions.length === 0 && (
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <MessageCircleQuestion size={28} style={{ color:'#cbd5e1', marginBottom:12 }} />
          <p style={{ color:'#64748b', fontSize:14 }}>
            {t('mentor.questions.empty')}
          </p>
        </div>
      )}

      {status === 'ready' && questions.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {questions.map((q) => (
            <div key={q.id} className="card" style={{ padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:'#9333ea', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }}>
                  {q.user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <p style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>{q.user.name}</p>
                  <p style={{ fontSize:11.5, color:'#94a3b8' }}>
                    {q.lesson?.module.course.title} · {q.lesson?.title} · {formatDate(q.createdAt)}
                  </p>
                </div>
                <span className="tag" style={q.answer
                  ? { background:'#f0fdf4', borderColor:'#bbf7d0', color:'#16a34a', fontWeight:700, flexShrink:0 }
                  : { background:'#fffbeb', borderColor:'#fde68a', color:'#d97706', fontWeight:700, flexShrink:0 }}>
                  {q.answer ? t('mentor.questions.answered') : t('mentor.questions.awaiting')}
                </span>
              </div>

              <p style={{ fontSize:14, color:'#334155', lineHeight:1.7, marginBottom:10 }}>{q.body}</p>

              {q.answer ? (
                <div style={{ display:'flex', gap:8, padding:'10px 12px', borderRadius:10, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                  <CornerDownRight size={14} style={{ color:'#16a34a', flexShrink:0, marginTop:2 }}/>
                  <p style={{ fontSize:13, color:'#334155', lineHeight:1.7 }}>{q.answer}</p>
                </div>
              ) : (
                <div style={{ display:'flex', gap:8 }}>
                  <input className="inp" value={drafts[q.id] || ''} style={{ flex:1, fontSize:13 }}
                    placeholder={t('mentor.questions.placeholder')}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))} />
                  <button onClick={() => sendAnswer(q.id)} disabled={!(drafts[q.id] || '').trim() || sendingId === q.id}
                    className="btn-primary" style={{ fontSize:12.5, padding:'9px 16px', flexShrink:0, opacity: !(drafts[q.id] || '').trim() || sendingId === q.id ? 0.6 : 1 }}>
                    <Send size={13}/> {sendingId === q.id ? '...' : t('mentor.questions.answerBtn')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
