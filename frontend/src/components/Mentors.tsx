import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, GraduationCap, GitBranch, Briefcase, Send } from 'lucide-react';
import { listMentors } from '../api/mentors';
import { MentorCardData } from './mentors/MentorCard';
import Loading from './common/Loading';
import BigPersonCard, { PersonSocial } from './common/BigPersonCard';

type Status = 'loading' | 'ready' | 'error';

/**
 * Bosh sahifadagi mentorlar bo'limi.
 *
 * Karta qobig'i jamoa bo'limi bilan UMUMIY (`BigPersonCard`) — yirik rasm
 * birinchi taassurotni beradi. To'liq ro'yxat `/mentors` sahifasida, shu
 * sababli bu yerda faqat birinchi oltitasi ko'rsatiladi (backend tavsiya
 * etilganlarni oldinda qaytaradi).
 */
const PREVIEW_COUNT = 6;

/**
 * Fon ataylab yumshoq gradient, tayyor `section-light`/`section-gray` emas.
 *
 * Tepadagi Kurslar bo'limi oq fonda: bu bo'lim ham tekis oq bo'lsa ikkalasi
 * bitta uzun oq maydonga qo'shilib ketardi. Kulrangga o'tkazish esa pastdagi
 * Xizmatlar bilan qo'shib yuborardi. Yumshoq gradient ikkala qo'shnidan ham
 * ajratadi, lekin sahifadagi oq/kulrang navbatni buzmaydi.
 */
const SECTION_BG = 'linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #ffffff 100%)';

// Ranglar ketma-ket almashadi — bir xil rangdagi kartalar qatori bo'lmasin.
// `/mentors` sahifasidagi kartalar bilan bir xil palitra (MentorCard.tsx).
const PALETTE = [
  { color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  { color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
];

function socialsOf(mentor: MentorCardData): PersonSocial[] {
  const out: PersonSocial[] = [];
  if (mentor.githubUrl) out.push({ icon: GitBranch, href: mentor.githubUrl, label: 'GitHub' });
  if (mentor.linkedinUrl) out.push({ icon: Briefcase, href: mentor.linkedinUrl, label: 'LinkedIn' });
  if (mentor.telegramUrl) out.push({ icon: Send, href: mentor.telegramUrl, label: 'Telegram' });
  return out;
}

function BigMentorCard({ mentor, index }: { mentor: MentorCardData; index: number }): React.ReactElement {
  const { t } = useTranslation();
  const theme = PALETTE[index % PALETTE.length];

  // Amaldagi ma'lumotda `specialty` ko'pincha umumiy ("Mentor"), `position`
  // esa aniq ("AI Engineer") — shuning uchun sarlavha ostida aniqrog'i turadi
  const position = typeof mentor.position === 'string' ? mentor.position : '';
  const subtitle = position || mentor.specialty || t('home.mentors.badge');
  // Nishon sarlavha ostidagi matnni takrorlamasin
  const badgeLabel = mentor.specialty && mentor.specialty !== subtitle
    ? mentor.specialty
    : t('home.mentors.badge');

  return (
    <BigPersonCard
      index={index}
      // Mentorning shaxsiy sahifasi `/team/<slug>` da (Mentor modelida slug
      // yo'q — u jamoa a'zosi sifatida yashaydi). Bog'lanmagan mentor uchun
      // ro'yxatga qaytamiz, aks holda havola 404 ga olib borardi.
      to={mentor.teamSlug ? `/team/${mentor.teamSlug}` : '/mentors'}
      name={mentor.name}
      subtitle={subtitle}
      accentColor={theme.color}
      bio={mentor.bio}
      photoUrl={mentor.photoUrl}
      focus={mentor}
      badge={{ icon: GraduationCap, label: badgeLabel }}
      placeholder={{ from: theme.bg, to: theme.border }}
      socials={socialsOf(mentor)}
      // Mentor qaysi kurslarni olib borishi — eng foydali qo'shimcha ma'lumot
      tags={(mentor.courses ?? []).slice(0, 3).map((c) => c.title)}
      tagTheme={{ bg: theme.bg, border: theme.border }}
    />
  );
}

export default function Mentors(): React.ReactElement | null {
  const { t } = useTranslation();
  const [mentors, setMentors] = useState<MentorCardData[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    listMentors()
      .then((data: MentorCardData[]) => { if (!cancelled) { setMentors(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  // Mentorlar hali qo'shilmagan bo'lsa bosh sahifada bo'sh blok qolmasin
  if (status === 'ready' && mentors.length === 0) return null;

  return (
    <section id="mentors" style={{ padding: '96px 0', background: SECTION_BG }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="pill">{t('home.mentors.pill')}</span>
          <h2 className="h-section" style={{ marginBottom: 10 }}>
            {t('home.mentors.titleStart')}<span className="accent">{t('home.mentors.titleAccent')}</span>
          </h2>
          <p className="sub">{t('home.mentors.subtitle')}</p>
        </m.div>

        {status === 'loading' && <Loading center />}
        {status === 'error' && (
          <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 14 }}>{t('home.mentors.loadError')}</p>
        )}

        {status === 'ready' && (
          <>
            <div className="person-big-grid">
              {mentors.slice(0, PREVIEW_COUNT).map((mentor, i) => (
                <BigMentorCard key={mentor.id} mentor={mentor} index={i} />
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link to="/mentors" style={{ textDecoration: 'none' }}>
                <button className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {t('home.mentors.cta')} <ArrowRight size={15} />
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
