import { useEffect, useState } from 'react';
import { MessageCircleQuestion, Send, CornerDownRight } from 'lucide-react';
import { LessonQuestion, askQuestion, getLessonQuestions } from '../../api/questions';

interface LessonQAProps {
  lessonId: string;
  accentColor: string;
}

// Dars ostidagi o'quvchi ↔ mentor savol-javob bloki
export default function LessonQA({ lessonId, accentColor }: LessonQAProps): React.ReactElement {
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [loaded, setLoaded]   = useState<boolean>(false);
  const [body, setBody]       = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError]     = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setQuestions([]);
    getLessonQuestions(lessonId)
      .then((data) => { if (!cancelled) { setQuestions(data); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [lessonId]);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const created = await askQuestion(lessonId, body.trim());
      setQuestions((prev) => [created, ...prev]);
      setBody('');
    } catch (err: unknown) {
      setError((err as Error).message || 'Savolni yuborib bo\'lmadi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid #f1f5f9' }}>
      <p style={{ display:'flex', alignItems:'center', gap:8, fontSize:14.5, fontWeight:800, color:'#0f172a', marginBottom:14 }}>
        <MessageCircleQuestion size={17} style={{ color: accentColor }}/> Savol-javob
        {loaded && questions.length > 0 && (
          <span style={{ fontSize:11.5, fontWeight:700, color:'#94a3b8' }}>({questions.length})</span>
        )}
      </p>

      <form onSubmit={submit} style={{ display:'flex', gap:8, marginBottom:16 }}>
        <input className="inp" value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Bu dars bo'yicha mentorga savolingiz bormi?" style={{ flex:1, fontSize:13 }} />
        <button type="submit" disabled={!body.trim() || sending} className="btn-primary"
          style={{ fontSize:12.5, padding:'9px 16px', flexShrink:0, opacity: !body.trim() || sending ? 0.6 : 1 }}>
          <Send size={13}/> {sending ? '...' : 'Yuborish'}
        </button>
      </form>
      {error && <p style={{ fontSize:12.5, color:'#dc2626', marginTop:-8, marginBottom:12 }}>{error}</p>}

      {!loaded && <p style={{ fontSize:13, color:'#94a3b8' }}>Yuklanmoqda...</p>}
      {loaded && questions.length === 0 && (
        <p style={{ fontSize:13, color:'#94a3b8' }}>Bu dars bo'yicha hali savollar yo'q — birinchi bo'lib so'rang.</p>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {questions.map((q) => (
          <div key={q.id} style={{ padding:'12px 14px', borderRadius:12, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:accentColor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>
                {q.user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize:12.5, fontWeight:700, color:'#0f172a' }}>{q.user.name}</span>
              <span style={{ fontSize:11, color:'#94a3b8' }}>{new Date(q.createdAt).toLocaleDateString('uz-UZ')}</span>
            </div>
            <p style={{ fontSize:13.5, color:'#334155', lineHeight:1.7 }}>{q.body}</p>
            {q.answer ? (
              <div style={{ display:'flex', gap:8, marginTop:10, padding:'10px 12px', borderRadius:10, background:'#fff', border:'1px solid #e2e8f0' }}>
                <CornerDownRight size={14} style={{ color:'#16a34a', flexShrink:0, marginTop:2 }}/>
                <div>
                  <p style={{ fontSize:11.5, fontWeight:800, color:'#16a34a', marginBottom:3 }}>Mentor javobi</p>
                  <p style={{ fontSize:13, color:'#334155', lineHeight:1.7 }}>{q.answer}</p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize:11.5, color:'#d97706', fontWeight:600, marginTop:8 }}>Mentor javobi kutilmoqda...</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
