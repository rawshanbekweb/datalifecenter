import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, GitBranch, Briefcase, Send, Globe } from 'lucide-react';
import { listTeam } from '../api/team';
import { TeamMember } from '../types/team';
import { departmentMeta, initials } from './team/departments';
import Loading from './common/Loading';
import { focusPosition } from '../utils/imageFocus';

type Status = 'loading' | 'ready' | 'error';

// Bosh sahifadagi jamoa bo'limi — bu yerda karta ataylab yirik va rasm asosiy
// element: kompaniya "yuzlari" birinchi taassurotni beradi. To'liq ro'yxat
// /team sahifasida, shu sababli faqat birinchi 6 nafar (rahbariyat va tavsiya
// etilganlar oldinda — backend allaqachon shu tartibda qaytaradi).
const PREVIEW_COUNT = 6;

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
  return out.slice(0, 3);
}

function BigTeamCard({ member, index }: { member: TeamMember; index: number }): React.ReactElement {
  const { t } = useTranslation();
  const meta = departmentMeta(member.department);
  const DeptIcon = meta.icon;
  // Rasm yuklanmasa bo'lim rangidagi gradient + bosh harflar qoladi —
  // bepul hostingda /uploads fayllari deploy oralig'ida yo'qolishi mumkin.
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(member.photoUrl) && !photoFailed;
  const socials = socialsOf(member);

  return (
    <m.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      className="card team-big-card"
      style={{ overflow: 'hidden', padding: 0, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      {/* Rasm qismi ataylab havola EMAS: butun kartani ism ustidagi havola
          qoplaydi (.team-big-link::after). Aks holda ijtimoiy havolalar
          <a> ichida <a> bo'lib qolardi — bu yaroqsiz HTML. */}
      <div style={{ position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden' }}>
        {showPhoto ? (
          <img src={member.photoUrl!} alt={member.name} onError={() => setPhotoFailed(true)} className="team-big-img"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: focusPosition(member), display: 'block', transition: 'transform 0.45s ease' }} />
        ) : (
          <div className="team-big-img"
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(150deg, ${meta.bg}, ${meta.border})`, transition: 'transform 0.45s ease' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(48px,7vw,72px)', color: meta.color, opacity: 0.75, letterSpacing: '-0.02em' }}>
              {initials(member.name)}
            </span>
          </div>
        )}

        {/* Bo'lim nishoni rasm ustida — kartaning pastki matn qismini bo'shatadi */}
        <span style={{ position: 'absolute', top: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(255,255,255,0.94)', color: meta.color, backdropFilter: 'blur(6px)' }}>
          <DeptIcon size={12} /> {t(meta.labelKey)}
        </span>

        {member.leadership && (
          <span style={{ position: 'absolute', top: 14, right: 14, padding: '6px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(15,23,42,0.82)', color: '#fff', backdropFilter: 'blur(6px)' }}>
            {t('team.member.leadership')}
          </span>
        )}

        {/* Ijtimoiy havolalar sichqoncha olib borilganda pastdan chiqadi.
            Rasm ustida turgani uchun o'qilishi kerakli scrim bilan birga keladi. */}
        {socials.length > 0 && (
          <div className="team-big-socials"
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', gap: 8, justifyContent: 'center', padding: '34px 14px 14px', background: 'linear-gradient(to top, rgba(15,23,42,0.72), transparent)', opacity: 0, transform: 'translateY(8px)', transition: 'opacity 0.3s ease, transform 0.3s ease' }}>
            {socials.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} — ${label}`} title={label}
                style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.95)', color: '#0f172a', textDecoration: 'none' }}>
                <Icon size={15} />
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Link to={`/team/${member.slug}`} className="team-big-link" style={{ textDecoration: 'none' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4, lineHeight: 1.25 }}>{member.name}</h3>
          <p style={{ fontSize: 13, color: meta.color, fontWeight: 700, marginBottom: 10 }}>{member.position}</p>
        </Link>

        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 12 }} className="team-big-bio">{member.bio}</p>

        {member.skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto' }}>
            {member.skills.slice(0, 3).map((s) => (
              <span key={s} className="tag" style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}>{s}</span>
            ))}
          </div>
        )}
      </div>
    </m.div>
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
            <div className="team-home-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
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
      <style>{`
        @media(max-width:1024px){.team-home-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:600px){.team-home-grid{grid-template-columns:1fr!important}}
        .team-big-card:hover .team-big-img{transform:scale(1.05)}
        .team-big-card:hover .team-big-socials{opacity:1;transform:translateY(0)}
        /* Ismdagi havola butun kartani qoplaydi — rasm ham bosiladigan bo'ladi,
           lekin HTML'da bitta <a> qoladi. Ijtimoiy havolalar undan yuqorida turadi. */
        .team-big-link::after{content:'';position:absolute;inset:0;z-index:1}
        .team-big-socials{z-index:2}
        .team-big-link:focus-visible::after{outline:2px solid #0d9488;outline-offset:-3px;border-radius:16px}
        /* Bio uzunligi har xil — karta balandligi tekis qolishi uchun 3 qatorda kesiladi */
        .team-big-bio{display:-webkit-box;-webkit-line-clamp:3;line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        /* Sichqonchasiz (sensorli) qurilmalarda hover yo'q — havolalar doim ko'rinadi */
        @media(hover:none){.team-big-socials{opacity:1!important;transform:none!important}}
      `}</style>
    </section>
  );
}
