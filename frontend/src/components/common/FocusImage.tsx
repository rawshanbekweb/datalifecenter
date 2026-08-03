import React from 'react';
import { avatarPan, focusPosition, ImageFocus } from '../../utils/imageFocus';

/**
 * Fokus nuqtasi hisobga olingan kadrlangan rasm (dumaloq yoki burchagi
 * yumaloqlangan avatar).
 *
 * NEGA ALOHIDA KOMPONENT: gorizontal siljish uchun rasm kadrdan kengroq
 * bo'lishi va ortiqcha qismi KESILISHI kerak. Kesish esa o'rovchi qatlamda
 * bo'ladi — `transform` to'g'ridan-to'g'ri `<img>` ga berilsa, u rasm bilan
 * birga dumaloq ramkani ham surib yuborardi. Shu sabab kadr (o'rov) va rasm
 * ajratildi; avval bu yetti joyda qo'lda yozilgan `<img>` edi.
 */
interface FocusImageProps {
  src: string;
  alt: string;
  /** Kadr o'lchami (px). Bitta son berilsa kvadrat. */
  size: number | { width: number; height: number };
  /** `'circle'` yoki burchak radiusi (px) */
  radius: 'circle' | number;
  focus: ImageFocus | null | undefined;
  /** Kadrga qo'shiladigan uslub — ramka, chekka, flex xatti-harakati */
  style?: React.CSSProperties;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  loading?: 'lazy' | 'eager';
}

export default function FocusImage({ src, alt, size, radius, focus, style, onError, loading }: FocusImageProps): React.ReactElement {
  const width = typeof size === 'number' ? size : size.width;
  const height = typeof size === 'number' ? size : size.height;

  return (
    <span
      style={{
        display: 'block',
        width,
        height,
        borderRadius: radius === 'circle' ? '50%' : radius,
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt}
        onError={onError}
        loading={loading}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // Vertikal kadrlash avvalgidek `object-position` orqali — portret
          // suratda balandlikda ortiqcha qism bor, ya'ni u ishlaydi.
          objectPosition: focusPosition(focus),
          // Gorizontal siljish esa `transform` orqali: kengligiga ortiqcha
          // joy YO'Q, shuning uchun rasm shu yerda kerakli miqdorda
          // kattalashtiriladi. Fokus markazda bo'lsa qiymat `none`.
          transform: avatarPan(focus),
          transformOrigin: 'center',
        }}
      />
    </span>
  );
}
