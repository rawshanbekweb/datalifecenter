import React from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, MapPin, Layers } from 'lucide-react';

/** Kurs qaysi shaklda o'tishi — backenddagi CourseFormat bilan bir xil. */
export type CourseFormat = 'ONLINE' | 'OFFLINE' | 'HYBRID';

const STYLES: Record<CourseFormat, { icon: React.ComponentType<{ size?: number }>; color: string; bg: string; border: string }> = {
  ONLINE:  { icon: Monitor, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  OFFLINE: { icon: MapPin,  color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  HYBRID:  { icon: Layers,  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
};

interface Props {
  format?: CourseFormat | null;
  size?: 'sm' | 'md';
}

/**
 * Online/offline belgisi — kurs kartasi va kurs sahifasida bir xil ko'rinishi
 * uchun bitta komponent. Format ko'rsatilmagan bo'lsa (eski ma'lumot) hech
 * narsa chizilmaydi.
 */
export default function CourseFormatBadge({ format, size = 'sm' }: Props): React.ReactElement | null {
  const { t } = useTranslation();
  if (!format || !STYLES[format]) return null;

  const style = STYLES[format];
  const Icon = style.icon;
  const small = size === 'sm';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: small ? 4 : 6,
      padding: small ? '3px 9px' : '5px 12px', borderRadius: 20,
      fontSize: small ? 11 : 12.5, fontWeight: 700,
      color: style.color, background: style.bg, border: `1px solid ${style.border}`,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={small ? 11 : 13} /> {t(`courseFormat.${format}`)}
    </span>
  );
}
