import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Camera, ImagePlus, Pause, Play } from 'lucide-react';
import { focusPosition, ImageFocus } from '../../utils/imageFocus';

/**
 * "DATA LIFE'da bir kun" — bosh sahifadagi kichik galereya.
 *
 * Ko'rinishi ataylab Instagram "story" siga o'xshash: tepada har bir surat
 * uchun bo'lakli progress chizig'i, rasm o'zi almashib turadi, kartaning
 * chap/o'ng yarmiga bosib orqaga-oldinga o'tiladi, barmoq bilan suriladi.
 *
 * NEGA SHUNDAY: bu blok Hero'ning o'ng ustunida turadi va oldin u yerda
 * yasama "terminal" animatsiyasi bo'lgan. Haqiqiy ofis suratlari sahifaga
 * jonlilik beradi; story ko'rinishi esa surat kam bo'lganda ham to'liq va
 * qasddan qilingan ko'rinadi (oddiy karusel bitta rasm bilan bo'sh ko'rinardi).
 */

export interface MomentItem extends ImageFocus {
  id: string;
  imageUrl: string;
  title: string;
  caption?: string | null;
  happenedAt?: string | null;
}

interface MomentsStoryProps {
  items: MomentItem[];
}

// Bitta surat ekranda necha millisekund turadi
const SLIDE_MS = 5000;
// Progress chizig'i shuncha qadamda yangilanadi (silliq, lekin arzon)
const TICK_MS = 50;
// Barmoq shu masofadan ko'p sursa — slayd almashadi, kamida — bosish deb qaraladi
const SWIPE_PX = 40;

// Kadrning umumiy o'lchamlari — to'ldirilgan holat bilan bo'sh "iz" holati
// AYNAN bir xil bo'lishi uchun bitta joyda saqlanadi
const FRAME: React.CSSProperties = {
  position: 'relative', aspectRatio: '4 / 5', borderRadius: 20, overflow: 'hidden',
  boxShadow: '0 12px 40px rgba(15,23,42,0.16)', border: '1px solid rgba(255,255,255,0.6)',
};

const BADGE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999,
  background: 'rgba(15,23,42,0.42)', backdropFilter: 'blur(6px)',
  color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.01em',
};

/**
 * Surat hali qo'shilmagandagi "iz" — bo'sh joy qoldirmaydi, kelajakdagi
 * kadrning konturini ko'rsatadi.
 *
 * ATAYIN soxta kontent EMAS: hech qanday yasama surat yoki to'qima matn yo'q,
 * faqat kadr ramkasi, belgi va bir qatorlik izoh. Shu bilan birga bu birinchi
 * so'rov kelguncha ko'rinadigan yuklanish holati ham bo'lib xizmat qiladi.
 */
