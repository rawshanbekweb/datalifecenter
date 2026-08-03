import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { GitBranch, Briefcase, Send, Globe, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TeamMember } from '../../types/team';
import { departmentMeta, initials } from './departments';
import FocusImage from '../common/FocusImage';

interface TeamMemberCardProps {
  member: TeamMember;
  index?: number;
  /** Rahbariyat blokidagi karta biroz kattaroq va foto yirikroq */
  large?: boolean;
}

interface SocialLink {
  icon: React.ElementType;
  href: string;
  label: string;
}

function socialsOf(member: TeamMember): SocialLink[] {
  const out: SocialLink[] = [];
  if (member.githubUrl) out.push({ icon: GitBranch, href: member.githubUrl, label: 'GitHub' });
  if (member.linkedinUrl) out.push({ icon: Briefcase, href: member.linkedinUrl, label: 'LinkedIn' });
  if (member.telegramUrl) out.push({ icon: Send, href: member.telegramUrl, label: 'Telegram' });
  if (member.websiteUrl) out.push({ icon: Globe, href: member.websiteUrl, label: 'Website' });
  if (member.email) out.push({ icon: Mail, href: `mailto:${member.email}`, label: member.email });
  return out;
}

export default function TeamMemberCard({ member, index = 0, large = false }: TeamMemberCardProps): React.ReactElement {
  const { t } = useTranslation();
  const theme = departmentMeta(member.department);
  const DeptIcon = theme.icon;
  // Rasm yuklanmasa bosh harflar ko'rsatiladi — MentorCard bilan bir xil sabab:
  // bepul hosting'da /uploads fayllari deploy oralig'ida yo'qolib ketishi mumkin.
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(member.photoUrl) && !photoFailed;
  const socials = socialsOf(member);
  const size = large ? 96 : 72;

  return (
    <m.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      className="card"
      style={{ padding: large ? 28 : 24, textAlign: 'center', background: theme.bg, border: `1.5px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}
    >
      <Link to={`/team/${member.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {showPhoto ? (
          <FocusImage
            src={member.photoUrl!}
            alt={member.name}
            size={size}
            radius="circle"
            focus={member}
            onError={() => setPhotoFailed(true)}
            style={{ margin: '0 auto 16px', border: `2px solid ${theme.border}` }}
          />
        ) : (
          <div style={{ display: 'flex', width: size, height: size, borderRadius: '50%', margin: '0 auto 16px', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `2px solid ${theme.border}`, fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: large ? 28 : 22, color: theme.color }}>
            {initials(member.name)}
          </div>
        )}

        <h3 style={{ fontSize: large ? 18 : 16, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>{member.name}</h3>
        <p style={{ fontSize: 12.5, color: theme.color, fontWeight: 700, marginBottom: 10 }}>{member.position}</p>
      </Link>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', borderColor: theme.border, color: theme.color }}>
          <DeptIcon size={11} /> {t(theme.labelKey)}
        </span>
      </div>

      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.75, marginBottom: 14 }}>{member.bio}</p>

      {member.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginBottom: 14 }}>
          {member.skills.slice(0, 5).map((s) => (
            <span key={s} className="tag" style={{ background: '#fff', borderColor: theme.border, color: '#475569' }}>{s}</span>
          ))}
          {member.skills.length > 5 && (
            <span className="tag" style={{ background: '#fff', borderColor: theme.border, color: '#94a3b8' }}>+{member.skills.length - 5}</span>
          )}
        </div>
      )}

      {/* Pastki qatorni kartaning oxiriga yopishtiradi — turli uzunlikdagi biolar bilan ham qator tekis ko'rinadi */}
      <div style={{ marginTop: 'auto' }}>
        {member.projects.length > 0 && (
          <p style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 10 }}>
            {t('team.card.projectCount', { n: member.projects.length })}
          </p>
        )}

        {socials.length > 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', paddingTop: 14, borderTop: `1px solid ${theme.border}` }}>
            {socials.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}
                style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1px solid ${theme.border}`, color: theme.color, textDecoration: 'none' }}>
                <Icon size={14} />
              </a>
            ))}
          </div>
        )}
      </div>
    </m.div>
  );
}
