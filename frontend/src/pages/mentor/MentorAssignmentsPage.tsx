import { useEffect, useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, ClipboardList, ExternalLink, Paperclip, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AssignmentSubmission,
  ManagedAssignment,
  createAssignment,
  deleteAssignment,
  getManagedAssignments,
  reviewSubmission,
} from '../../api/assignments';
import { getMentorDashboard, getMentorStudents } from '../../api/mentors';
import { formatDateTime } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import MentorNotLinked from './MentorNotLinked';

interface CourseOption { id: string; title: string }
interface StudentOption { id: string; name: string; email: string; courseId: string }

interface FormState {
  courseId: string;
  title: string;
  description: string;
  linkUrl: string;
  dueAt: string;
  targetStudentIds: string[];
}

const EMPTY_FORM: FormState = { courseId: '', title: '', description: '', linkUrl: '', dueAt: '', targetStudentIds: [] };

const SUB_STATUS_META = {
  SUBMITTED: { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', labelKey: 'mentor.assignments.statusSubmitted' },
  ACCEPTED:  { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', labelKey: 'mentor.assignments.statusAccepted' },
  RETURNED:  { bg: '#fffbeb', border: '#fde68a', color: '#d97706', labelKey: 'mentor.assignments.statusReturned' },
} as const;

// Bitta javobni tekshirish bloki — baho + izoh + qabul/qaytarish
function SubmissionRow({ submission, onReviewed }: { submission: AssignmentSubmission; onReviewed: (s: AssignmentSubmission) => void }): React.ReactElement {
  const { t } = useTranslation();
  const [grade, setGrade] = useState<string>(submission.grade != null ? String(submission.grade) : '');
  const [feedback, setFeedback] = useState<string>(submission.feedback ?? '');
  const [busy, setBusy] = useState<boolean>(false);
  const meta = SUB_STATUS_META[submission.status];

  const review = async (status: 'ACCEPTED' | 'RETURNED'): Promise<void> => {
    setBusy(true);
    try {
      const updated = await reviewSubmission(submission.id, {
        status,
        grade: grade.trim() === '' ? undefined : Number(grade),
        feedback: feedback.trim() || undefined,
      });
      onReviewed(updated);
    } catch (err: unknown) {
      alert((err as Error).message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#9333ea', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, flexShrink: 0 }}>
          {submission.user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <p style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>{submission.user.name}</p>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>
            {formatDateTime(submission.submittedAt, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <span className="tag" style={{ background: meta.bg, borderColor: meta.border, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
          {t(meta.labelKey)}{submission.status === 'ACCEPTED' && typeof submission.grade === 'number' ? ` · ${submission.grade}/100` : ''}
        </span>
      </div>

      <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{submission.content}</p>
      <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
        {submission.linkUrl && (
          <a href={submission.linkUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
            <ExternalLink size={12} /> {t('mentor.assignments.openLink')}
          </a>
        )}
        {submission.fileUrl && (
          <a href={submission.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>
            <Paperclip size={12} /> {t('mentor.assignments.openFile')}
          </a>
        )}
      </div>

      {submission.status === 'SUBMITTED' ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="inp" type="number" min={0} max={100} value={grade} style={{ width: 110, fontSize: 12.5 }}
            placeholder={t('mentor.assignments.gradePlaceholder')} onChange={(e) => setGrade(e.target.value)} />
          <input className="inp" value={feedback} style={{ flex: '1 1 200px', fontSize: 12.5 }}
            placeholder={t('mentor.assignments.feedbackPlaceholder')} onChange={(e) => setFeedback(e.target.value)} />
          <button onClick={() => review('ACCEPTED')} disabled={busy} className="btn-primary" style={{ fontSize: 12, padding: '8px 13px', opacity: busy ? 0.6 : 1 }}>
            <CheckCircle size={13} /> {t('mentor.assignments.accept')}
          </button>
          <button onClick={() => review('RETURNED')} disabled={busy} className="btn-outline" style={{ fontSize: 12, padding: '8px 13px', opacity: busy ? 0.6 : 1 }}>
            <RotateCcw size={13} /> {t('mentor.assignments.return')}
          </button>
        </div>
      ) : (
        submission.feedback && (
          <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 8 }}>
            <strong>{t('mentor.assignments.yourFeedback')}:</strong> {submission.feedback}
          </p>
        )
      )}
    </div>
  );
}

// Mentor: topshiriq berish va o'quvchi javoblarini tekshirish
export default function MentorAssignmentsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [assignments, setAssignments] = useState<ManagedAssignment[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-linked' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState<boolean>(false);
  const [openId, setOpenId] = useState<string>('');
  const [busyId, setBusyId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMentorDashboard(), getMentorStudents(), getManagedAssignments()])
      .then(([d, s, a]: [{ mentor: { courses: CourseOption[] } }, { user: { id: string; name: string; email: string }; course: { id: string } }[], ManagedAssignment[]]) => {
        if (cancelled) return;
        setCourses(d.mentor.courses.map((c) => ({ id: c.id, title: c.title })));
        setStudents(s.map((row) => ({ id: row.user.id, name: row.user.name, email: row.user.email, courseId: row.course.id })));
        setAssignments(a);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        setStatus(err.code === 'MENTOR_NOT_LINKED' ? 'not-linked' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createAssignment({
        courseId: form.courseId,
        title: form.title.trim(),
        description: form.description.trim(),
        linkUrl: form.linkUrl.trim() || undefined,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        targetStudentIds: form.targetStudentIds,
      });
      setAssignments((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setFormOpen(false);
    } catch (err: unknown) {
      alert((err as Error).message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: ManagedAssignment): Promise<void> => {
    if (!window.confirm(t('mentor.assignments.confirmDelete', { title: a.title }))) return;
    setBusyId(a.id);
    try {
      await deleteAssignment(a.id);
      setAssignments((prev) => prev.filter((x) => x.id !== a.id));
    } catch (err: unknown) {
      alert((err as Error).message || t('common.error'));
    } finally {
      setBusyId('');
    }
  };

  const applyReviewed = (assignmentId: string, submission: AssignmentSubmission): void => {
    setAssignments((prev) => prev.map((a) => a.id === assignmentId
      ? { ...a, submissions: a.submissions.map((s) => (s.id === submission.id ? submission : s)) }
      : a));
  };

  return (
    <div>
      <AdminPageHeader title={t('mentor.assignments.title')} sub={t('mentor.assignments.pageSub')} />

      {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}
      {status === 'not-linked' && <MentorNotLinked message={errorMsg} />}

      {status === 'ready' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button className="btn-primary" style={{ fontSize: 12.5, padding: '8px 14px', opacity: courses.length === 0 ? 0.5 : 1 }}
              onClick={() => setFormOpen((v) => !v)} disabled={courses.length === 0}
              title={courses.length === 0 ? t('mentor.assignments.needCourseWarn') : undefined}>
              <Plus size={14} /> {t('mentor.assignments.newAssignment')}
            </button>
          </div>

          {courses.length === 0 && (
            <div className="card" style={{ padding: '14px 16px', marginBottom: 14, background: '#fffbeb', border: '1.5px solid #fde68a' }}>
              <p style={{ fontSize: 13, color: '#92400e' }}>{t('mentor.assignments.needCourseWarn')}</p>
            </div>
          )}

          {formOpen && (
            <form onSubmit={submit} className="card" style={{ padding: 20, marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <select className="inp" required value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value, targetStudentIds: [] })}>
                <option value="">{t('mentor.assignments.selectCourse')}</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <input className="inp" required minLength={3} maxLength={200} value={form.title}
                placeholder={t('mentor.assignments.titlePlaceholder')}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <div style={{ gridColumn: '1 / -1' }}>
                <textarea className="inp" required rows={4} value={form.description} style={{ width: '100%', resize: 'vertical' }}
                  placeholder={t('mentor.assignments.descPlaceholder')}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <input className="inp" type="url" value={form.linkUrl}
                placeholder={t('mentor.assignments.linkPlaceholder')}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748b' }}>
                {t('mentor.assignments.dueLabel')}
                <input className="inp" type="datetime-local" value={form.dueAt} style={{ flex: 1 }}
                  onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
              </label>

              {form.courseId && (() => {
                const courseStudents = students.filter((s) => s.courseId === form.courseId);
                if (courseStudents.length === 0) return null;
                return (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                      {t('mentor.assignments.audienceLabel')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
                      {courseStudents.map((s) => (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155', cursor: 'pointer' }}>
                          <input type="checkbox" checked={form.targetStudentIds.includes(s.id)}
                            onChange={(e) => setForm({
                              ...form,
                              targetStudentIds: e.target.checked
                                ? [...form.targetStudentIds, s.id]
                                : form.targetStudentIds.filter((id) => id !== s.id),
                            })} />
                          {s.name} <span style={{ color: '#94a3b8' }}>({s.email})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                  {saving ? t('common.saving') : t('mentor.assignments.create')}
                </button>
                <button type="button" className="btn-outline" style={{ fontSize: 13 }} onClick={() => setFormOpen(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          )}

          {assignments.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <ClipboardList size={26} style={{ color: '#cbd5e1', marginBottom: 10 }} />
              <p style={{ fontSize: 13.5, color: '#64748b' }}>{t('mentor.assignments.empty')}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assignments.map((a) => {
              const waiting = a.submissions.filter((s) => s.status === 'SUBMITTED').length;
              const open = openId === a.id;
              const busy = busyId === a.id;
              return (
                <div key={a.id} className="card" style={{ padding: '14px 16px', opacity: busy ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{a.title}</p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>
                        {a.course.title}
                        {a.dueAt && <> · {t('mentor.assignments.due', { date: formatDateTime(a.dueAt, { dateStyle: 'medium', timeStyle: 'short' }) })}</>}
                      </p>
                      <p style={{ fontSize: 11, color: '#9333ea', fontWeight: 600, marginTop: 2 }}>
                        {a.targetStudentIds.length > 0 ? t('mentor.assignments.forNStudents', { n: a.targetStudentIds.length }) : t('mentor.assignments.openToAll')}
                      </p>
                    </div>
                    {waiting > 0 && (
                      <span className="tag" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>
                        {t('mentor.assignments.waitingCount', { n: waiting })}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setOpenId(open ? '' : a.id)}
                        className="btn-outline" style={{ fontSize: 12, padding: '7px 12px' }}>
                        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {a.submissions.length > 0 ? t('mentor.assignments.submissionsCount', { n: a.submissions.length }) : t('mentor.assignments.noSubmissions')}
                      </button>
                      <button onClick={() => remove(a)} disabled={busy} title={t('mentor.assignments.deleteTitle')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.description}</p>
                      {a.submissions.length === 0 && (
                        <p style={{ fontSize: 12.5, color: '#94a3b8' }}>{t('mentor.assignments.noSubmissions')}</p>
                      )}
                      {a.submissions.map((s) => (
                        <SubmissionRow key={s.id} submission={s} onReviewed={(updated) => applyReviewed(a.id, updated)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
