import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, Phone, Send, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listTeam } from '../../api/team';
import { TeamMember } from '../../types/team';
import { departmentMeta, initials } from '../../components/team/departments';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Loading from '../../components/common/Loading';
import FocusImage from '../../components/common/FocusImage';

type Status = 'loading' | 'ready' | 'error';

// Hamkasblar ma'lumotnomasi — kim nima bilan shug'ullanadi va qanday bog'lanish mumkin.
// Ommaviy /team bilan bir manbadan oziqlanadi, lekin bu yerda qidiruvli ixcham ro'yxat.
export default function TeamDirectoryPage(): React.ReactElement {
  const { t } = useTranslation();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    listTeam()
      .then((data: TeamMember[]) => { if (!cancelled) { setMembers(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((mem) =>
      mem.name.toLowerCase().includes(q) ||
      mem.position.toLowerCase().includes(q) ||
      mem.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [members, query]);

  return (
    <div>
      <AdminPageHeader title={t('team.directory.title')} sub={t('team.directory.sub')} />

      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 18 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input className="inp" style={{ paddingLeft: 34 }} value={query}
          onChange={(e) => setQuery(e.target.value)} placeholder={t('team.directory.search')} />
      </div>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}
      {status === 'ready' && filtered.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>{t('team.directory.empty')}</p>
      )}

      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((mem) => {
            const meta = departmentMeta(mem.department);
            const DeptIcon = meta.icon;
            return (
              <div key={mem.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
                {mem.photoUrl ? (
                  <FocusImage src={mem.photoUrl} alt="" size={40} radius="circle" focus={mem} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: meta.bg, border: `1.5px solid ${meta.border}`, flexShrink: 0, fontSize: 13, fontWeight: 800, color: meta.color }}>
                    {initials(mem.name)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 150 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{mem.name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{mem.position}</p>
                </div>

                <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: meta.bg, borderColor: meta.border, color: meta.color }}>
                  <DeptIcon size={11} /> {t(meta.labelKey)}
                </span>

                <div style={{ display: 'flex', gap: 6 }}>
                  {mem.email && <IconLink icon={Mail} href={`mailto:${mem.email}`} label={mem.email} />}
                  {mem.phone && <IconLink icon={Phone} href={`tel:${mem.phone}`} label={mem.phone} />}
                  {mem.telegramUrl && <IconLink icon={Send} href={mem.telegramUrl} label="Telegram" />}
                  <Link to={`/team/${mem.slug}`} target="_blank" rel="noopener noreferrer" title={t('team.directory.openProfile')}
                    style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', color: '#475569' }}>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconLink({ icon: Icon, href, label }: { icon: React.ElementType; href: string; label: string }): React.ReactElement {
  return (
    <a href={href} title={label} aria-label={label}
      style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', color: '#475569' }}>
      <Icon size={13} />
    </a>
  );
}
