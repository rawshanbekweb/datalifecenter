import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Plus, Play, Square, Trash2, ExternalLink, Wand2 } from 'lucide-react';
import {
  ManagedLiveSession,
  SessionStatus,
  createSession,
  deleteSession,
  getManagedSessions,
  updateSession,
} from '../../api/sessions';
import { SESSION_STATUS_META, formatSessionTime } from './sessionMeta';
import LocalizedField from '../admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';

interface CourseOption {
  id: string;
  title: string;
}

export interface StudentOption {
  id: string;
  name: string;
  email: string;
  courseId: string;
}

interface FormState {
  courseId: string;
  title: LocalizedString;
  description: LocalizedString;
  meetingUrl: string;
  startsAt: string;
  durationMin: number;
  targetStudentIds: string[];
}

const EMPTY_FORM: FormState = { courseId: '', title: emptyLocalizedString(), description: emptyLocalizedString(), meetingUrl: '', startsAt: '', durationMin: 60, targetStudentIds: [] };

function randomJitsiUrl(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => alphabet[b % alphabet.length]).join('');
  return `https://meet.jit.si/DataLife-${suffix}`;
}

export default function MentorSessionsPanel({ courses, students }: { courses: CourseOption[]; students: StudentOption[] }): React.ReactElement {
  const [sessions, setSessions] = useState<ManagedLiveSession[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'error'>('loading');
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [form, setForm]         = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]     = useState<boolean>(false);
  const [busyId, setBusyId]     = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getManagedSessions()
      .then((data) => { if (!cancelled) { setSessions(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createSession({
        courseId: form.courseId,
        title: form.title,
        description: form.description.uz ? form.description : undefined,
        meetingUrl: form.meetingUrl,
        startsAt: new Date(form.startsAt).toISOString(),
        durationMin: form.durationMin,
        targetStudentIds: form.targetStudentIds,
      });
      setSessions((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setFormOpen(false);
    } catch (err: unknown) {
      alert((err as Error).message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const setSessionStatus = async (id: string, newStatus: SessionStatus): Promise<void> => {
    setBusyId(id);
    try {
      const updated = await updateSession(id, { status: newStatus });
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err: unknown) {
      alert((err as Error).message || 'Xatolik yuz berdi');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (s: ManagedLiveSession): Promise<void> => {
    if (!window.confirm(`"${s.title.uz}" sessiyasi o'chirilsinmi?`)) return;
    setBusyId(s.id);
    try {
      await deleteSession(s.id);
      setSessions((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err: unknown) {
      alert((err as Error).message || 'Xatolik yuz berdi');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Video size={17} style={{ color: '#9333ea' }} /> Jonli darslar
        </h2>
        <button className="btn-primary" style={{ fontSize: 12.5, padding: '8px 14px' }}
          onClick={() => setFormOpen((v) => !v)} disabled={courses.length === 0}>
          <Plus size={14} /> Yangi sessiya
        </button>
      </div>

      {formOpen && (
        <form onSubmit={submit} className="card" style={{ padding: 20, marginBottom: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <select className="inp" required value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value, targetStudentIds: [] })}>
            <option value="">Kursni tanlang...</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <LocalizedField label="" required placeholder="Sessiya mavzusi"
            value={form.title} onChange={(next) => setForm({ ...form, title: next })} />
          <input className="inp" type="datetime-local" required
            value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          <select className="inp" value={form.durationMin}
            onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}>
            {[30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m} daqiqa</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
            <input className="inp" type="url" required placeholder="Uchrashuv havolasi (Zoom, Google Meet, Jitsi...)"
              value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} style={{ flex: 1 }} />
            <button type="button" className="btn-outline" style={{ fontSize: 12, flexShrink: 0 }}
              onClick={() => setForm({ ...form, meetingUrl: randomJitsiUrl() })} title="Bepul Jitsi xonasi havolasini yaratish">
              <Wand2 size={13} /> Havola yaratish
            </button>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <LocalizedField label="" multiline rows={2} placeholder="Qisqacha tavsif (ixtiyoriy)"
              value={form.description} onChange={(next) => setForm({ ...form, description: next })} />
          </div>

          {form.courseId && (() => {
            const courseStudents = students.filter((s) => s.courseId === form.courseId);
            if (courseStudents.length === 0) return null;
            return (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                  Auditoriya — belgilanmasa hammaga ochiq bo'ladi
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
              {saving ? 'Saqlanmoqda...' : 'Sessiya yaratish'}
            </button>
            <button type="button" className="btn-outline" style={{ fontSize: 13 }} onClick={() => setFormOpen(false)}>Bekor qilish</button>
          </div>
        </form>
      )}

      {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>Sessiyalarni yuklab bo'lmadi.</p>}
      {status === 'ready' && sessions.length === 0 && (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13.5, color: '#64748b' }}>
            Hali jonli dars rejalashtirilmagan. "Yangi sessiya" tugmasi orqali talabalaringiz uchun onlayn uchrashuv yarating.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sessions.map((s) => {
          const meta = SESSION_STATUS_META[s.status];
          const busy = busyId === s.id;
          return (
            <div key={s.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', opacity: busy ? 0.7 : 1 }}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{s.title.uz}</p>
                <p style={{ fontSize: 12, color: '#64748b' }}>{s.course.title.uz} · {formatSessionTime(s.startsAt, s.durationMin)}</p>
                <p style={{ fontSize: 11, color: '#9333ea', fontWeight: 600, marginTop: 2 }}>
                  {s.targetStudentIds.length > 0 ? `${s.targetStudentIds.length} ta o'quvchi uchun` : 'Hammaga ochiq'}
                </p>
              </div>
              <span className="tag" style={{ background: meta.bg, borderColor: meta.border, color: meta.color, fontWeight: 700, flexShrink: 0 }}>{meta.label}</span>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Link to={`/live/${s.id}`} title="Xonaga kirish (saytda)"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: '#f0f9ff', border: '1.5px solid #bae6fd', color: '#0ea5e9' }}>
                  <Video size={14} />
                </Link>
                <a href={s.meetingUrl} target="_blank" rel="noreferrer" title="Tashqi havolada ochish"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b' }}>
                  <ExternalLink size={14} />
                </a>
                {s.status === 'SCHEDULED' && (
                  <button onClick={() => setSessionStatus(s.id, 'LIVE')} disabled={busy} title="Efirni boshlash"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#16a34a', cursor: 'pointer' }}>
                    <Play size={14} />
                  </button>
                )}
                {s.status === 'LIVE' && (
                  <button onClick={() => setSessionStatus(s.id, 'ENDED')} disabled={busy} title="Efirni yakunlash"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}>
                    <Square size={13} />
                  </button>
                )}
                <button onClick={() => remove(s)} disabled={busy} title="O'chirish"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
