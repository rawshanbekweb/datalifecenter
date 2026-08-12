import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, UserCheck, GraduationCap, EyeOff, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listTeamAdmin, createTeamMember, updateTeamMember, deleteTeamMember, DEPARTMENTS } from '../../api/team';
import { listUsers, AdminUser } from '../../api/users';
import { listMentorsAdmin } from '../../api/mentors';
import { listProjectsAdmin } from '../../api/projects';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import TeamProfileFields from '../../components/team/TeamProfileFields';
import { departmentMeta, initials } from '../../components/team/departments';
import { useToast, useConfirm } from '../../components/common/Feedback';
import { LocalizedString } from '../../types/locale';
import { TeamMemberAdmin, Department, TeamProfileFormState, emptyTeamProfileForm } from '../../types/team';
import Loading from '../../components/common/Loading';
import { DEFAULT_FOCUS } from '../../utils/imageFocus';

interface MentorOption { id: string; name: string }
interface ProjectOption { id: string; title: LocalizedString; category: string }

interface TeamFormState extends TeamProfileFormState {
  id?: string;
  department: Department;
  leadership: boolean;
  joinedAt: string;
  order: number;
  featured: boolean;
  published: boolean;
  userId: string;
  mentorId: string;
  projectIds: string[];
}

type Status = 'loading' | 'ready' | 'error';

function emptyForm(): TeamFormState {
  return {
    ...emptyTeamProfileForm(),
    department: 'ENGINEERING',
    leadership: false,
    joinedAt: '',
    order: 0,
    featured: false,
    published: true,
    userId: '',
    mentorId: '',
    projectIds: [],
  };
}

interface TeamFormProps {
  initial: TeamFormState;
  users: AdminUser[];
  mentors: MentorOption[];
  projects: ProjectOption[];
  onCancel: () => void;
  onSaved: () => void;
}

function TeamForm({ initial, users, mentors, projects, onCancel, onSaved }: TeamFormProps): React.ReactElement {
  const { t } = useTranslation();
  const [form, setForm] = useState<TeamFormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const toggleProject = (id: string): void => {
    setForm((f) => ({
      ...f,
      projectIds: f.projectIds.includes(id) ? f.projectIds.filter((p) => p !== id) : [...f.projectIds, id],
    }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    const { id, projectIds, userId, mentorId, joinedAt, ...rest } = form;
    const payload = {
      ...rest,
      userId: userId || null,
      mentorId: mentorId || null,
      joinedAt: joinedAt || null,
      // Tanlangan tartib saqlanadi — a'zo sahifasida shu ketma-ketlikda chiqadi
      projects: projectIds.map((projectId, order) => ({ projectId, order })),
    };
    try {
      if (id) {
        await updateTeamMember(id, payload);
      } else {
        await createTeamMember(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || t('common.error'));
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ padding: 24, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
          <AlertCircle size={15} style={{ color: '#dc2626' }} />
          <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>
        </div>
      )}

      <TeamProfileFields form={form} setForm={setForm} />

      <div className="team-admin-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
            {t('team.form.department')} *
          </label>
          <select className="inp" value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value as Department }))}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{t(departmentMeta(d).labelKey)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
            {t('team.form.joinedAt')}
          </label>
          <input className="inp" type="date" value={form.joinedAt}
            onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
            {t('admin.form.order')}
          </label>
          <input className="inp" type="number" value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
        </div>
      </div>

      <div className="team-admin-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
            {t('team.form.account')}
          </label>
          <select className="inp" value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}>
            <option value="">{t('team.form.accountNone')}</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>)}
          </select>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{t('team.form.accountHint')}</p>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
            {t('team.form.mentorLink')}
          </label>
          <select className="inp" value={form.mentorId}
            onChange={(e) => setForm((f) => ({ ...f, mentorId: e.target.value }))}>
            <option value="">{t('team.form.mentorNone')}</option>
            {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{t('team.form.mentorHint')}</p>
        </div>
      </div>

      {projects.length > 0 && (
        <div>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
            {t('team.form.projects')} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({form.projectIds.length})</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 180, overflowY: 'auto', padding: 10, border: '1px solid #e2e8f0', borderRadius: 12 }}>
            {projects.map((p) => {
              const on = form.projectIds.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => toggleProject(p.id)} aria-pressed={on}
                  className="tag"
                  style={{ cursor: 'pointer', background: on ? '#0ea5e9' : '#fff', borderColor: on ? '#0ea5e9' : '#e2e8f0', color: on ? '#fff' : '#475569' }}>
                  {p.title.uz}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{t('team.form.projectsHint')}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.leadership}
            onChange={(e) => setForm((f) => ({ ...f, leadership: e.target.checked }))} /> {t('team.form.leadership')}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> {t('admin.form.featuredCheck')}
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} /> {t('team.form.published')}
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button type="submit" disabled={status === 'loading'} className="btn-primary" style={{ opacity: status === 'loading' ? 0.7 : 1 }}>
          {status === 'loading' ? t('common.saving') : t('common.save')}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">{t('common.cancel')}</button>
      </div>

      <style>{`@media(max-width:760px){.team-admin-row{grid-template-columns:1fr!important}}`}</style>
    </form>
  );
}

