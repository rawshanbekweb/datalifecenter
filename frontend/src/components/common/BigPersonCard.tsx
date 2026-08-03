import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { FOCUS_BASE_POSITION, focusPan, ImageFocus } from '../../utils/imageFocus';

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

/**
 * Rasm karta chetidan qancha ichkarida turishi.
 *
 * Ataylab kichik (10px): maqsad rasmni "ramkaga solish", uni kichraytirib
 * yuborish emas. Kattaroq qiymatda karta bo'sh joyga to'lib, rasm markadagi
 * kichik surat bo'lib qolardi.
 */
const PHOTO_INSET = 10;
const PHOTO_RADIUS = 14;

/**
 * Bosh ortidagi yumshoq yorug'lik — "studiya foni" taassurotini beradi.
 * Tekis gradient ustida odam yassi ko'rinardi.
 */
const HEAD_GLOW = 'radial-gradient(ellipse 68% 52% at 50% 20%, rgba(255,255,255,0.8), transparent 72%)';
/**
 * Oyoq ostidagi kontakt soyasi — odam kadr tagida "turgandek" bo'ladi.
 * Busiz kesib olingan portret fon ustiga yopishtirilgandek osilib turardi.
 */
const GROUND_SHADOW = 'radial-gradient(ellipse 46% 7% at 50% 100%, rgba(15,23,42,0.22), transparent 70%)';

/**
 * Rasm sahna balandligining necha foizini egallashi.
 *
 * 100% EMAS — tepada ataylab bo'sh joy qoldiriladi. Sichqoncha olib
 * borilganda rasm `scale(1.05)` bilan kattalashadi va pastdan o'sadi
 * (`transform-origin: 50% 100%`), ya'ni tepasi 90 × 1.05 = 94.5% ga
 * ko'tariladi va kadr chetiga yetmaydi. To'liq balandlikda esa hover
 * paytida boshning tepasi kesilib qolardi.
 *
 * O'zgartirilsa `index.css` dagi hover koeffitsienti bilan birga
 * tekshirilishi kerak: PHOTO_HEIGHT × scale < 100 bo'lishi shart.
 */
const PHOTO_HEIGHT = '90%';

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
          <a> ichida <a> bo'lib qolardi — bu yaroqsiz HTML.

          Rasm karta chetiga tegib turmaydi: orqasida ochroq matte qatlam
          qoladi va rasmning o'zi ozgina kichrayadi — yalang'och oq fon ham
          yo'qoladi, kadrdagi odam ham "siqilib" turmaydi. */}
      <div style={{ position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden', padding: PHOTO_INSET, background: placeholder.from }}>
        {/* Yaqinlashish animatsiyasi shu ichki qatlamda kesiladi, aks holda
            rasm burchaklardan chiqib, orqa qatlamni yopib ketardi.

            Fon — studiya foni kabi: tepadan pastga quyuqlashadigan gradient,
            bosh ortida yorug'lik dog'i, tagida kontakt soyasi. */}
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: PHOTO_RADIUS, overflow: 'hidden', background: `linear-gradient(180deg, ${placeholder.from} 0%, ${placeholder.to} 100%)` }}>
          {showPhoto ? (
            <>
              {/* Yorug'lik va soya rasmdan OLDIN keladi — ikkalasi ham
                  joylashtirilgan qatlam, ya'ni ustma-ust tushishini DOM
                  tartibi hal qiladi va rasm eng ustida qoladi. */}
              <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: HEAD_GLOW }} />
              <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: GROUND_SHADOW }} />
              {/* `scale-down` = `contain` va `none` ning kichigi, ya'ni rasm
                  KATTALASHTIRILMAYDI. Katta portret kadrga sig'adi (odam
                  to'liq ko'rinadi, hech qayeri kesilmaydi), kichkina fayl esa
                  o'z o'lchamida qoladi — aks holda 116x117 logotip karta
                  bo'ylab cho'zilib loyqa dog' bo'lib turardi.

                  `object-position` pastga tayangan: shaffof fonli kesib
                  olingan portret kadr tagida TURADI, o'rtada osilib qolmaydi.

                  Fokus nuqtasi ALOHIDA o'rovchi qatlamga `transform` bo'lib
                  tushadi, rasmning o'ziga emas: hover'dagi `scale(1.05)`
                  (.person-big-img, index.css) inline transform'ni bosib
                  ketardi. Ikki qatlam — ikki transform, to'qnashuv yo'q. */}
              <span style={{ position: 'absolute', inset: 0, transform: focusPan(focus) }}>
                <img src={photoUrl!} alt={name} onError={() => setPhotoFailed(true)} className="person-big-img"
                  loading="lazy" decoding="async"
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: PHOTO_HEIGHT, objectFit: 'scale-down', objectPosition: FOCUS_BASE_POSITION, display: 'block', transition: 'transform 0.45s ease' }} />
              </span>
            </>
          ) : (
            /* Rasmsiz karta ham AYNAN o'sha sahnada turadi (yorug'lik + soya) —
               busiz zaxira ko'rinish qo'shni kartalar yonida yassi va begona
               ko'rinardi. Bosh harflar gradientning o'zi ustida. */
            <>
              <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: HEAD_GLOW }} />
              <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: GROUND_SHADOW }} />
              <div className="person-big-img"
                style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.45s ease' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(44px,6.5vw,66px)', color: accentColor, opacity: 0.55, letterSpacing: '-0.02em' }}>
                  {initialsOf(name)}
                </span>
              </div>
            </>
          )}

          {/* Nishon rasm ustida — kartaning pastki matn qismini bo'shatadi */}
          <span style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: 'calc(100% - 24px)', padding: '6px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(255,255,255,0.94)', color: accentColor, backdropFilter: 'blur(6px)' }}>
            <BadgeIcon size={12} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.label}</span>
          </span>

          {cornerLabel && (
            <span style={{ position: 'absolute', top: 12, right: 12, padding: '6px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(15,23,42,0.82)', color: '#fff', backdropFilter: 'blur(6px)' }}>
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
