import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, GitBranch, Briefcase, Send, Globe, Mail, Phone, CalendarDays, GraduationCap, ExternalLink } from 'lucide-react';
import { getTeamMember } from '../api/team';
import { TeamMember } from '../types/team';
import { departmentMeta, initials } from '../components/team/departments';
import { formatDate } from '../utils/format';
import ComingSoon from '../components/common/ComingSoon';
import Loading from '../components/common/Loading';
import Seo from '../components/common/Seo';
import JsonLd from '../components/common/JsonLd';
import { SITE_URL } from '../api/config';
import { focusPosition } from '../utils/imageFocus';

interface ApiError {
  status?: number;
}

type Status = 'loading' | 'ready' | 'not-found' | 'error';

export default function TeamMemberPage(): React.ReactElement {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPhotoFailed(false);
    getTeamMember(slug!)
      .then((data: TeamMember) => { if (!cancelled) { setMember(data); setStatus('ready'); } })
      .catch((err: ApiError) => { if (!cancelled) setStatus(err.status === 404 ? 'not-found' : 'error'); });
    return () => { cancelled = true; };
  }, [slug]);

  if (status === 'loading') {
    return <section style={{ padding: '200px 24px 80px' }}><Loading page /></section>;
  }

  if (status !== 'ready' || !member) {
    return (
      <ComingSoon
        title={status === 'not-found' ? t('pages.teamMember.notFound') : t('pages.teamMember.loadError')}
        sub={status === 'not-found' ? t('pages.teamMember.notFoundSub') : ''}
      />
    );
  }

  const theme = departmentMeta(member.department);
  const DeptIcon = theme.icon;
  const showPhoto = Boolean(member.photoUrl) && !photoFailed;

  const contacts = [
    member.email && { icon: Mail, href: `mailto:${member.email}`, label: member.email },
    member.phone && { icon: Phone, href: `tel:${member.phone}`, label: member.phone },
    member.telegramUrl && { icon: Send, href: member.telegramUrl, label: 'Telegram' },
    member.linkedinUrl && { icon: Briefcase, href: member.linkedinUrl, label: 'LinkedIn' },
    member.githubUrl && { icon: GitBranch, href: member.githubUrl, label: 'GitHub' },
    member.websiteUrl && { icon: Globe, href: member.websiteUrl, label: t('team.member.website') },
  ].filter(Boolean) as { icon: React.ElementType; href: string; label: string }[];

  return (
    <section className="section-light" style={{ padding: '140px 0 96px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px' }}>
        <Seo
          title={`${member.name} — ${member.position}`}
          description={member.bio}
          image={member.photoUrl || undefined}
        />
        {/* Qidiruvda xodim "shaxs" sifatida tanilishi uchun — kompaniya bilan bog'langan holda */}
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: member.name,
          jobTitle: member.position,
          description: member.bio,
          ...(member.photoUrl ? { image: member.photoUrl } : {}),
          ...(member.email ? { email: member.email } : {}),
          ...(member.skills.length ? { knowsAbout: member.skills } : {}),
          worksFor: { '@type': 'Organization', name: 'DATA LIFE', url: SITE_URL },
          url: `${SITE_URL}/team/${member.slug}`,
        }} />

        <Link to="/team" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: '#64748b', textDecoration: 'none', marginBottom: 24 }}>
          <ArrowLeft size={15} /> {t('pages.teamMember.back')}
        </Link>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          className="card team-hero" style={{ padding: 32, background: theme.bg, border: `1.5px solid ${theme.border}`, display: 'flex', gap: 28, alignItems: 'center', marginBottom: 24 }}>
          {showPhoto ? (
            <img src={member.photoUrl!} alt={member.name} onError={() => setPhotoFailed(true)}
              style={{ width: 132, height: 132, borderRadius: 20, objectFit: 'cover', objectPosition: focusPosition(member), border: `2px solid ${theme.border}`, flexShrink: 0 }} />
          ) : (
            <div style={{ width: 132, height: 132, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `2px solid ${theme.border}`, fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 40, color: theme.color, flexShrink: 0 }}>
              {initials(member.name)}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 6, lineHeight: 1.2 }}>{member.name}</h1>
            <p style={{ fontSize: 15, color: theme.color, fontWeight: 700, marginBottom: 14 }}>{member.position}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', borderColor: theme.border, color: theme.color }}>
                <DeptIcon size={11} /> {t(theme.labelKey)}
              </span>
              {member.leadership && (
                <span className="tag" style={{ background: '#fff', borderColor: '#fde68a', color: '#b45309' }}>{t('team.member.leadership')}</span>
              )}
              {member.mentor && (
                <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', borderColor: '#e9d5ff', color: '#9333ea' }}>
                  <GraduationCap size={11} /> {t('team.member.alsoMentor')}
                </span>
              )}
              {member.joinedAt && (
                <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', borderColor: theme.border, color: '#64748b' }}>
                  <CalendarDays size={11} /> {t('team.member.joined', { date: formatDate(member.joinedAt) })}
                </span>
              )}
            </div>
          </div>
        </m.div>

        <div className="team-cols" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Panel title={t('team.member.about')}>
              <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{member.bio}</p>
            </Panel>

            {member.projects.length > 0 && (
              <Panel title={t('team.member.projects')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {member.projects.map((link) => (
                    <div key={link.project.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                        {link.project.screenshotUrl && (
                          <img src={link.project.screenshotUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{link.project.title}</p>
                        {/* Loyihadagi aniq roli kiritilmagan bo'lsa umumiy lavozimi ko'rsatiladi */}
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>{link.role || member.position} · {link.project.category}</p>
                      </div>
                      {link.project.liveUrl && (
                        <a href={link.project.liveUrl} target="_blank" rel="noopener noreferrer" aria-label={link.project.title}
                          style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', color: '#475569', flexShrink: 0 }}>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {member.mentor?.courses && member.mentor.courses.length > 0 && (
              <Panel title={t('team.member.courses')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {member.mentor.courses.map((c) => (
                    <Link key={c.id} to={`/courses/${c.slug}`} className="tag"
                      style={{ background: '#faf5ff', borderColor: '#e9d5ff', color: '#9333ea', textDecoration: 'none' }}>
                      {c.title}
                    </Link>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {member.skills.length > 0 && (
              <Panel title={t('team.member.skills')}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {member.skills.map((s) => (
                    <span key={s} className="tag" style={{ background: theme.bg, borderColor: theme.border, color: theme.color }}>{s}</span>
                  ))}
                </div>
              </Panel>
            )}

            {contacts.length > 0 && (
              <Panel title={t('team.member.contact')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contacts.map(({ icon: Icon, href, label }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#475569', textDecoration: 'none', wordBreak: 'break-all' }}>
                      <Icon size={14} style={{ color: theme.color, flexShrink: 0 }} /> {label}
                    </a>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:820px){
          .team-cols{grid-template-columns:1fr!important}
          .team-hero{flex-direction:column!important;text-align:center}
        }
      `}</style>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="card" style={{ padding: 24 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>{title}</h2>
      {children}
    </div>
  );
}