export default function AdminTeamPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const [members, setMembers] = useState<TeamMemberAdmin[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [editing, setEditing] = useState<TeamFormState | null>(null);

  const load = (): void => {
    setStatus('loading');
    Promise.all([listTeamAdmin(), listUsers({ limit: 100 }), listMentorsAdmin(), listProjectsAdmin()])
      .then(([tm, u, mn, pr]) => {
        setMembers(tm as TeamMemberAdmin[]);
        setUsers(u.items);
        setMentors(mn as MentorOption[]);
        setProjects(pr as ProjectOption[]);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (mem: TeamMemberAdmin): void => setEditing({
    id: mem.id,
    name: mem.name,
    position: mem.position,
    bio: mem.bio,
    photoUrl: mem.photoUrl || '',
    focusX: mem.focusX ?? DEFAULT_FOCUS,
    focusY: mem.focusY ?? DEFAULT_FOCUS,
    skills: mem.skills || [],
    email: mem.email || '',
    phone: mem.phone || '',
    linkedinUrl: mem.linkedinUrl || '',
    githubUrl: mem.githubUrl || '',
    telegramUrl: mem.telegramUrl || '',
    websiteUrl: mem.websiteUrl || '',
    department: mem.department,
    leadership: mem.leadership,
    // <input type="date"> faqat YYYY-MM-DD qabul qiladi, ISO vaqt qismini kesamiz
    joinedAt: mem.joinedAt ? mem.joinedAt.slice(0, 10) : '',
    order: mem.order,
    featured: mem.featured,
    published: mem.published,
    userId: mem.userId || '',
    mentorId: mem.mentorId || '',
    projectIds: (mem.projects || []).map((p) => p.projectId),
  });

  const remove = async (id: string): Promise<void> => {
    if (!(await confirm(t('admin.team.confirmDelete'), { danger: true }))) return;
    try {
      await deleteTeamMember(id);
      load();
    } catch (err: any) {
      toast.error(err.message || t('common.error'));
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.team.title')} sub={t('admin.team.sub')}
        actions={
          !editing ? (
            <button onClick={() => setEditing(emptyForm())} className="btn-primary" style={{ fontSize: 13 }}>
              <Plus size={15} /> {t('admin.team.newBtn')}
            </button>
          ) : undefined
        } />

      {editing && (
        <TeamForm initial={editing} users={users} mentors={mentors} projects={projects}
          onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && members.length === 0 && !editing && (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>{t('admin.team.empty')}</p>
      )}

      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map((mem) => {
            const meta = departmentMeta(mem.department);
            const DeptIcon = meta.icon;
            return (
              <div key={mem.id} className="card admin-row">
                <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: meta.bg, border: `1.5px solid ${meta.border}`, flexShrink: 0, fontSize: 13, fontWeight: 800, color: meta.color }}>
                  {initials(mem.name)}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{mem.name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>
                    {mem.position?.uz} · /team/{mem.slug}
                  </p>
                </div>

                <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: meta.bg, borderColor: meta.border, color: meta.color }}>
                  <DeptIcon size={11} /> {t(meta.labelKey)}
                </span>
                {mem.leadership && (
                  <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}>
                    <Crown size={11} /> {t('team.form.leadership')}
                  </span>
                )}
                {mem.userId && (
                  <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
                    <UserCheck size={11} /> {t('admin.tags.accountLinked')}
                  </span>
                )}
                {mem.mentorId && (
                  <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#faf5ff', borderColor: '#e9d5ff', color: '#9333ea' }}>
                    <GraduationCap size={11} /> {t('team.member.alsoMentor')}
                  </span>
                )}
                {!mem.published && (
                  <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
                    <EyeOff size={11} /> {t('team.form.unpublished')}
                  </span>
                )}

                <button onClick={() => startEdit(mem)} aria-label={t('common.edit')}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(mem.id)} aria-label={t('common.delete')}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
