import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { focusPosition, ImageFocus } from '../../utils/imageFocus';

/**
 * "DATA LIFE'da bir kun" — bosh sahifadagi rasm galereyasi.
 *
 * Suratlar yon tarafdan sirg'alib kirib almashadi; pastda kichik nishonlar
 * (thumbnail) qatori turadi va joriy surat ajratib ko'rsatiladi. Chetlardagi
 * strelkalar va telefonda barmoq bilan surish ham ishlaydi.
 *
 * Ilgari bu blok Instagram "story" uslubida edi (tepada bo'lakli progress,
 * kadrning yarmiga bosish) — foydalanuvchi oddiy, yonidan oqib keladigan
 * galereyani afzal ko'rdi.
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
// Barmoq shu masofadan ko'p sursa slayd almashadi
const SWIPE_PX = 40;

/**
 * Sirg'alish variantlari. Inline `exit={{...}}` EMAS, chunki chiqayotgan
 * element o'zining oxirgi render'idagi qiymatni saqlab qoladi va yo'nalish
 * eskirib qolardi. `AnimatePresence custom={dir}` esa yangi yo'nalishni
 * chiqayotgan elementga ham uzatadi.
 */
const SLIDE = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%' }),
};

const FRAME: React.CSSProperties = {
  position: 'relative', aspectRatio: '4 / 5', borderRadius: 20, overflow: 'hidden',
  boxShadow: '0 12px 40px rgba(15,23,42,0.16)', border: '1px solid rgba(255,255,255,0.6)',
};

function formatDay(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Surat hali qo'shilmagandagi shablon.
 *
 * Ataylab sokin va OCH rangda: bu joy e'tiborni tortmasligi kerak, u shunchaki
 * kelajakdagi kadrning o'rnini belgilab turadi. Hech qanday yasama surat yoki
 * to'qima matn yo'q. Ayni paytda birinchi so'rov kelguncha ko'rinadigan
 * yuklanish holati ham shu — shuning uchun sahifa ochilganda joy sakramaydi.
 */
function EmptyFrame(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div style={{
      ...FRAME,
      background: '#ffffff',
      border: '1.5px dashed #e2e8f0',
      boxShadow: '0 8px 28px rgba(15,23,42,0.06)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: 28, textAlign: 'center',
    }}>
      <span style={{
        width: 54, height: 54, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', border: '1px solid #e2e8f0',
      }}>
        <ImageIcon size={22} style={{ color: '#cbd5e1' }} />
      </span>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#475569', lineHeight: 1.4 }}>
          {t('home.moments.emptyTitle')}
        </p>
        <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.65, marginTop: 5, maxWidth: 240 }}>
          {t('home.moments.emptyText')}
        </p>
      </div>
    </div>
  );
}

export default function MomentsStory({ items }: MomentsStoryProps): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState<number>(0);
  // Slayd qaysi tomondan kirishini belgilaydi: 1 = o'ngdan, -1 = chapdan
  const [dir, setDir] = useState<number>(1);
  const [paused, setPaused] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);

  const count = items.length;

  const go = useCallback((next: number, direction: number): void => {
    if (count === 0) return;
    setDir(direction);
    setIndex(((next % count) + count) % count);
  }, [count]);

  // Harakatni kamaytirish rejimida o'z-o'zidan almashmaydi
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (paused || reduceMotion || count <= 1) return;
    const id = setTimeout(() => { setDir(1); setIndex((i: number) => (i + 1) % count); }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, paused, reduceMotion, count]);

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
        style={{ ...FRAME, background: '#f1f5f9', touchAction: 'pan-y' }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start === null) return;
          const dx = e.changedTouches[0].clientX - start;
          if (Math.abs(dx) >= SWIPE_PX) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        }}
      >
        {/* Surat yon tarafdan sirg'alib kiradi, eskisi qarama-qarshi tomonga chiqadi */}
        <AnimatePresence initial={false} custom={dir}>
          <m.div
            key={current.id}
            custom={dir}
            variants={SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.55 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <img
              src={current.imageUrl}
              alt={current.title}
              loading="lazy"
              decoding="async"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: focusPosition(current), display: 'block',
              }}
            />
            {/* Matn o'qilishi uchun pastdan quyuqlashadigan qatlam */}
            <span aria-hidden="true" style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(15,23,42,0) 45%, rgba(15,23,42,0.82) 100%)',
            }} />
            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, color: '#fff' }}>
              {day && (
                <p style={{ fontSize: 11, opacity: 0.85, marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{day}</p>
              )}
              <p style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3, textShadow: '0 1px 12px rgba(0,0,0,0.4)' }}>
                {current.title}
              </p>
              {current.caption && (
                <p style={{ fontSize: 12.5, opacity: 0.9, lineHeight: 1.6, marginTop: 5 }}>{current.caption}</p>
              )}
            </div>
          </m.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <NavButton side="left" label={t('home.moments.prev')} onClick={() => go(index - 1, -1)} />
            <NavButton side="right" label={t('home.moments.next')} onClick={() => go(index + 1, 1)} />
          </>
        )}
      </div>

      {/* Pastdagi nishonlar qatori — galereya ekanini ko'rsatadi va o'tish imkonini beradi */}
      {count > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {items.map((it: MomentItem, i: number) => (
            <button
              key={it.id}
              type="button"
              onClick={() => go(i, i > index ? 1 : -1)}
              aria-label={it.title}
              aria-current={i === index}
              style={{
                width: 44, height: 44, borderRadius: 12, overflow: 'hidden', padding: 0, cursor: 'pointer',
                border: i === index ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                boxShadow: i === index ? '0 4px 12px rgba(14,165,233,0.28)' : 'none',
                opacity: i === index ? 1 : 0.65, transition: 'opacity .2s, border-color .2s',
                background: '#f1f5f9',
              }}
            >
              <img src={it.imageUrl} alt="" loading="lazy" style={{
                width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: focusPosition(it), display: 'block',
              }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface NavButtonProps {
  side: 'left' | 'right';
  label: string;
  onClick: () => void;
}

function NavButton({ side, label, onClick }: NavButtonProps): React.ReactElement {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'absolute', top: '50%', [side]: 10, transform: 'translateY(-50%)',
        width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(6px)',
        boxShadow: '0 2px 10px rgba(15,23,42,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
      }}
    >
      <Icon size={17} style={{ color: '#0f172a' }} />
    </button>
  );
}
