import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, CornerDownRight, ExternalLink, Paperclip, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AssignmentSubmission, MyAssignment, getMyAssignments, submitAssignment } from '../../api/assignments';
import { uploadFile } from '../../api/uploads';
import { formatDateTime } from '../../utils/format';
import { useToast } from '../../components/common/Feedback';

type StatusKey = 'NONE' | 'SUBMITTED' | 'ACCEPTED' | 'RETURNED';

const STATUS_META: Record<StatusKey, { bg: string; border: string; color: string; labelKey: string }> = {
  NONE:      { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b', labelKey: 'student.assignments.statusNone' },
  SUBMITTED: { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', labelKey: 'student.assignments.statusSubmitted' },
  ACCEPTED:  { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', labelKey: 'student.assignments.statusAccepted' },
  RETURNED:  { bg: '#fffbeb', border: '#fde68a', color: '#d97706', labelKey: 'student.assignments.statusReturned' },
};

interface DraftState {
  content: string;
  linkUrl: string;
  fileUrl: string;
}

// Bitta topshiriqning javob yuborish formasi — yuborilmagan yoki qaytarilgan holatda ochiladi
function SubmitForm({ assignment, onSubmitted }: { assignment: MyAssignment; onSubmitted: (s: AssignmentSubmission) => void }): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const prev = assignment.mySubmission;
  const [draft, setDraft] = useState<DraftState>({
    content: prev?.content ?? '',
    linkUrl: prev?.linkUrl ?? '',
    fileUrl: prev?.fileUrl ?? '',
  });
  const [sending, setSending] = useState<boolean>(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachFile = async (file: File): Promise<void> => {
    setUploadPct(0);
    try {
      const result = await uploadFile(file, 'image', setUploadPct);
      setDraft((d) => ({ ...d, fileUrl: result.url }));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setUploadPct(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const send = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const submission = await submitAssignment(assignment.id, {
        content: draft.content.trim(),
        linkUrl: draft.linkUrl.trim() || undefined,
        fileUrl: draft.fileUrl || undefined,
      });
      onSubmitted(submission);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
      <textarea className="inp" required rows={3} value={draft.content} style={{ fontSize: 13, resize: 'vertical' }}
        placeholder={t('student.assignments.answerPlaceholder')}
        onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
      <input className="inp" type="url" value={draft.linkUrl} style={{ fontSize: 13 }}
        placeholder={t('student.assignments.linkPlaceholder')}
        onChange={(e) => setDraft({ ...draft, linkUrl: e.target.value })} />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void attachFile(f); }} />
        {draft.fileUrl ? (
          <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Paperclip size={12} /> {t('student.assignments.attached')}
            <button type="button" onClick={() => setDraft({ ...draft, fileUrl: '' })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 0 }}
              title={t('student.assignments.removeFile')}>
              <X size={12} />
            </button>
          </span>
        ) : (
          <button type="button" className="btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}
            disabled={uploadPct !== null} onClick={() => fileInputRef.current?.click()}>
            <Paperclip size={12} /> {uploadPct !== null ? `${uploadPct}%` : t('student.assignments.attach')}
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={sending || uploadPct !== null}
          style={{ fontSize: 12.5, padding: '8px 16px', marginLeft: 'auto', opacity: sending ? 0.7 : 1 }}>
          <Send size={13} /> {sending ? t('common.sending') : prev ? t('student.assignments.resubmit') : t('student.assignments.submit')}
        </button>
      </div>
    </form>
  );
}

// Talaba yozilgan kurslar bo'yicha mentor bergan topshiriqlar
export default function StudentAssignmentsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    getMyAssignments()
      .then((data) => { if (!cancelled) { setAssignments(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const applySubmission = (assignmentId: string, submission: AssignmentSubmission): void => {
    setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? { ...a, mySubmission: submission } : a)));
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          {t('student.assignments.titleStart')} <span className="accent">{t('student.assignments.titleAccent')}</span>
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b' }}>{t('student.assignments.subtitle')}</p>
      </div>

      {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && assignments.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <ClipboardList size={28} style={{ color: '#cbd5e1', marginBottom: 12 }} />
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{t('student.assignments.empty')}</p>
          <Link to="/courses">
            <button className="btn-primary">{t('cabinet.browseCourses')}</button>
          </Link>
        </div>
      )}

      {status === 'ready' && assignments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {assignments.map((a) => {
            const sub = a.mySubmission;
            const meta = STATUS_META[(sub?.status ?? 'NONE') as StatusKey];
            const overdue = !sub && a.dueAt && new Date(a.dueAt).getTime() < Date.now();
            const canSubmit = !sub || sub.status === 'RETURNED';
            return (
              <div key={a.id} className="card" style={{ padding: 18, background: a.course.bg, border: `1.5px solid ${a.course.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{a.title}</p>
                    <p style={{ fontSize: 12.5, color: '#64748b' }}>
                      {a.course.title} · {a.mentor.name}
                      {a.dueAt && <> · <span style={{ color: overdue ? '#dc2626' : '#64748b', fontWeight: overdue ? 700 : 400 }}>
                        {t('student.assignments.due', { date: formatDateTime(a.dueAt, { dateStyle: 'medium', timeStyle: 'short' }) })}
                      </span></>}
                    </p>
                  </div>
                  <span className="tag" style={{ background: meta.bg, borderColor: meta.border, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
                    {t(meta.labelKey)}{sub?.status === 'ACCEPTED' && typeof sub.grade === 'number' ? ` · ${sub.grade}/100` : ''}
                  </span>
                </div>

                <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7, marginTop: 10, whiteSpace: 'pre-wrap' }}>{a.description}</p>
                {a.linkUrl && (
                  <a href={a.linkUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#2563eb', marginTop: 8, textDecoration: 'none' }}>
                    <ExternalLink size={13} /> {t('student.assignments.material')}
                  </a>
                )}

                {sub && (
                  <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.75)', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                      {t('student.assignments.yourAnswer')} · {formatDateTime(sub.submittedAt, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{sub.content}</p>
                    <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
                      {sub.linkUrl && (
                        <a href={sub.linkUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
                          <ExternalLink size={12} /> {sub.linkUrl}
                        </a>
                      )}
                      {sub.fileUrl && (
                        <a href={sub.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
                          <Paperclip size={12} /> {t('student.assignments.attached')}
                        </a>
                      )}
                    </div>
                    {sub.feedback && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, padding: '8px 10px', borderRadius: 8, background: meta.bg, border: `1px solid ${meta.border}` }}>
                        <CornerDownRight size={13} style={{ color: meta.color, flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.6 }}>
                          <strong>{t('student.assignments.feedback')}:</strong> {sub.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {canSubmit && <SubmitForm assignment={a} onSubmitted={(s) => applySubmission(a.id, s)} />}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
