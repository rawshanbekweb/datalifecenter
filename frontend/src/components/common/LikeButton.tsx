import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

/**
 * Yoqtirish tugmasi — barcha kontent turlarida bir xil ko'rinadi.
 *
 * Holatni O'ZI boshqarmaydi: `useEngagement` hook'i bergan qiymatlarni
 * ko'rsatadi va bosilganda `onToggle`ni chaqiradi. Shu sabab ro'yxatdagi
 * o'nlab tugma bitta paketli so'rov bilan ishlaydi.
 */

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => void;
  /** Karta ichida kichik, batafsil sahifada kattaroq */
  size?: 'sm' | 'md';
  /** Kontent rangiga moslash (kurs/loyiha kartalarida) */
  color?: string;
}

export default function LikeButton({
  liked, count, onToggle, size = 'sm', color = '#f43f5e',
}: LikeButtonProps): React.ReactElement {
  const { t } = useTranslation();
  const iconSize = size === 'sm' ? 13 : 16;

  return (
    <button
      type="button"
      onClick={(e) => {
        // Kartaning o'zi ko'pincha <Link> ichida — bosish sahifani
        // ochib yubormasligi kerak
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={liked}
      aria-label={liked ? t('engagement.unlike') : t('engagement.like')}
      title={liked ? t('engagement.unlike') : t('engagement.like')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: size === 'sm' ? '4px 9px' : '7px 13px',
        borderRadius: 20, cursor: 'pointer',
        fontSize: size === 'sm' ? 11.5 : 13,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        border: `1px solid ${liked ? color : '#e2e8f0'}`,
        background: liked ? `${color}12` : '#fff',
        color: liked ? color : '#94a3b8',
        transition: 'background .15s ease, border-color .15s ease, color .15s ease',
        lineHeight: 1,
      }}
    >
      <Heart
        size={iconSize}
        // Yoqtirilgan holatda yurak to'ladi — rang bilan birga shakl ham
        // o'zgaradi, shuning uchun rang ko'rmaydiganlar uchun ham farqlanadi
        fill={liked ? color : 'none'}
        style={{
          flexShrink: 0,
          transition: 'transform .18s cubic-bezier(.34,1.56,.64,1)',
          transform: liked ? 'scale(1.12)' : 'none',
        }}
      />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
