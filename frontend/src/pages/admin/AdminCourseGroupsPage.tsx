import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, MapPin, Plus, Trash2, Users, UserPlus, X, Pencil } from 'lucide-react';
import {
  CourseGroup,
  CourseGroupDetail,
  CourseGroupInput,
  CourseGroupStatus,
  GroupFormat,
  addGroupMember,
  createCourseGroup,
  deleteCourseGroup,
  getCourseGroup,
  listCourseGroups,
  removeGroupMember,
  updateCourseGroup,
} from '../../api/courseGroups';
import { listCoursesAdmin } from '../../api/courses';
import { listMentorsAdmin } from '../../api/mentors';
import { listEnrollmentsAdmin } from '../../api/enrollments';
import { formatDate } from '../../utils/format';
import { formatSchedule, nextLessonAt } from '../../utils/groupSchedule';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import CourseFormatBadge from '../../components/courses/CourseFormatBadge';
import { useConfirm, useToast } from '../../components/common/Feedback';
import Loading from '../../components/common/Loading';

interface CourseOption {
  id: string;
  title: { uz: string };
  format: 'ONLINE' | 'OFFLINE' | 'HYBRID';
}
interface MentorOption { id: string; name: string }
interface EnrollmentOption {
  id: string;
  format?: GroupFormat;
  user: { name: string; email: string };
  group?: { id: string; name: string } | null;
}

