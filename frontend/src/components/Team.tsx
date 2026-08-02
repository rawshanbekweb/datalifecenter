import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, GitBranch, Briefcase, Send, Globe } from 'lucide-react';
import { listTeam } from '../api/team';
import { TeamMember } from '../types/team';
import { departmentMeta } from './team/departments';
import Loading from './common/Loading';
import BigPersonCard, { PersonSocial } from './common/BigPersonCard';

type Status = 'loading' | 'ready' | 'error';

// Bosh sahifadagi jamoa bo'limi — bu yerda karta ataylab yirik va rasm asosiy
// element: kompaniya "yuzlari" birinchi taassurotni beradi. To'liq ro'yxat
// /team sahifasida, shu sababli faqat birinchi 6 nafar (rahbariyat va tavsiya
// etilganlar oldinda — backend allaqachon shu tartibda qaytaradi).
const PREVIEW_COUNT = 6;

function socialsOf(member: TeamMember): PersonSocial[] {
  const out: PersonSocial[] = [];
  if (member.githubUrl) out.push({ icon: GitBranch, href: member.githubUrl, label: 'GitHub' });
  if (member.linkedinUrl) out.push({ icon: Briefcase, href: member.linkedinUrl, label: 'LinkedIn' });
  if (member.telegramUrl) out.push({ icon: Send, href: member.telegramUrl, label: 'Telegram' });
  if (member.websiteUrl) out.push({ icon: Globe, href: member.websiteUrl, label: 'Website' });
  return out.slice(0, 3);
}

// Karta qobig'i mentorlar bo'limi bilan umumiy (BigPersonCard) — bu yerda
// faqat jamoaga xos ma'lumot (bo'lim nishoni, rahbariyat belgisi) beriladi
function BigTeamCard({ member, index }: { member: TeamMember; index: number }): React.ReactElement {
  const { t } = useTranslation();
  const meta = departmentMeta(member.department);

  return (
    <BigPersonCard
      index={index}
      to={`/team/${member.slug}`}
      name={member.name}
      subtitle={member.position}
      accentColor={meta.color}
      bio={member.bio}
      photoUrl={member.photoUrl}
      focus={member}
      badge={{ icon: meta.icon, label: t(meta.labelKey) }}
      cornerLabel={member.leadership ? t('team.member.leadership') : undefined}
      placeholder={{ from: meta.bg, to: meta.border }}
      socials={socialsOf(member)}
      tags={member.skills.slice(0, 3)}
      tagTheme={{ bg: meta.bg, border: meta.border }}
    />
  );
}

export default function Team(): React.ReactElement | null {
  const { t } = useTranslation();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    listTeam()
      .then((data: TeamMember[]) => { if (!cancelled) { setMembers(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  // Jamoa hali to'ldirilmagan bo'lsa bosh sahifada bo'sh blok qolmasin
  if (status === 'ready' && members.length === 0) return null;

  return (
    <section id="team" className="section-light" style={{ padding: '96px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="pill" style={{ background: '#f0fdfa', borderColor: '#99f6e4', color: '#0d9488' }}>{t('home.team.pill')}</span>
          <h2 className="h-section" style={{ marginBottom: 10 }}>
            {t('home.team.titleStart')}<span className="accent">{t('home.team.titleAccent')}</span>
          </h2>
          <p className="sub">{t('home.team.subtitle')}</p>
        </m.div>

        {status === 'loading' && <Loading center />}
        {status === 'error' && (
          <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 14 }}>{t('home.team.loadError')}</p>
        )}

        {status === 'ready' && (
          <>
            <div className="person-big-grid">
              {members.slice(0, PREVIEW_COUNT).map((mem, i) => (
                <BigTeamCard key={mem.id} member={mem} index={i} />
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link to="/team" style={{ textDecoration: 'none' }}>
                <button className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {t('home.team.cta')} <ArrowRight size={15} />
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
