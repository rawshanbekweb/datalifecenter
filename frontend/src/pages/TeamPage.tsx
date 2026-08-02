import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import TeamMemberCard from '../components/team/TeamMemberCard';
import { DEPARTMENTS, Department, departmentMeta } from '../components/team/departments';
import { listTeam } from '../api/team';
import { TeamMember } from '../types/team';
import Loading from '../components/common/Loading';
import Seo from '../components/common/Seo';

type Status = 'loading' | 'ready' | 'error';
type Filter = Department | 'ALL';

export default function TeamPage(): React.ReactElement {
  const { t } = useTranslation();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [filter, setFilter] = useState<Filter>('ALL');

  useEffect(() => {
    let cancelled = false;
    listTeam()
      .then((data: TeamMember[]) => { if (!cancelled) { setMembers(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  // Rahbariyat sahifa boshida alohida ko'rsatiladi va quyidagi bo'limlarda
  // takrorlanmaydi — aks holda asoschilar ikki marta chiqardi.
  const leaders = useMemo(() => members.filter((m) => m.leadership), [members]);
  const rest = useMemo(() => members.filter((m) => !m.leadership), [members]);

  // Faqat a'zosi bor bo'limlar ko'rsatiladi (bo'sh sarlavhalar chiqmasin)
  const activeDepartments = useMemo(
    () => DEPARTMENTS.filter((d) => rest.some((m) => m.department === d)),
    [rest]
  );

  const visibleDepartments = filter === 'ALL' ? activeDepartments : activeDepartments.filter((d) => d === filter);

  return (
    <section className="section-light" style={{ padding: '160px 0 104px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <Seo title={t('seo.team.title')} description={t('seo.team.description')} />
        <SectionHeader pill={t('pages.team.pill')} title={t('pages.team.title')} accent={t('pages.team.accent')} sub={t('pages.team.sub')} />

        {status === 'loading' && <Loading center />}
        {status === 'error' && <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 14 }}>{t('pages.team.loadError')}</p>}
        {status === 'ready' && members.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>{t('pages.team.empty')}</p>
        )}

        {status === 'ready' && leaders.length > 0 && (
          <div style={{ marginBottom: 64 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 6 }}>
              {t('pages.team.leadership')}
            </h3>
            <p style={{ fontSize: 13.5, color: '#94a3b8', textAlign: 'center', marginBottom: 28 }}>
              {t('pages.team.leadershipSub')}
            </p>
            <div className="team-grid-lead" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(leaders.length, 3)},1fr)`, gap: 20, maxWidth: leaders.length < 3 ? 760 : undefined, margin: '0 auto' }}>
              {leaders.map((mem, i) => <TeamMemberCard key={mem.id} member={mem} index={i} large />)}
            </div>
          </div>
        )}

        {status === 'ready' && activeDepartments.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 36 }}>
            <FilterChip active={filter === 'ALL'} onClick={() => setFilter('ALL')}
              icon={Users} color="#0f172a" border="#e2e8f0" bg="#f8fafc"
              label={`${t('pages.team.all')} (${rest.length})`} />
            {activeDepartments.map((d) => {
              const meta = departmentMeta(d);
              return (
                <FilterChip key={d} active={filter === d} onClick={() => setFilter(d)}
                  icon={meta.icon} color={meta.color} border={meta.border} bg={meta.bg}
                  label={`${t(meta.labelKey)} (${rest.filter((m) => m.department === d).length})`} />
              );
            })}
          </div>
        )}

        {status === 'ready' && visibleDepartments.map((dept) => {
          const meta = departmentMeta(dept);
          const DeptIcon = meta.icon;
          const group = rest.filter((mem) => mem.department === dept);
          return (
            <div key={dept} style={{ marginBottom: 52 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: meta.bg, border: `1.5px solid ${meta.border}`, color: meta.color, flexShrink: 0 }}>
                  <DeptIcon size={16} />
                </span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{t(meta.labelKey)}</h3>
                <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 600 }}>
                  {t('team.card.memberCount', { n: group.length })}
                </span>
              </div>
              <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                {group.map((mem, i) => <TeamMemberCard key={mem.id} member={mem} index={i} />)}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @media(max-width:1024px){
          .team-grid{grid-template-columns:1fr 1fr!important}
          .team-grid-lead{grid-template-columns:1fr 1fr!important}
        }
        @media(max-width:600px){
          .team-grid{grid-template-columns:1fr!important}
          .team-grid-lead{grid-template-columns:1fr!important}
        }
      `}</style>
    </section>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number | string }>;
  label: string;
  color: string;
  bg: string;
  border: string;
}

function FilterChip({ active, onClick, icon: Icon, label, color, bg, border }: FilterChipProps): React.ReactElement {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999,
        fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
        background: active ? color : bg,
        color: active ? '#fff' : color,
        border: `1.5px solid ${active ? color : border}`,
      }}>
      <Icon size={13} /> {label}
    </button>
  );
}
