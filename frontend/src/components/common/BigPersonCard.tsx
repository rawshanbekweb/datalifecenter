import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { focusPosition, ImageFocus } from '../../utils/imageFocus';

/**
 * Bosh sahifadagi yirik rasmli odam kartasi — jamoa a'zolari va mentorlar
 * uchun BITTA komponent.
 *
 * NEGA UMUMIY: ikkala bo'limda ham karta bir xil ishlaydi (4:5 rasm, hover'da
 * yaqinlashish, pastdan chiqadigan ijtimoiy havolalar, butun kartani qoplagan
 * havola). Ikki nusxa saqlansa ular muqarrar ravishda bir-biridan ajralib
 * ketardi — masalan fokus nuqtasi faqat bittasiga qo'shilib qolardi.
 *
 * Uslub `index.css` da (`.person-big-*`): komponent o'z <style> blogini
 * chiqarsa, ekrandagi har karta uchun bir xil qoidalar takrorlanardi.
 */

export interface PersonSocial {
  icon: React.ElementType;
  href: string;
  label: string;
}

export interface BigPersonCardProps {
  /** Animatsiya kechikishi uchun — qator bo'ylab to'lqin hosil qiladi */
  index: number;
  /** Karta bosilganda ochiladigan manzil */
  to: string;
  name: string;
  /** Lavozim yoki mutaxassislik */
  subtitle: string;
  accentColor: string;
  bio?: string;
  photoUrl?: string | null;
  focus?: ImageFocus;
  /** Rasm ustidagi chap yuqori nishon (bo'lim, mutaxassislik) */
  badge: { icon: React.ElementType; label: string };
  /** O'ng yuqori nishon — masalan "Rahbariyat" */
  cornerLabel?: string;
  /** Rasm bo'lmaganda ko'rsatiladigan gradient */
  placeholder: { from: string; to: string };
  socials?: PersonSocial[];
  /** Ko'nikmalar yoki kurslar — kartaning pastida */
  tags?: string[];
  tagTheme?: { bg: string; border: string };
}

function initialsOf(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function BigPersonCard({
  index, to, name, subtitle, accentColor, bio, photoUrl, focus,
  badge, cornerLabel, placeholder, socials = [], tags = [], tagTheme,
}: BigPersonCardProps): React.ReactElement {
  const BadgeIcon = badge.icon;
  // Rasm yuklanmasa gradient + bosh harflar qoladi — bepul hostingda
  // /uploads fayllari deploy oralig'ida yo'qolishi mumkin
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !photoFailed;

  return (
    <m.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      className="card person-big-card"
      style={{ overflow: 'hidden', padding: 0, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      {/* Rasm qismi ataylab havola EMAS: butun kartani ism ustidagi havola
          qoplaydi (.person-big-link::after). Aks holda ijtimoiy havolalar
          <a> ichida <a> bo'lib qolardi — bu yaroqsiz HTML. */}
      <div style={{ position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden' }}>
        {showPhoto ? (
          <img src={photoUrl!} alt={name} onError={() => setPhotoFailed(true)} className="person-big-img"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: focusPosition(focus), display: 'block', transition: 'transform 0.45s ease' }} />
        ) : (
          <div className="person-big-img"
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(150deg, ${placeholder.from}, ${placeholder.to})`, transition: 'transform 0.45s ease' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(48px,7vw,72px)', color: accentColor, opacity: 0.75, letterSpacing: '-0.02em' }}>
              {initialsOf(name)}
            </span>
          </div>
        )}

        {/* Nishon rasm ustida — kartaning pastki matn qismini bo'shatadi */}
        <span style={{ position: 'absolute', top: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: 'calc(100% - 28px)', padding: '6px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(255,255,255,0.94)', color: accentColor, backdropFilter: 'blur(6px)' }}>
          <BadgeIcon size={12} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.label}</span>
        </span>

        {cornerLabel && (
          <span style={{ position: 'absolute', top: 14, right: 14, padding: '6px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(15,23,42,0.82)', color: '#fff', backdropFilter: 'blur(6px)' }}>
            {cornerLabel}
          </span>
        )}

        {/* Ijtimoiy havolalar sichqoncha olib borilganda pastdan chiqadi.
            Rasm ustida turgani uchun o'qilishi kerakli scrim bilan birga keladi. */}
        {socials.length > 0 && (
          <div className="person-big-socials"
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', gap: 8, justifyContent: 'center', padding: '34px 14px 14px', background: 'linear-gradient(to top, rgba(15,23,42,0.72), transparent)', opacity: 0, transform: 'translateY(8px)', transition: 'opacity 0.3s ease, transform 0.3s ease' }}>
            {socials.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} — ${label}`} title={label}
                style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.95)', color: '#0f172a', textDecoration: 'none' }}>
                <Icon size={15} />
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Link to={to} className="person-big-link" style={{ textDecoration: 'none' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4, lineHeight: 1.25 }}>{name}</h3>
          <p style={{ fontSize: 13, color: accentColor, fontWeight: 700, marginBottom: 10 }}>{subtitle}</p>
        </Link>

        {bio && <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 12 }} className="person-big-bio">{bio}</p>}

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto' }}>
            {tags.map((tag) => (
              <span key={tag} className="tag"
                style={{ background: tagTheme?.bg, borderColor: tagTheme?.border, color: accentColor }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </m.div>
  );
}