const STATUS_META: Record<CourseGroupStatus, { labelKey: string; color: string; bg: string; border: string }> = {
  PLANNED:  { labelKey: 'admin.courseGroups.status.PLANNED',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ACTIVE:   { labelKey: 'admin.courseGroups.status.ACTIVE',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  FINISHED: { labelKey: 'admin.courseGroups.status.FINISHED', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

interface FormState {
  courseId: string;
  name: string;
  format: GroupFormat;
  mentorId: string;
  status: CourseGroupStatus;
  startsAt: string;
  endsAt: string;
  weekdays: number[];
  startTime: string;
  durationMin: string;
  room: string;
  capacity: string;
}

const LBL: React.CSSProperties = { fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 };

const emptyForm: FormState = {
  courseId: '', name: '', format: 'OFFLINE', mentorId: '', status: 'PLANNED',
  startsAt: '', endsAt: '', weekdays: [], startTime: '18:00', durationMin: '90', room: '', capacity: '6',
};

/** <input type="date"> uchun: ISO vaqtdan faqat sana qismi */
function toDateInput(value: string | null): string {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function formToInput(form: FormState): CourseGroupInput {
  return {
    courseId: form.courseId,
    name: form.name.trim(),
    format: form.format,
    mentorId: form.mentorId || null,
    status: form.status,
    startsAt: form.startsAt,
    endsAt: form.endsAt || null,
    weekdays: form.weekdays,
    startTime: form.startTime || null,
    durationMin: Number(form.durationMin) || 90,
    room: form.room.trim() || null,
    capacity: form.capacity ? Number(form.capacity) : null,
  };
}

/**
 * O'quv guruhlari — qabul qilingan o'quvchi qachon, qayerda va kim bilan
 * o'qishini belgilaydigan yagona joy.
 *
 * Guruh jadvali HAFTALIK qoida (kunlar + vaqt), shuning uchun "keyingi dars"
 * shu yerda ham brauzer vaqtida hisoblanadi — o'quvchi kabinetidagi bilan
 * bir xil funksiya (utils/groupSchedule.ts).
 */
export default function AdminCourseGroupsPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();

  const [groups, setGroups]   = useState<CourseGroup[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [status, setStatus]   = useState<'loading' | 'ready' | 'error'>('loading');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string>('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState<boolean>(false);

  const [openGroup, setOpenGroup] = useState<CourseGroupDetail | null>(null);
  const [candidates, setCandidates] = useState<EnrollmentOption[]>([]);

  const load = useCallback((): void => {
    setStatus('loading');
    listCourseGroups({
      courseId: filterCourse || undefined,
      status: (filterStatus || undefined) as CourseGroupStatus | undefined,
    })
      .then((rows) => { setGroups(rows); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filterCourse, filterStatus]);

  useEffect(load, [load]);

  useEffect(() => {
    Promise.all([listCoursesAdmin(), listMentorsAdmin()])
      .then(([c, m]: [CourseOption[], MentorOption[]]) => { setCourses(c); setMentors(m); })
      .catch(() => {});
  }, []);

  const startCreate = (): void => {
    setEditingId('');
    setForm(emptyForm);
    setFormOpen(true);
  };

  const startEdit = (group: CourseGroup): void => {
    setEditingId(group.id);
    setForm({
      courseId: group.courseId,
      name: group.name,
      format: group.format,
      mentorId: group.mentorId ?? '',
      status: group.status,
      startsAt: toDateInput(group.startsAt),
      endsAt: toDateInput(group.endsAt),
      weekdays: group.weekdays,
      startTime: group.startTime ?? '',
      durationMin: String(group.durationMin),
      room: group.room ?? '',
      capacity: group.capacity === null ? '' : String(group.capacity),
    });
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    try {
      const input = formToInput(form);
      if (editingId) {
        // Kurs guruh yaratilgandan keyin o'zgarmaydi — a'zolar unga bog'langan
        const { courseId: _courseId, ...rest } = input;
        await updateCourseGroup(editingId, rest);
      } else {
        await createCourseGroup(input);
      }
      setFormOpen(false);
      setForm(emptyForm);
      setEditingId('');
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (group: CourseGroup): Promise<void> => {
    const ok = await confirm(t('admin.courseGroups.confirmDelete', { name: group.name }), { danger: true });
    if (!ok) return;
    try {
      await deleteCourseGroup(group.id);
      if (openGroup?.id === group.id) setOpenGroup(null);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    }
  };

  /**
   * A'zolar va "kimni qo'shish mumkin" ro'yxati. Nomzodlar — shu kursning
   * AYNI FORMATDAGI faol yozilishlari: boshqa guruhdagilar ham ko'rinadi
   * (o'quvchini guruhdan guruhga ko'chirish odatiy ish), qavs ichida
   * hozirgi guruhi bilan.
   */
  const loadMembers = async (group: { id: string; courseId: string; format: GroupFormat }): Promise<void> => {
    const [detail, enrollments] = await Promise.all([
      getCourseGroup(group.id),
      listEnrollmentsAdmin({ courseId: group.courseId, status: 'ACTIVE', format: group.format, limit: 100 }),
    ]);
    setOpenGroup(detail);
    setCandidates((enrollments.items as EnrollmentOption[]).filter((e) => e.group?.id !== group.id));
  };

  const openMembers = async (group: CourseGroup): Promise<void> => {
    if (openGroup?.id === group.id) { setOpenGroup(null); return; }
    try {
      await loadMembers(group);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    }
  };

  const addMember = async (enrollmentId: string): Promise<void> => {
    if (!openGroup || !enrollmentId) return;
    try {
      await addGroupMember(openGroup.id, enrollmentId);
      await loadMembers(openGroup);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    }
  };

  const dropMember = async (enrollmentId: string): Promise<void> => {
    if (!openGroup) return;
    try {
      await removeGroupMember(openGroup.id, enrollmentId);
      setOpenGroup({ ...openGroup, enrollments: openGroup.enrollments.filter((m) => m.id !== enrollmentId) });
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    }
  };

  const toggleWeekday = (day: number): void =>
    setForm((f) => ({
      ...f,
      weekdays: f.weekdays.includes(day) ? f.weekdays.filter((d) => d !== day) : [...f.weekdays, day].sort((a, b) => a - b),
    }));

  // Guruh formati kurs formatiga bog'liq: ONLINE kursda offline guruh bo'lmaydi
  const selectedCourse = courses.find((c) => c.id === form.courseId);
  const allowedFormats: GroupFormat[] = selectedCourse && selectedCourse.format !== 'HYBRID'
    ? [selectedCourse.format as GroupFormat]
    : ['OFFLINE', 'ONLINE'];

  return (
    <div>
      <AdminPageHeader title={t('admin.courseGroups.title')} sub={t('admin.courseGroups.sub')} />

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:18, alignItems:'center' }}>
        <select className="inp" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}
          style={{ cursor:'pointer', maxWidth:240 }}>
          <option value="">{t('admin.courseGroups.allCourses')}</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title.uz}</option>)}
        </select>
        <select className="inp" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ cursor:'pointer', maxWidth:200 }}>
          <option value="">{t('admin.common.all')}</option>
          {(Object.keys(STATUS_META) as CourseGroupStatus[]).map((s) => (
            <option key={s} value={s}>{t(STATUS_META[s].labelKey)}</option>
          ))}
        </select>
        <button onClick={startCreate} className="btn-primary" style={{ marginLeft:'auto' }}>
          <Plus size={15}/> {t('admin.courseGroups.create')}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={submit} className="card" style={{ padding:24, marginBottom:20, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <p style={{ fontSize:14, fontWeight:800, color:'#0f172a', flex:1 }}>
              {editingId ? t('admin.courseGroups.editTitle') : t('admin.courseGroups.createTitle')}
            </p>
            <button type="button" onClick={() => { setFormOpen(false); setEditingId(''); }}
              style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
              <X size={14}/>
            </button>
          </div>

          <div className="form-row">
            <div>
              <label style={LBL}>{t('admin.courseGroups.course')}</label>
              <select className="inp" required value={form.courseId} disabled={!!editingId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} style={{ cursor:'pointer' }}>
                <option value="">—</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title.uz}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>{t('admin.courseGroups.name')}</label>
              <input className="inp" required value={form.name} placeholder={t('admin.courseGroups.namePlaceholder')}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
          </div>

          <div className="form-row-3">
            <div>
              <label style={LBL}>{t('admin.courseGroups.format')}</label>
              <select className="inp" value={form.format}
                onChange={(e) => setForm((f) => ({ ...f, format: e.target.value as GroupFormat }))} style={{ cursor:'pointer' }}>
                {allowedFormats.map((f) => <option key={f} value={f}>{t(`courseFormat.${f}`)}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>{t('admin.courseGroups.mentor')}</label>
              <select className="inp" value={form.mentorId}
                onChange={(e) => setForm((f) => ({ ...f, mentorId: e.target.value }))} style={{ cursor:'pointer' }}>
                <option value="">{t('admin.courseGroups.mentorNone')}</option>
                {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>{t('admin.courseGroups.statusField')}</label>
              <select className="inp" value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CourseGroupStatus }))} style={{ cursor:'pointer' }}>
                {(Object.keys(STATUS_META) as CourseGroupStatus[]).map((s) => (
                  <option key={s} value={s}>{t(STATUS_META[s].labelKey)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div>
              <label style={LBL}>{t('admin.courseGroups.startsAt')}</label>
              <input className="inp" type="date" required value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div>
              <label style={LBL}>{t('admin.courseGroups.endsAt')}</label>
              <input className="inp" type="date" value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={LBL}>{t('admin.courseGroups.weekdays')}</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const on = form.weekdays.includes(day);
                return (
                  <button key={day} type="button" onClick={() => toggleWeekday(day)}
                    style={{
                      padding:'7px 13px', borderRadius:9, fontSize:12.5, fontWeight:700, cursor:'pointer',
                      border: on ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0',
                      background: on ? '#f0f9ff' : '#fff', color: on ? '#0ea5e9' : '#64748b',
                    }}>
                    {t(`weekdayShort.${day}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-row-4">
            <div>
              <label style={LBL}>{t('admin.courseGroups.startTime')}</label>
              <input className="inp" type="time" value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label style={LBL}>{t('admin.courseGroups.durationMin')}</label>
              <input className="inp" type="number" min={15} max={480} value={form.durationMin}
                onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))} />
            </div>
            <div>
              <label style={LBL}>{t('admin.courseGroups.room')}</label>
              <input className="inp" value={form.room} placeholder={t('admin.courseGroups.roomPlaceholder')}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} />
            </div>
            <div>
              <label style={LBL}>{t('admin.courseGroups.capacity')}</label>
              <input className="inp" type="number" min={1} max={200} value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary" style={{ alignSelf:'flex-start', opacity: saving ? 0.7 : 1 }}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </form>
      )}

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && groups.length === 0 && (
        <div className="card" style={{ padding:36, textAlign:'center' }}>
          <CalendarDays size={26} style={{ color:'#cbd5e1', marginBottom:10 }} />
          <p style={{ color:'#64748b', fontSize:14 }}>{t('admin.courseGroups.empty')}</p>
        </div>
      )}

      {status === 'ready' && groups.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {groups.map((g) => {
            const meta = STATUS_META[g.status];
            const next = nextLessonAt(g);
            const opened = openGroup?.id === g.id;
            return (
              <div key={g.id} className="card" style={{ padding:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:10 }}>
                  <div style={{ flex:1, minWidth:180 }}>
                    <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{g.name}</p>
                    <p style={{ fontSize:12, color:'#94a3b8' }}>{g.course.title}</p>
                  </div>
                  <CourseFormatBadge format={g.format} />
                  <span className="tag" style={{ background:meta.bg, borderColor:meta.border, color:meta.color, fontWeight:700 }}>
                    {t(meta.labelKey)}
                  </span>
                  <span className="tag" style={{ fontWeight:700 }}>
                    <Users size={12}/> {g._count.enrollments}{g.capacity !== null ? `/${g.capacity}` : ''}
                  </span>
                </div>

                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 18px', fontSize:12.5, color:'#475569', marginBottom:12 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <CalendarDays size={13}/> {formatDate(g.startsAt)}{g.endsAt ? ` — ${formatDate(g.endsAt)}` : ''}
                  </span>
                  {g.weekdays.length > 0 && <span style={{ fontWeight:600 }}>{formatSchedule(g, t)}</span>}
                  {g.room && <span style={{ display:'flex', alignItems:'center', gap:5 }}><MapPin size={13}/> {g.room}</span>}
                  {g.mentor && <span>{g.mentor.name}</span>}
                  {next && (
                    <span style={{ color:'#0284c7', fontWeight:700 }}>
                      {t('admin.courseGroups.nextLesson')}: {next.toLocaleString()}
                    </span>
                  )}
                </div>

                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button onClick={() => void openMembers(g)} className="btn-outline" style={{ fontSize:12, padding:'7px 12px' }}>
                    <Users size={13}/> {opened ? t('admin.courseGroups.hideMembers') : t('admin.courseGroups.members')}
                  </button>
                  <button onClick={() => startEdit(g)} className="btn-outline" style={{ fontSize:12, padding:'7px 12px' }}>
                    <Pencil size={13}/> {t('common.edit')}
                  </button>
                  <button onClick={() => void remove(g)}
                    style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, padding:'7px 12px', borderRadius:10, border:'1px solid #fecaca', background:'#fff', color:'#dc2626', cursor:'pointer' }}>
                    <Trash2 size={13}/> {t('common.delete')}
                  </button>
                </div>

                {opened && openGroup && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
                    {openGroup.enrollments.length === 0 && (
                      <p style={{ fontSize:12.5, color:'#94a3b8', marginBottom:10 }}>{t('admin.courseGroups.noMembers')}</p>
                    )}
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
                      {openGroup.enrollments.map((m) => (
                        <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:9, background:'#f8fafc', border:'1px solid #f1f5f9' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:12.5, fontWeight:700, color:'#0f172a' }}>{m.user.name}</p>
                            <p style={{ fontSize:11, color:'#94a3b8' }}>{m.user.email}</p>
                          </div>
                          <button onClick={() => void dropMember(m.id)} title={t('admin.courseGroups.removeMember')}
                            style={{ width:28, height:28, borderRadius:8, border:'1px solid #fecaca', background:'#fff', color:'#dc2626', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <X size={13}/>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <UserPlus size={14} style={{ color:'#0284c7' }} />
                      <select className="inp" defaultValue="" style={{ cursor:'pointer', maxWidth:320, fontSize:12.5 }}
                        onChange={(e) => { void addMember(e.target.value); e.target.value = ''; }}>
                        <option value="">{t('admin.courseGroups.addMember')}</option>
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.user.name}{c.group ? ` (${c.group.name})` : ''}
                          </option>
                        ))}
                      </select>
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