function EmptyFrame(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div style={{ ...FRAME, background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 55%,#0c4a6e 100%)' }}>
      {/* Data/kod uslubidagi to'r — Loader.tsx dagi motiv bilan bir xil */}
      <span aria-hidden="true" style={{
        position: 'absolute', inset: 0, opacity: 0.28,
        backgroundImage: 'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)',
        backgroundSize: '34px 34px',
        maskImage: 'radial-gradient(circle at 50% 45%, #000 35%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 45%, #000 35%, transparent 78%)',
      }} />

      {/* Bo'sh progress bo'lagi — to'ldirilgan holatdagi bilan bir xil joyda */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4 }}>
        <span style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
      </div>

      <div style={{ position: 'absolute', top: 28, left: 14, right: 14 }}>
        <span style={BADGE}><Camera size={12} /> {t('home.moments.badge')}</span>
      </div>

      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28, textAlign: 'center',
      }}>
        <m.span
          initial={{ opacity: 0.55, scale: 0.97 }}
          animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.97, 1, 0.97] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 78, height: 78, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px dashed rgba(125,211,252,0.55)', background: 'rgba(14,165,233,0.10)',
          }}
        >
          <ImagePlus size={30} style={{ color: '#7dd3fc' }} />
        </m.span>

        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.35 }}>
            {t('home.moments.emptyTitle')}
          </p>
          <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.65, marginTop: 6, maxWidth: 260 }}>
            {t('home.moments.emptyText')}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDay(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MomentsStory({ items }: MomentsStoryProps): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);

  const count = items.length;

  const go = useCallback((next: number): void => {
    if (count === 0) return;
    setIndex(((next % count) + count) % count);
    setElapsed(0);
  }, [count]);

  // Harakatni kamaytirish rejimida o'z-o'zidan almashmaydi — foydalanuvchi
  // o'zi boshqaradi (Windows'dagi "Animatsiya effektlari" o'chiq holati ham shu)
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (paused || reduceMotion || count <= 1) return;
    const id = setInterval(() => {
      setElapsed((e: number) => {
        if (e + TICK_MS >= SLIDE_MS) {
          setIndex((i: number) => (i + 1) % count);
          return 0;
        }
        return e + TICK_MS;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [paused, reduceMotion, count]);

  // Surat yo'q (yoki hali yuklanmadi) — bo'sh joy emas, kadr "izi" turadi
  if (count === 0) {
    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, marginInline: 'auto' }}>
        <EmptyFrame />
      </div>
    );
  }

  const current = items[index];
  const day = formatDay(current.happenedAt, i18n.language);

  return (
    <div
      style={{ position: 'relative', width: '100%', maxWidth: 420, marginInline: 'auto' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        style={{ ...FRAME, background: 'linear-gradient(180deg,#e2e8f0 0%,#cbd5e1 100%)', touchAction: 'pan-y' }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start === null) return;
          const dx = e.changedTouches[0].clientX - start;
          if (Math.abs(dx) >= SWIPE_PX) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {/* Rasm. `key` almashganda framer qayta kirish animatsiyasini beradi. */}
        <m.img
          key={current.id}
          src={current.imageUrl}
          alt={current.title}
          loading="lazy"
          decoding="async"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: focusPosition(current), display: 'block',
          }}
        />

        {/* Matn o'qilishi uchun pastdan quyuqlashadigan qatlam */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0) 32%, rgba(15,23,42,0) 45%, rgba(15,23,42,0.82) 100%)',
        }} />

        {/* Tepadagi bo'lakli progress */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4 }}>
          {items.map((it: MomentItem, i: number) => (
            <span key={it.id} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
              <span style={{
                display: 'block', height: '100%', borderRadius: 2, background: '#fff',
                width: i < index ? '100%' : i > index ? '0%' : `${(elapsed / SLIDE_MS) * 100}%`,
                transition: i === index ? `width ${TICK_MS}ms linear` : 'none',
              }} />
            </span>
          ))}
        </div>

        {/* Sarlavha qatori */}
        <div style={{ position: 'absolute', top: 28, left: 14, right: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={BADGE}><Camera size={12} /> {t('home.moments.badge')}</span>

          {count > 1 && (
            <button
              type="button"
              onClick={() => setPaused((p: boolean) => !p)}
              aria-label={t(paused ? 'home.moments.play' : 'home.moments.pause')}
              style={{
                marginLeft: 'auto', width: 26, height: 26, borderRadius: '50%', border: 'none',
                background: 'rgba(15,23,42,0.42)', backdropFilter: 'blur(6px)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {paused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          )}
        </div>

        {/* Chap/o'ng yarmiga bosish — story odati. Klaviatura uchun ham tugma. */}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} aria-label={t('home.moments.prev')}
              style={{ position: 'absolute', top: 44, bottom: 92, left: 0, width: '32%', border: 'none', background: 'transparent', cursor: 'pointer' }} />
            <button type="button" onClick={() => go(index + 1)} aria-label={t('home.moments.next')}
              style={{ position: 'absolute', top: 44, bottom: 92, right: 0, width: '32%', border: 'none', background: 'transparent', cursor: 'pointer' }} />
          </>
        )}

        {/* Izoh */}
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, color: '#fff', pointerEvents: 'none' }}>
          {day && (
            <p style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{day}</p>
          )}
          <p style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3, textShadow: '0 1px 12px rgba(0,0,0,0.4)' }}>
            {current.title}
          </p>
          {current.caption && (
            <p style={{ fontSize: 12.5, opacity: 0.9, lineHeight: 1.6, marginTop: 5 }}>{current.caption}</p>
          )}
        </div>
      </div>
    </div>
  );
}
