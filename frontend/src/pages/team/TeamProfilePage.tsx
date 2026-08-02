import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, UserRound, ExternalLink, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTeamMemberMe, updateTeamMemberMe } from '../../api/team';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import TeamProfileFields from '../../components/team/TeamProfileFields';
import { departmentMeta } from '../../components/team/departments';
import { TeamMemberAdmin, TeamProfileFormState, emptyTeamProfileForm } from '../../types/team';
import TeamNotLinked from './TeamNotLinked';
import Loading from '../../components/common/Loading';
import { DEFAULT_FOCUS } from '../../utils/imageFocus';

type Status = 'loading' | 'ready' | 'not-linked' | 'error';

// Xodim saytdagi ommaviy jamoa profilini o'zi tahrirlaydi.
// Bo'lim, rahbariyat belgisi va nashr holati ataylab yo'q — ular admin qo'lida.
export default function TeamProfilePage(): React.ReactElement {
  const { t } = useTranslation();
  const [form, setForm] = useState<TeamProfileFormState>(emptyTeamProfileForm());
  const [member, setMember] = useState<TeamMemberAdmin | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    getTeamMemberMe()
      .then((m: TeamMemberAdmin) => {
        if (cancelled) return;
        setMember(m);
        setForm({
          name: m.name || '',
          position: m.position || { uz: '' },
          bio: m.bio || { uz: '' },
          photoUrl: m.photoUrl || '',
          focusX: m.focusX ?? DEFAULT_FOCUS,
          focusY: m.focusY ?? DEFAULT_FOCUS,
          skills: m.skills || [],
          email: m.email || '',
          phone: m.phone || '',
          linkedinUrl: m.linkedinUrl || '',
          githubUrl: m.githubUrl || '',
          telegramUrl: m.telegramUrl || '',
          websiteUrl: m.websiteUrl || '',
        });
        setStatus('ready');
      })
      .catch((err: { message?: string; code?: string }) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        setStatus(err.code === 'TEAM_PROFILE_NOT_LINKED' ? 'not-linked' : 'error');
      });
    return () => { cancelled = true; };
  }, []);

  // Har qanday o'zgarish "saqlandi" xabarini o'chiradi — eski holat yangi
  // tahrir ustida turib qolmasin
  const updateForm: React.Dispatch<React.SetStateAction<TeamProfileFormState>> = (next) => {
    setSaveState('idle');
    setForm(next);
  };

  const save = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaveState('saving');
    try {
      const updated = await updateTeamMemberMe(form);
      setMember((prev) => (prev ? { ...prev, ...updated } : prev));
      setSaveState('success');
    } catch (err: unknown) {
      setSaveError((err as Error).message || t('common.error'));
      setSaveState('error');
    }
  };

  const meta = member ? departmentMeta(member.department) : null;

  return (
    <div>
      <AdminPageHeader title={t('team.profile.title')} sub={t('team.profile.sub')} />

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}
      {status === 'not-linked' && <TeamNotLinked message={errorMsg} />}

      {status === 'ready' && member && (
        <form onSubmit={save} className="card" style={{ padding: 24, maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              <UserRound size={16} style={{ color: '#0d9488' }} /> {t('team.profile.publicProfile')}
            </p>
            {meta && (
              <span className="tag" style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}>
                {t(meta.labelKey)}
              </span>
            )}
            {member.published ? (
              <Link to={`/team/${member.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#0ea5e9', textDecoration: 'none', marginLeft: 'auto' }}>
                <ExternalLink size={13} /> {t('team.profile.viewPublic')}
              </Link>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#94a3b8', marginLeft: 'auto' }}>
                <EyeOff size={13} /> {t('team.profile.notPublished')}
              </span>
            )}
          </div>

          {!member.published && (
            <p style={{ fontSize: 12.5, color: '#b45309', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: '10px 14px', lineHeight: 1.7 }}>
              {t('team.profile.notPublishedHint')}
            </p>
          )}

          {saveState === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
              <CheckCircle size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{t('team.profile.saved')}</p>
            </div>
          )}
          {saveState === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
              <AlertCircle size={15} style={{ color: '#dc2626', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>{saveError}</p>
            </div>
          )}

          <TeamProfileFields form={form} setForm={updateForm} />

          <button type="submit" disabled={saveState === 'saving'} className="btn-primary"
            style={{ alignSelf: 'flex-start', opacity: saveState === 'saving' ? 0.7 : 1 }}>
            {saveState === 'saving' ? t('common.saving') : t('common.save')}
          </button>
        </form>
      )}
    </div>
  );
}
